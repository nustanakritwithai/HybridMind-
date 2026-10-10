"""SQLite-only mock WordPress Draft Adapter V0.2.
NO HTTP client, credentials, external calls, scheduled tasks or publication method.
Owner-scoped, atomic durable idempotency, revision conflicts, lease, bounded retries.
"""
from __future__ import annotations
import hashlib, json, sqlite3, sys
from pathlib import Path
from datetime import datetime, timedelta, timezone
from tools.newsroom.pipeline import canonical, iso

OWNER='hybridmind-newsroom-v2-test-only'
def sha(data:str):return hashlib.sha256(data.encode('utf8')).hexdigest()
def stable_job(article_id:str,url:str)->str:
    return 'hmv2-'+sha(article_id+'\0'+canonical(url))[:28]

class MockDraftAdapter:
    def __init__(self,db):
        Path(db).parent.mkdir(parents=True,exist_ok=True)
        self.db=sqlite3.connect(str(db),timeout=10,isolation_level=None)
        self.db.row_factory=sqlite3.Row
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.execute('PRAGMA busy_timeout=10000')
        self.db.executescript('''
            CREATE TABLE IF NOT EXISTS seen(
              canonical_url TEXT PRIMARY KEY, event_key TEXT NOT NULL,
              item_hash TEXT NOT NULL, job_id TEXT UNIQUE NOT NULL, discovered_at TEXT NOT NULL);
            CREATE INDEX IF NOT EXISTS event_idx ON seen(event_key);
            CREATE TABLE IF NOT EXISTS jobs(
              job_id TEXT PRIMARY KEY, article_id TEXT NOT NULL UNIQUE,
              state TEXT NOT NULL, worker TEXT, lease_until TEXT,
              attempt_count INTEGER NOT NULL DEFAULT 0,
              mock_post_id INTEGER UNIQUE, approved_output_hash TEXT NOT NULL,
              owner_tag TEXT NOT NULL, last_error TEXT NOT NULL DEFAULT '');
            CREATE TABLE IF NOT EXISTS posts(
              post_id INTEGER PRIMARY KEY AUTOINCREMENT,
              job_id TEXT NOT NULL UNIQUE, owner_tag TEXT NOT NULL,
              status TEXT NOT NULL CHECK(status='draft'),
              revision INTEGER NOT NULL, content TEXT NOT NULL,
              content_hash TEXT NOT NULL, editor_changed INTEGER NOT NULL DEFAULT 0);
            CREATE TABLE IF NOT EXISTS budgets(day TEXT PRIMARY KEY, news_count INTEGER NOT NULL DEFAULT 0);
        ''')
    def close(self):self.db.close()
    def tx(self):self.db.execute('BEGIN IMMEDIATE')
    def commit(self):self.db.execute('COMMIT')
    def rollback(self):self.db.execute('ROLLBACK')
    def get(self,sql,params=()):return self.db.execute(sql,params).fetchone()
    def count(self):return self.get('SELECT COUNT(*) AS n FROM posts')['n']

    def read_owned(self,job_id):
        row=self.get('SELECT * FROM posts WHERE job_id=?',(job_id,))
        if not row:return None
        job=self.get('SELECT * FROM jobs WHERE job_id=?',(job_id,))
        if (not job or job['owner_tag']!=OWNER or row['owner_tag']!=OWNER or
            row['status']!='draft' or job['article_id'] is None):
            return None
        return row

    def reconcile(self,job_id,expected_hash):
        self.tx()
        try:
            job=self.get('SELECT * FROM jobs WHERE job_id=?',(job_id,))
            post=self.read_owned(job_id)
            if not job or not post:
                self.commit();return {'state':'HOLD','reason':'NO_OWNED_DRAFT_TO_RECONCILE'}
            if (job['approved_output_hash']!=expected_hash or post['content_hash']!=sha(post['content']) or
                post['content_hash']!=expected_hash or post['editor_changed'] or post['revision']!=1):
                self.commit();return {'state':'HOLD','reason':'CONFLICT_HUMAN_EDIT_OR_CHANGED_OUTPUT','mock_post_id':post['post_id']}
            self.db.execute('UPDATE jobs SET state=?, mock_post_id=?, worker=NULL, lease_until=NULL, last_error=? WHERE job_id=?',
                ('DRAFTED',post['post_id'],'',job_id))
            self.commit()
            return {'state':'MOCK_DRAFT_RECONCILED','mock_post_id':post['post_id'], 'revision':post['revision'], 'readback_hash':post['content_hash']}
        except BaseException:self.rollback();raise

    def human_edit(self,post_id,changed_content):
        self.tx()
        try:
            post=self.get('SELECT * FROM posts WHERE post_id=?',(post_id,))
            if not post or post['owner_tag']!=OWNER:
                self.commit();return False
            self.db.execute('UPDATE posts SET content=?,content_hash=?,revision=revision+1,editor_changed=1 WHERE post_id=?',
                            (changed_content,sha(changed_content),post_id))
            self.commit();return True
        except BaseException:self.rollback();raise

    def hold_lease(self,job_id,worker,now,seconds=120):
        self.tx()
        try:
            job=self.get('SELECT * FROM jobs WHERE job_id=?',(job_id,))
            if not job:
                self.commit();return False
            # DRAFTED jobs are reconciled/read back; never write again.
            if job['state']=='DRAFTED' or (job['lease_until'] and iso(job['lease_until'])>iso(now)) or job['attempt_count']>=3:
                self.commit();return False
            expiry=(iso(now)+timedelta(seconds=seconds)).isoformat()
            self.db.execute('UPDATE jobs SET worker=?, lease_until=?,attempt_count=attempt_count+1, state=? WHERE job_id=?',
                            (worker,expiry,'SENDING',job_id))
            self.commit();return True
        except BaseException:self.rollback();raise

    def draft(self,item,manifest,html,now,worker='worker',timeout_after_commit=False,stop=False):
        """Mock transactional write. Does not have an HTTP API or permission to publish."""
        if stop:return {'state':'HOLD','reason':'STOP_SWITCH'}
        jid=stable_job(manifest['article_id'],item['canonical_url'])
        canon=canonical(item['canonical_url']); digest=sha(html)
        itemhash=sha(json.dumps({k:item[k] for k in ('title','summary','source_published_at')},ensure_ascii=False,sort_keys=True))
        self.tx()
        try:
            prior=self.get('SELECT * FROM seen WHERE canonical_url=?',(canon,))
            if prior and prior['item_hash']!=itemhash:
                self.commit();return {'state':'HOLD','reason':'SOURCE_CORRECTION_REQUIRES_REVIEW','job_id':prior['job_id']}
            if not prior:
                cross=self.get('SELECT job_id FROM seen WHERE event_key=? AND canonical_url!=?',(item['event_key'],canon))
                if cross:
                    self.commit();return {'state':'HOLD','reason':'CROSS_SOURCE_SAME_EVENT','job_id':cross['job_id']}
                clash=self.get('SELECT job_id FROM jobs WHERE article_id=?',(manifest['article_id'],))
                if clash:
                    self.commit();return {'state':'HOLD','reason':'ARTICLE_ID_ALREADY_CLAIMED'}
                caps=json.loads((Path(__file__).resolve().parents[2]/'config/newsroom-budget.v1.json').read_text())
                day=iso(now).date().isoformat()
                self.db.execute('INSERT OR IGNORE INTO budgets(day) VALUES(?)',(day,))
                if self.get('SELECT news_count FROM budgets WHERE day=?',(day,))['news_count']>=caps['news_count']:
                    self.commit();return {'state':'HOLD','reason':'DAILY_BUDGET_EXCEEDED'}
                self.db.execute('INSERT INTO seen VALUES (?,?,?,?,?)',(canon,item['event_key'],itemhash,jid,item['fetched_at']))
                self.db.execute('INSERT INTO jobs(job_id,article_id,state,approved_output_hash,owner_tag) VALUES (?,?,?,?,?)',
                                (jid,manifest['article_id'],'NEW',digest,OWNER))
                self.db.execute('UPDATE budgets SET news_count=news_count+1 WHERE day=?',(day,))
            else:
                j=self.get('SELECT * FROM jobs WHERE job_id=?',(jid,))
                if not j or j['approved_output_hash']!=digest:
                    self.commit();return {'state':'HOLD','reason':'RENDER_OR_JOB_CHANGED_REQUIRES_REVIEW','job_id':jid}
            self.commit()
        except BaseException:self.rollback();raise

        existing=self.read_owned(jid)
        if existing:
            rec=self.reconcile(jid,digest)
            if rec['state']=='MOCK_DRAFT_RECONCILED':
                rec['state']='MOCK_DRAFT_REPLAY'
            rec['job_id']=jid
            return rec
        if not self.hold_lease(jid,worker,now):
            return {'state':'HOLD','reason':'JOB_LOCKED_OR_RETRY_LIMIT','job_id':jid}
        self.tx()
        try:
            # This is a mock post. A real adapter must do a WP readback after timeout.
            duplicate=self.get('SELECT * FROM posts WHERE job_id=?',(jid,))
            if duplicate:
                self.commit()
                return self.reconcile(jid,digest)
            cur=self.db.execute('INSERT INTO posts(job_id,owner_tag,status,revision,content,content_hash) VALUES (?,?,?,1,?,?)',
                                (jid,OWNER,'draft',html,digest))
            pid=cur.lastrowid
            self.commit()  # Durable mock commit before optional simulated failure
        except BaseException:self.rollback();raise
        if timeout_after_commit:
            receipt=self.reconcile(jid,digest)
            return {'state':receipt['state'],'reason':'SIMULATED_TIMEOUT_AFTER_COMMIT','mock_post_id':receipt.get('mock_post_id'),
                    'readback_hash':receipt.get('readback_hash'),'job_id':jid, 'recovered':receipt['state']=='MOCK_DRAFT_RECONCILED'}
        receipt=self.reconcile(jid,digest)
        return {**receipt,'state':'MOCK_DRAFT_CREATED','job_id':jid}

def main():
    try:
        r=json.load(sys.stdin)
        adapter=MockDraftAdapter(r['db'])
        try:
            out=adapter.draft(r['item'],r['manifest'],r['html'],r['now'],r.get('worker','worker'),r.get('mock_timeout',False),r.get('stop',False))
            out.update({'mock_only':True,'production_wp_post_id':None,'api_calls':0,'cost_usd':0.0,'mock_total_posts':adapter.count()})
            print(json.dumps(out,ensure_ascii=False))
        finally:adapter.close()
    except Exception as exc:
        print(json.dumps({'state':'HOLD','reason':'MOCK_ADAPTER_EXCEPTION:'+type(exc).__name__,'mock_only':True,'production_wp_post_id':None,'api_calls':0,'cost_usd':0.0}))
if __name__=='__main__':main()
