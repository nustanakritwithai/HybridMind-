"""Hybrid Mind Newsroom V0.1 — local, fail-closed pipeline. Zero production writers.

Run from repository root: python -m tools.newsroom.pipeline demo --out .local/newsroom
Python 3.11+, jsonschema>=4.21, Node 18+ (existing Gutenberg renderer).
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sqlite3
import subprocess
from datetime import datetime, timedelta, timezone, date
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[2]
STATES = {"NEW", "DUPLICATE", "NEEDS_REVIEW", "READY_FOR_DRAFT", "DRAFTED", "FAILED"}
TRACKING = {"fbclid", "gclid", "mc_cid", "mc_eid", "igshid"}


def digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()


def canonical(raw: str) -> str:
    p = urlsplit(raw)
    if p.scheme.lower() != "https" or not p.hostname or p.username or p.password:
        raise ValueError("canonical URL must be HTTPS without credentials")
    hostname = p.hostname.lower()
    port = f":{p.port}" if p.port and p.port != 443 else ""
    path = re.sub(r"/{2,}", "/", p.path or "/")
    if len(path) > 1:
        path = path.rstrip("/")
    query = sorted((k, v) for k, v in parse_qsl(p.query, keep_blank_values=True)
                   if not k.lower().startswith("utm_") and k.lower() not in TRACKING)
    return urlunsplit(("https", hostname + port, path, urlencode(query), ""))


def iso(value: str) -> datetime:
    if not isinstance(value, str) or not value:
        raise ValueError("missing date")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("date must include UTC offset")
    return parsed.astimezone(timezone.utc)


def source_day(value: str) -> date:
    """Source publication can be date-only; never invent an hour."""
    if not isinstance(value, str) or not value:
        raise ValueError("source published date missing")
    try:
        if len(value) == 10:
            return date.fromisoformat(value)
        return iso(value).date()
    except (TypeError, ValueError) as exc:
        raise ValueError("invalid source publication date") from exc


def stopped() -> bool:
    return (ROOT / "config" / "newsroom-stop").exists()


def validate_schema(data: object, name: str) -> None:
    schema = json.loads((ROOT / "contracts" / name).read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    errors = sorted(validator.iter_errors(data), key=lambda e: tuple(str(x) for x in e.absolute_path))
    if errors:
        first = errors[0]
        raise ValueError(f"JSON_SCHEMA: {'/'.join(map(str, first.absolute_path))}: {first.message}")


def source_registry() -> dict:
    result = json.loads((ROOT / "config" / "newsroom-sources.v1.json").read_text(encoding="utf-8"))
    validate_schema(result, "newsroom-sources-v1.schema.json")
    return result


class Ledger:
    """SQLite WAL + BEGIN IMMEDIATE; one shared file is the job/source of truth."""
    def __init__(self, db_file: Path | str):
        self.db_file = str(db_file)
        self.db = sqlite3.connect(self.db_file, timeout=10, isolation_level=None)
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.execute("PRAGMA busy_timeout=10000")
        self.db.executescript("""
          CREATE TABLE IF NOT EXISTS news(
            item_id TEXT PRIMARY KEY, url TEXT UNIQUE NOT NULL, source_id TEXT NOT NULL,
            event_key TEXT NOT NULL, title TEXT NOT NULL, source_published_at TEXT,
            event_at TEXT, first_seen TEXT NOT NULL, last_seen TEXT NOT NULL,
            content_hash TEXT NOT NULL, state TEXT NOT NULL, reason TEXT NOT NULL DEFAULT '',
            duplicate_of TEXT);
          CREATE INDEX IF NOT EXISTS news_event_key ON news(event_key);
          CREATE TABLE IF NOT EXISTS jobs(
            job_id TEXT PRIMARY KEY, item_id TEXT UNIQUE NOT NULL, article_id TEXT UNIQUE NOT NULL,
            state TEXT NOT NULL, worker TEXT, lock_until TEXT,
            wp_post_id INTEGER, attempt_count INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL, error TEXT NOT NULL DEFAULT '');
          CREATE TABLE IF NOT EXISTS mock_wp(
            wp_post_id INTEGER PRIMARY KEY AUTOINCREMENT, job_id TEXT UNIQUE NOT NULL,
            article_id TEXT UNIQUE NOT NULL, status TEXT NOT NULL CHECK(status='draft'),
            content_hash TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS daily_budget(
            day TEXT PRIMARY KEY, news_count INTEGER NOT NULL DEFAULT 0,
            model_calls INTEGER NOT NULL DEFAULT 0, tokens INTEGER NOT NULL DEFAULT 0,
            cost_usd REAL NOT NULL DEFAULT 0);
        """)

    def close(self):
        self.db.close()

    def ingest(self, item: dict, now: str, max_age_days: int = 7) -> dict:
        utc = iso(now)
        url = canonical(item["canonical_url"])
        item_id = "n-" + hashlib.sha256(url.encode()).hexdigest()[:20]
        content_hash = digest({k: item.get(k) for k in ("title", "summary", "source_published_at")})
        event_key = item.get("event_key") or "title:" + digest(re.sub(r"\W+", "", item["title"].casefold()))[:24]
        self.db.execute("BEGIN IMMEDIATE")
        try:
            old = self.db.execute("SELECT * FROM news WHERE url=?", (url,)).fetchone()
            if old:
                if old["content_hash"] == content_hash:
                    self.db.execute("UPDATE news SET last_seen=? WHERE item_id=?", (now, old["item_id"]))
                    answer = {"item_id": item_id, "state": "DUPLICATE", "reason": "SAME_CANONICAL_URL_AND_HASH", "original_state": old["state"]}
                else:
                    self.db.execute("UPDATE news SET content_hash=?,last_seen=?,state='NEEDS_REVIEW',reason='SOURCE_CHANGED',title=? WHERE item_id=?", (content_hash, now, item["title"], item_id))
                    answer = {"item_id": item_id, "state": "NEEDS_REVIEW", "reason": "SOURCE_CHANGED"}
            else:
                seen = self.db.execute("SELECT item_id FROM news WHERE event_key=? LIMIT 1", (event_key,)).fetchone()
                duplicate_of = seen["item_id"] if seen else None
                reason = ""
                state = "NEW"
                if duplicate_of:
                    state, reason = "DUPLICATE", "CROSS_SOURCE_SAME_EVENT_KEY"
                else:
                    try:
                        pub = source_day(item["source_published_at"])
                        if pub > utc.date():
                            state, reason = "NEEDS_REVIEW", "FUTURE_SOURCE_DATE"
                        elif (utc.date() - pub).days > max_age_days:
                            state, reason = "NEEDS_REVIEW", "OLD_SOURCE_PUBLICATION"
                    except (KeyError, ValueError, TypeError):
                        state, reason = "NEEDS_REVIEW", "MISSING_OR_INVALID_DATE"
                self.db.execute("""INSERT INTO news(item_id,url,source_id,event_key,title,source_published_at,
                    event_at,first_seen,last_seen,content_hash,state,reason,duplicate_of)
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (item_id, url, item["source_id"], event_key, item["title"], item.get("source_published_at"),
                     item.get("event_at"), now, now, content_hash, state, reason, duplicate_of))
                answer = {"item_id": item_id, "state": state, "reason": reason, "duplicate_of": duplicate_of}
            self.db.execute("COMMIT")
            return answer
        except BaseException:
            self.db.execute("ROLLBACK")
            raise

    def ready(self, item_id: str):
        row = self.db.execute("SELECT state FROM news WHERE item_id=?", (item_id,)).fetchone()
        if not row or row["state"] not in ("NEW", "READY_FOR_DRAFT"):
            raise ValueError("HOLD: only NEW items may advance")
        self.db.execute("UPDATE news SET state='READY_FOR_DRAFT',reason='' WHERE item_id=?", (item_id,))

    def job(self, item_id: str, article_id: str, now: str) -> str:
        job_id = "hm-job-" + digest({"item": item_id, "article": article_id})[:24]
        self.db.execute("INSERT OR IGNORE INTO jobs(job_id,item_id,article_id,state,updated_at) VALUES(?,?,?,'READY_FOR_DRAFT',?)",
                        (job_id, item_id, article_id, now))
        return job_id

    def lock(self, job_id: str, worker: str, now: str, lease_seconds: int = 120) -> bool:
        t = iso(now)
        until = (t + timedelta(seconds=lease_seconds)).isoformat()
        self.db.execute("BEGIN IMMEDIATE")
        try:
            row = self.db.execute("SELECT * FROM jobs WHERE job_id=?", (job_id,)).fetchone()
            if not row or row["state"] == "DRAFTED" or row["attempt_count"] >= 3 or (row["lock_until"] and iso(row["lock_until"]) > t):
                self.db.execute("COMMIT")
                return False
            self.db.execute("UPDATE jobs SET worker=?,lock_until=?,attempt_count=attempt_count+1,updated_at=? WHERE job_id=?",
                            (worker, until, now, job_id))
            self.db.execute("COMMIT")
            return True
        except BaseException:
            self.db.execute("ROLLBACK")
            raise

    def unlock(self, job_id: str, worker: str):
        self.db.execute("UPDATE jobs SET worker=NULL,lock_until=NULL WHERE job_id=? AND worker=?", (job_id, worker))

    def mock_write(self, job_id: str, content: str, now: str, timeout_after_commit: bool = False) -> int:
        """Mock only. Reconcile before retry; no WordPress HTTP client exists."""
        job = self.db.execute("SELECT * FROM jobs WHERE job_id=?", (job_id,)).fetchone()
        if not job or not job["worker"]:
            raise ValueError("worker lock required")
        existing = self.db.execute("SELECT wp_post_id FROM mock_wp WHERE job_id=? OR article_id=?", (job_id, job["article_id"])).fetchone()
        if existing:
            post_id = existing["wp_post_id"]
        else:
            cur = self.db.execute("INSERT INTO mock_wp(job_id,article_id,status,content_hash) VALUES(?,?,'draft',?)",
                                  (job_id, job["article_id"], hashlib.sha256(content.encode()).hexdigest()))
            post_id = cur.lastrowid
        if timeout_after_commit:
            raise TimeoutError("MOCK_WRITE_TIMEOUT_AFTER_COMMIT")
        self.db.execute("UPDATE jobs SET state='DRAFTED',wp_post_id=?,updated_at=?,error='' WHERE job_id=?", (post_id, now, job_id))
        self.db.execute("UPDATE news SET state='DRAFTED' WHERE item_id=?", (job["item_id"],))
        return post_id

    def reconcile(self, job_id: str, now: str) -> int | None:
        row = self.db.execute("SELECT wp_post_id FROM mock_wp WHERE job_id=?", (job_id,)).fetchone()
        if row:
            self.db.execute("UPDATE jobs SET state='DRAFTED',wp_post_id=?,updated_at=? WHERE job_id=?", (row["wp_post_id"], now, job_id))
            item = self.db.execute("SELECT item_id FROM jobs WHERE job_id=?", (job_id,)).fetchone()
            self.db.execute("UPDATE news SET state='DRAFTED' WHERE item_id=?", (item["item_id"],))
            return row["wp_post_id"]
        return None

    def reserve(self, day: str, news: int, calls: int, tokens: int, usd: float, caps: dict) -> bool:
        self.db.execute("BEGIN IMMEDIATE")
        try:
            self.db.execute("INSERT OR IGNORE INTO daily_budget(day) VALUES(?)", (day,))
            b = self.db.execute("SELECT * FROM daily_budget WHERE day=?", (day,)).fetchone()
            allowed = all((b[k] + amount) <= caps[k] for k, amount in
                          (("news_count", news), ("model_calls", calls), ("tokens", tokens), ("cost_usd", usd)))
            if allowed:
                self.db.execute("UPDATE daily_budget SET news_count=news_count+?,model_calls=model_calls+?,tokens=tokens+?,cost_usd=cost_usd+? WHERE day=?", (news, calls, tokens, usd, day))
            self.db.execute("COMMIT")
            return allowed
        except BaseException:
            self.db.execute("ROLLBACK")
            raise


def editorial_check(packet: dict, manifest: dict) -> list[str]:
    failures = []
    for data, schema in ((packet, "newsroom-evidence-v1.schema.json"), (manifest, "visual-article-v1.schema.json")):
        try:
            validate_schema(data, schema)
        except ValueError as exc:
            failures.append(str(exc))
    if failures:
        return failures
    if manifest["editorial_type"] != "news" or manifest["category"] != "ai-news" or manifest["status"] != "draft":
        failures.append("NEWS_MUST_BE_AI_NEWS_DRAFT")
    if manifest["gates"]["research"] != "PASS" or manifest["gates"]["fact_check"] != "PASS" or manifest["gates"]["editorial"] != "PENDING":
        failures.append("EVIDENCE_GATES_NOT_PASS")
    if packet["risk_flags"] or packet["review_status"] != "PASS":
        failures.append("RISK_OR_REVIEW_HOLD")
    if not packet["source_published_at"]:
        failures.append("SOURCE_DATE_MISSING")
    known_sources = {s["id"]: s for s in packet["sources"]}
    if {s["id"]: canonical(s["url"]) for s in manifest["sources"]} != {s: canonical(v["url"]) for s, v in known_sources.items()}:
        failures.append("MANIFEST_URL_NOT_IN_EVIDENCE")
    found = {e["claim_id"]: e for e in packet["evidence"]}
    for c in manifest["claims"]:
        e = found.get(c["id"])
        if not e or c["text"] != e["claim_text"] or set(c["source_ids"]) != {e["source_id"]}:
            failures.append("CLAIM_MISSING_EVIDENCE:" + c["id"])
        elif not e["evidence_text"].strip() or e["review"] != "PASS":
            failures.append("CLAIM_EVIDENCE_NOT_REVIEWED:" + c["id"])
        elif c["status"] == "verified" and e["attribution"] != "independently-verified":
            failures.append("OFFICIAL_CLAIM_MISLABELLED_VERIFIED:" + c["id"])
        elif c["status"] == "unverified":
            failures.append("UNVERIFIED_NEWS_CLAIM:" + c["id"])
    if not manifest["claims"] or not packet["evidence"]:
        failures.append("NO_IMPORTANT_CLAIMS")
    # Numeric assertions in generated copy must be backed by evidence excerpts.
    texts = [manifest["title"], manifest["dek"]]
    for m in manifest["modules"]:
        for k in ("title", "text", "attribution"):
            if k in m:
                texts.append(m[k])
        for k in ("bullets", "paragraphs", "items"):
            if k in m:
                texts.extend(v if isinstance(v, str) else json.dumps(v, ensure_ascii=False) for v in m[k])
    numbers = set(re.findall(r"(?<!\w)\d+(?:\.\d+)?(?:[%×])?", " ".join(texts)))
    evidence_numbers = set(re.findall(r"(?<!\w)\d+(?:\.\d+)?(?:[%×])?", " ".join(e["evidence_text"] for e in packet["evidence"])))
    if numbers - evidence_numbers:
        failures.append("UNSUPPORTED_NUMBERS:" + ",".join(sorted(numbers - evidence_numbers)))
    return failures


def block(type_: str, inner: str, attrs: dict | None = None) -> str:
    comment = "<!-- wp:" + type_ + (" " + json.dumps(attrs, ensure_ascii=False, separators=(",", ":")) if attrs else "") + " -->"
    return comment + inner + "<!-- /wp:" + type_ + " -->"


def attach_reader_modules(markup: str, packet: dict, faqs: list[dict]) -> str:
    """Fixed, script-free reusable disclosure interaction placed BEFORE article prose.

    Uses Gutenberg core/html only for native HTML details; source list uses core/list.
    The model is never permitted to supply executable HTML or JS.
    """
    fixed_faq = '<section class="hm-newsroom-interactive" aria-label="บทเรียนโต้ตอบ">' + '<h2>สำรวจประเด็นสำคัญ</h2>'
    for faq in faqs[:3]:
        fixed_faq += "<details><summary>" + html.escape(faq["question"]) + "</summary><p>" + html.escape(faq["answer"]) + "</p></details>"
    fixed_faq += "</section>"
    intro = block("html", fixed_faq)
    src_html = "<h2 class=\"wp-block-heading\">แหล่งอ้างอิงที่ตรวจได้</h2>"
    references = block("heading", src_html, {"level": 2})
    li = "".join(block("list-item", '<li><a href="' + html.escape(canonical(s["url"]), quote=True) + '" rel="noopener noreferrer" target="_blank">' + html.escape(s["title"]) + "</a></li>") for s in packet["sources"])
    references += block("list", '<ul class="wp-block-list">' + li + "</ul>")
    return intro + "\n" + markup + "\n" + references + "\n"


def dry_run(sample_path: Path, out_dir: Path, db_path: Path, now: str, mock_timeout: bool = False) -> dict:
    if stopped():
        return {"status": "STOPPED", "reason": "NEWSROOM_STOP_SWITCH", "api_calls": 0, "cost_usd": 0}
    sample = json.loads(sample_path.read_text(encoding="utf-8"))
    item, packet, manifest = sample["item"], sample["evidence_packet"], sample["manifest"]
    out_dir.mkdir(parents=True, exist_ok=True)
    ledger = Ledger(db_path)
    try:
        ingest = ledger.ingest(item, now)
        failures = editorial_check(packet, manifest)
        if ingest["state"] not in ("NEW", "DUPLICATE") or (ingest["state"] == "DUPLICATE" and ingest.get("original_state") not in ("READY_FOR_DRAFT", "DRAFTED")):
            failures.append("QUEUE_HOLD:" + ingest["reason"])
        if not failures and ingest["state"] == "NEW":
            caps = json.loads((ROOT / "config" / "newsroom-budget.v1.json").read_text(encoding="utf-8"))
            if not ledger.reserve(iso(now).date().isoformat(), 1, 0, 0, 0.0, caps):
                failures.append("DAILY_BUDGET_EXCEEDED")
        if failures:
            result = {"status": "HOLD", "queue": ingest, "reasons": failures, "api_calls": 0, "tokens": 0, "cost_usd": 0}
        else:
            # Existing renderer is the ONLY producer of article Gutenberg modules.
            if ingest["state"] == "NEW":
                ledger.ready(ingest["item_id"])
            (out_dir / "visual-article.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
            base = out_dir / "base-article.gutenberg.html"
            subprocess.run(["node", str(ROOT / "tools/visual_article/render_gutenberg.mjs"),
                            str(out_dir / "visual-article.json"), str(base)], check=True, capture_output=True, text=True)
            markup = attach_reader_modules(base.read_text(encoding="utf-8"), packet, sample.get("faqs", []))
            (out_dir / "visual-article.gutenberg.html").write_text(markup, encoding="utf-8")
            (out_dir / "evidence.json").write_text(json.dumps(packet, ensure_ascii=False, indent=2), encoding="utf-8")
            job_id = ledger.job(ingest["item_id"], manifest["article_id"], now)
            if not ledger.lock(job_id, "dryrun-worker", now):
                post_id = ledger.reconcile(job_id, now)
            else:
                try:
                    post_id = ledger.mock_write(job_id, markup, now, timeout_after_commit=mock_timeout)
                except TimeoutError:
                    post_id = ledger.reconcile(job_id, now)
                finally:
                    ledger.unlock(job_id, "dryrun-worker")
            result = {"status": "MOCK_DRAFT_ONLY" if post_id else "HOLD", "queue": ingest, "job_id": job_id,
                      "mock_wp_post_id": post_id, "sources": [s["url"] for s in packet["sources"]],
                      "rendered_html_bytes": len(markup.encode()), "api_calls": 0, "tokens": 0, "cost_usd": 0,
                      "production_wp_post_id": None, "mobile_visual_qa": "UNKNOWN", "real_api_permission": "DENIED_BY_DESIGN"}
        (out_dir / "qa-report.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        return result
    finally:
        ledger.close()


def main():
    parser = argparse.ArgumentParser(description="Hybrid Mind Newsroom dry-run, no production write capability")
    sub = parser.add_subparsers(dest="cmd", required=True)
    cmd = sub.add_parser("demo")
    cmd.add_argument("--sample", type=Path, default=ROOT / "examples/newsroom-agent-security.v1.json")
    cmd.add_argument("--out", type=Path, default=Path(".local/newsroom"))
    cmd.add_argument("--db", type=Path, default=Path(".local/newsroom-jobs.sqlite3"))
    cmd.add_argument("--now", default="2026-10-10T20:40:00+07:00")
    cmd.add_argument("--mock-timeout", action="store_true")
    args = parser.parse_args()
    if args.cmd == "demo":
        args.db.parent.mkdir(parents=True, exist_ok=True)
        print(json.dumps(dry_run(args.sample, args.out, args.db, args.now, args.mock_timeout), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()