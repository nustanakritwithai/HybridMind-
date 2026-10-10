"""Offline E2E Node CLI integration + mock adapter safety tests.
Commands: python3 -m unittest discover -s tests -p 'test_newsroom_v2.py' -v
No external network or WordPress writes.
"""
import copy,json,subprocess,tempfile,unittest,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from tools.newsroom_v2.mock_adapter import MockDraftAdapter, stable_job
from tools.newsroom_v2.guard_html import check_html
from tools.newsroom.pipeline import attach_reader_modules
NOW='2026-10-10T20:40:00+07:00'
TEMPLATE=json.loads((ROOT/'examples/newsroom-agent-security.v2.json').read_text())

class CLIIntegration(unittest.TestCase):
    def setUp(self):
        self.t=tempfile.TemporaryDirectory();self.addCleanup(self.t.cleanup)
        self.dir=Path(self.t.name)
        self.db=self.dir/'jobs.db'
    def call(self,sample=None,timeout=False,subname='test'):
        sample=sample or TEMPLATE
        dest=self.dir/subname
        dest.mkdir(exist_ok=True)
        inputfile=dest/'input.json';inputfile.write_text(json.dumps(sample,ensure_ascii=False),'utf8')
        command=['node','tools/newsroom_v2/cli.mjs','run','--input',str(inputfile),'--out',str(dest/'output'),
                 '--db',str(self.db),'--now',NOW]
        if timeout:command+=['--mock-timeout']
        result=subprocess.run(command,cwd=ROOT,capture_output=True,text=True,timeout=35)
        qa=json.loads((dest/'output/qa-report.json').read_text()) if (dest/'output/qa-report.json').exists() else {}
        htmlfile=dest/'output/visual-article.gutenberg.html'
        return result,qa,htmlfile
    def hold(self,s,part):
        result,qa,output=self.call(s)
        self.assertEqual(result.returncode,3,(result.stdout,result.stderr))
        self.assertEqual(qa.get('status'),'HOLD')
        self.assertIn(part,json.dumps(qa,ensure_ascii=False))
        self.assertFalse(output.exists(),'HOLD may not leave promotable markup')
        self.assertFalse(qa.get('ready_for_wordpress'))
        return qa
    def test_01_happy_english_thai_sources(self):
        result,qa,output=self.call()
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(qa['status'],'MOCK_DRAFT_CREATED')
        self.assertEqual(qa['technical_qa'],'PASS')
        self.assertFalse(qa['editorial_approved'])
        self.assertTrue(output.exists())
        text=output.read_text('utf8')
        self.assertIn('แหล่งอ้างอิงที่ตรวจได้',text)
        self.assertIn('research.google',text)
        self.assertIn('<!-- wp:group',text)
        self.assertIn('<details>',text)
        self.assertNotIn('<script',text)
        self.assertEqual(qa['rendered_bytes'],len(text.encode('utf8')))
    def test_02_schema_wrong(self):
        s=copy.deepcopy(TEMPLATE);s['manifest']['status']='publish'
        self.hold(s,'SCHEMA')
    def test_03_required_missing(self):
        s=copy.deepcopy(TEMPLATE);del s['item']['fetched_at']
        self.hold(s,'SCHEMA')
    def test_04_unknown_source_id(self):
        s=copy.deepcopy(TEMPLATE);s['manifest']['claims'][0]['source_ids']=['src-nonexistent']
        self.hold(s,'CLAIM_REFERENCES_MISSING_SOURCE')
    def test_05_evidence_source_unregistered(self):
        s=copy.deepcopy(TEMPLATE);s['evidence_packet']['evidence'][0]['source_id']='src-ghost-source'
        self.hold(s,'EVIDENCE_REFERENCES_MISSING_SOURCE')
    def test_06_missing_source_date(self):
        s=copy.deepcopy(TEMPLATE);s['item']['source_published_at']=None
        self.hold(s,'SCHEMA')
    def test_07_invalid_calendar_date(self):
        s=copy.deepcopy(TEMPLATE);s['item']['event_at']='2026-02-30'
        self.hold(s,'SCHEMA')
    def test_08_old_date_not_new(self):
        s=copy.deepcopy(TEMPLATE)
        s['item']['source_published_at']='2026-09-01';s['evidence_packet']['source_published_at']='2026-09-01'
        s['evidence_packet']['sources'][0]['published_at']='2026-09-01'
        s['manifest']['sources'][0]['published_at']='2026-09-01'
        self.hold(s,'OLD_NEWS_REQUIRES_REVIEW')
    def test_09_unknown_event_date_is_allowed(self):
        result,qa,output=self.call()
        self.assertEqual(result.returncode,0)
        self.assertIsNone(TEMPLATE['item']['event_at'])
        self.assertTrue(output.exists())
    def test_10_thai_special_chars_safe_as_data(self):
        s=copy.deepcopy(TEMPLATE)
        s['manifest']['modules'][2]['paragraphs'].append('ข้อความภายนอก: <img src=x onerror="alert(x)"> & ทดสอบ <> คำสั่งปลอม')
        result,qa,output=self.call(s)
        self.assertEqual(result.returncode,0,result.stderr)
        text=output.read_text()
        self.assertIn('&lt;img src=x onerror=&quot;alert(x)&quot;&gt;',text)
        self.assertNotIn('<img src=x onerror=',text)
    def test_11_long_thai_headline_within_schema(self):
        s=copy.deepcopy(TEMPLATE);s['manifest']['title']='การพัฒนา AI Agent กับความปลอดภัย: '+'ภาษาไทยทดสอบ' * 12
        self.assertLessEqual(len(s['manifest']['title']),220)
        result,qa,_=self.call(s)
        self.assertEqual(result.returncode,0,result.stderr)
    def test_12_headline_too_long(self):
        s=copy.deepcopy(TEMPLATE);s['manifest']['title']='ก'*221
        self.hold(s,'SCHEMA')
    def test_13_bad_url_scheme(self):
        s=copy.deepcopy(TEMPLATE)
        for section in [s['item'],s['evidence_packet']['sources'][0],s['manifest']['sources'][0]]:
            key='canonical_url' if section is s['item'] else 'url'
            section[key]='javascript:alert(x)'
        self.hold(s,'SCHEMA')
    def test_14_remote_image_unverified(self):
        s=copy.deepcopy(TEMPLATE)
        s['manifest']['modules'].append({'id':'coverpic','type':'image','title':'ปก','src':'https://hybridmind.online/wp-content/uploads/sample.jpg',
             'media_id':123,'caption':'ปกทดสอบ','alt':'ภาพประกอบ AI Agent จากคลังสื่อ','source_ids':['src-google-research']})
        self.hold(s,'IMAGE_AVAILABILITY_UNVERIFIED_OFFLINE')
    def test_15_editorial_gate_holds(self):
        s=copy.deepcopy(TEMPLATE);s['manifest']['gates']['editorial']='APPROVED'
        self.hold(s,'EDITORIAL_OR_VISUAL_NOT_ELIGIBLE')
    def test_16_conflicting_sources_hold(self):
        s=copy.deepcopy(TEMPLATE);s['evidence_packet']['risk_flags']=['CONTRADICTORY_SOURCES']
        self.hold(s,'RISK_OR_REVIEW_HOLD')
    def test_17_secret_pattern_prevent_export(self):
        s=copy.deepcopy(TEMPLATE);s['manifest']['modules'][2]['paragraphs'].append('key sk-'+'X'*24)
        qa=self.hold(s,'POSSIBLE_SECRET_IN_INPUT')
        self.assertNotIn('sk-'+'X'*24,json.dumps(qa))
    def test_18_draft_replay_same_id_once(self):
        a,aa,_=self.call(subname='first');b,bb,_=self.call(subname='second')
        self.assertEqual(a.returncode,0);self.assertEqual(b.returncode,0)
        self.assertEqual(bb['status'],'MOCK_DRAFT_REPLAY')
        self.assertEqual(bb['mock_post_id'],aa['mock_post_id'])
        d=MockDraftAdapter(self.db)
        try:self.assertEqual(d.count(),1)
        finally:d.close()
    def test_19_write_timeout_after_commit_reconcile(self):
        res,qa,_=self.call(timeout=True)
        self.assertEqual(res.returncode,0,res.stderr)
        self.assertEqual(qa['status'],'MOCK_DRAFT_RECONCILED')
        self.assertEqual(qa['mock_total_posts'],1)
        replay,rec,_=self.call(subname='second')
        self.assertEqual(rec['status'],'MOCK_DRAFT_REPLAY')
        self.assertEqual(rec['mock_post_id'],qa['mock_post_id'])
    def test_20_human_conflict_blocks_overwrite(self):
        r,qa,_=self.call()
        d=MockDraftAdapter(self.db)
        try:self.assertTrue(d.human_edit(qa['mock_post_id'],'มนุษย์แก้ข้อความหลังอ่าน'))
        finally:d.close()
        other,report,output=self.call(subname='retry')
        self.assertEqual(other.returncode,3)
        self.assertIn('CONFLICT_HUMAN_EDIT_OR_CHANGED_OUTPUT',json.dumps(report))
        self.assertFalse(output.exists())
    def test_21_worker_lock_is_atomic(self):
        a=MockDraftAdapter(self.db);b=MockDraftAdapter(self.db)
        try:
            jid=stable_job(TEMPLATE['manifest']['article_id'],TEMPLATE['item']['canonical_url'])
            html='local-only'; a.tx()
            a.db.execute('INSERT INTO jobs(job_id,article_id,state,approved_output_hash,owner_tag) VALUES (?,?,?,?,?)',
               (jid,TEMPLATE['manifest']['article_id'],'NEW','0'*64,'hybridmind-newsroom-v2-test-only'))
            a.commit()
            self.assertTrue(a.hold_lease(jid,'worker-a',NOW))
            self.assertFalse(b.hold_lease(jid,'worker-b',NOW))
        finally:a.close();b.close()
    def test_22_cross_source_duplicate_event(self):
        res,report,_=self.call(subname='origin');self.assertEqual(res.returncode,0)
        s=copy.deepcopy(TEMPLATE);url='https://research.google/blog/second-source-report/'
        s['item']['canonical_url']=url
        s['evidence_packet']['sources'][0]['url']=url
        s['manifest']['sources'][0]['url']=url
        s['manifest']['article_id']='hm-second-source-same-event-20261005'
        s['evidence_packet']['article_id']=s['manifest']['article_id']
        self.assertEqual(s['item']['event_key'],TEMPLATE['item']['event_key'])
        self.hold(s,'CROSS_SOURCE_SAME_EVENT')
    def test_23_change_to_source_requires_review(self):
        res,report,_=self.call(subname='original');self.assertEqual(res.returncode,0)
        s=copy.deepcopy(TEMPLATE);s['item']['summary']='Source corrected its statement in October.'
        self.hold(s,'SOURCE_CORRECTION_REQUIRES_REVIEW')
    def test_24_url_scheme_guard_not_only_script(self):
        sample=TEMPLATE
        base=(ROOT/'output/cli-base.gutenberg.html').read_text()
        html=attach_reader_modules(base,sample['evidence_packet'],sample['faqs'])
        self.assertEqual(check_html(html,sample['evidence_packet']['sources']),[])
        issues=check_html(html.replace('rel="noopener noreferrer"','onclick="alert(x)"'),sample['evidence_packet']['sources'])
        self.assertTrue(any('FORBIDDEN_ATTRIBUTE' in x for x in issues),issues)
        issues=check_html(html.replace('href="https://','href="javascript:'),sample['evidence_packet']['sources'])
        self.assertTrue(any('UNSAFE' in x or 'URL_NOT_EVIDENCED' in x for x in issues),issues)
        issues=check_html(html.replace('<!-- wp:group','<!-- wp:unsafe-html',1),sample['evidence_packet']['sources'])
        self.assertIn('UNSAFE_BLOCK:unsafe-html',issues)
    def test_25_ledger_only_owns_created_mock(self):
        d=MockDraftAdapter(self.db)
        try:self.assertFalse(d.human_edit(57,'No'));self.assertFalse(d.human_edit(67,'No'))
        finally:d.close()

if __name__=='__main__':unittest.main()
