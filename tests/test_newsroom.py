"""Offline regression checks. Run: python -m unittest discover -s tests -v"""
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from tools.newsroom.collector import parse_feed
from tools.newsroom import pipeline as p

ROOT = Path(__file__).resolve().parents[1]
SAMPLE = json.loads((ROOT/'examples/newsroom-agent-security.v1.json').read_text())


class NewsroomChecks(unittest.TestCase):
    def setUp(self):
        self.t = tempfile.TemporaryDirectory()
        self.addCleanup(self.t.cleanup)
        self.ledger = p.Ledger(Path(self.t.name)/'test.sqlite')
        self.addCleanup(self.ledger.close)
        self.now = '2026-10-10T20:40:00+07:00'
        self.item = SAMPLE['item'].copy()

    def test_canonical_duplicate_and_replay(self):
        first = self.ledger.ingest(self.item, self.now)
        self.assertEqual(first['state'], 'NEW')
        again = dict(self.item, canonical_url=self.item['canonical_url']+'?utm_source=spam')
        dup = self.ledger.ingest(again, self.now)
        self.assertEqual(dup['state'], 'DUPLICATE')
        self.assertEqual(first['item_id'], dup['item_id'])

    def test_cross_source_event_duplicate(self):
        self.ledger.ingest(self.item, self.now)
        other = dict(self.item, canonical_url='https://independent.example.net/same-news',source_id='other')
        self.assertEqual(self.ledger.ingest(other, self.now)['reason'], 'CROSS_SOURCE_SAME_EVENT_KEY')

    def test_age_and_missing_date_hold(self):
        item = dict(self.item, source_published_at='2026-09-10')
        self.assertEqual(self.ledger.ingest(item, self.now)['reason'], 'OLD_SOURCE_PUBLICATION')
        missing = dict(self.item, canonical_url='https://news.example.org/missing', event_key='another-event', source_published_at=None)
        self.assertEqual(self.ledger.ingest(missing, self.now)['reason'], 'MISSING_OR_INVALID_DATE')

    def test_edit_requires_review(self):
        self.ledger.ingest(self.item, self.now)
        changed = dict(self.item, summary='corrected source text')
        self.assertEqual(self.ledger.ingest(changed, self.now)['reason'], 'SOURCE_CHANGED')

    def test_limit_lock_and_reconcile_timeout(self):
        item_id = self.ledger.ingest(self.item, self.now)['item_id']
        self.ledger.ready(item_id)
        job = self.ledger.job(item_id,SAMPLE['manifest']['article_id'], self.now)
        self.assertTrue(self.ledger.lock(job,'worker1',self.now))
        self.assertFalse(self.ledger.lock(job,'worker2',self.now))
        with self.assertRaises(TimeoutError):
            self.ledger.mock_write(job,'test Gutenberg',self.now,timeout_after_commit=True)
        first = self.ledger.reconcile(job,self.now)
        self.assertIsInstance(first,int)
        self.ledger.unlock(job,'worker1')
        self.assertEqual(self.ledger.reconcile(job,self.now),first)
        self.assertEqual(self.ledger.db.execute('SELECT COUNT(*) FROM mock_wp').fetchone()[0],1)

    def test_cost_cap(self):
        caps={'news_count':1,'model_calls':0,'tokens':0,'cost_usd':0}
        self.assertTrue(self.ledger.reserve('2026-10-10',1,0,0,0,caps))
        self.assertFalse(self.ledger.reserve('2026-10-10',1,0,0,0,caps))
        self.assertFalse(self.ledger.reserve('2026-10-10',0,1,0,0,caps))

    def test_escaped_reader_and_citations(self):
        faq=[{'question':'<script>alert(1)</script>','answer':'<&>'}]
        result=p.attach_reader_modules('<!-- wp:paragraph --><p>ok</p><!-- /wp:paragraph -->',SAMPLE['evidence_packet'],faq)
        self.assertIn('details',result)
        self.assertIn('https://research.google/blog/',result)
        self.assertNotIn('<script>',result)
        self.assertIn('&lt;script&gt;',result)

    def test_schema_and_editorial_holds(self):
        # Actual checked-out repo contains the unchanged canonical v0.1 schema.
        if not (ROOT/'contracts/visual-article-v1.schema.json').exists():
            self.skipTest('Existing renderer schema absent from standalone delta bundle')
        packet=json.loads(json.dumps(SAMPLE['evidence_packet']))
        manifest=json.loads(json.dumps(SAMPLE['manifest']))
        self.assertEqual(p.editorial_check(packet,manifest),[])
        manifest['gates']['research']='UNKNOWN'
        self.assertIn('EVIDENCE_GATES_NOT_PASS',p.editorial_check(packet,manifest))
        manifest['gates']['research']='PASS'
        manifest['claims'][0]['source_ids']=[]
        self.assertTrue(any('CLAIM_MISSING_EVIDENCE' in x for x in p.editorial_check(packet,manifest)))
        manifest=json.loads(json.dumps(SAMPLE['manifest']))
        manifest['title']='Breaking breakthrough 999999 totally real!'
        self.assertTrue(any('UNSUPPORTED_NUMBERS' in x for x in p.editorial_check(packet,manifest)))

    def test_rss_and_atom_parser(self):
        rss=b'<rss><channel><item><title>AI research</title><link>https://example.com/a</link><pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>'
        items=parse_feed(rss,'official',self.now)
        self.assertEqual(items[0]['source_published_at'],'2026-10-05')
        atom=b'<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>New model</title><link href="https://example.com/atom"/><updated>2026-10-05T01:00:00Z</updated></entry></feed>'
        self.assertEqual(len(parse_feed(atom,'official',self.now)),1)
        with self.assertRaises(ValueError):parse_feed(b'<!DOCTYPE html><rss/>','official',self.now)

    def test_source_registry_unactivated(self):
        sources=p.source_registry()
        self.assertGreaterEqual(len(sources['sources']),5)
        self.assertFalse(sources['network_enabled'])
        self.assertTrue(all(not src['enabled'] for src in sources['sources']))

if __name__=='__main__':unittest.main()
