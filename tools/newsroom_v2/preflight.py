"""Offline authority boundary. Real Draft202012Validator + evidence cross-check.
Reads JSON on stdin. No HTTP, WordPress or model call.
"""
from __future__ import annotations
import json, sys, re, ipaddress, traceback
from datetime import datetime, date
from pathlib import Path
from urllib.parse import urlsplit
from jsonschema import Draft202012Validator, FormatChecker

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT))
from tools.newsroom.pipeline import canonical, editorial_check, source_day, iso

def allowed_https(value:str) -> bool:
    try:
        p=urlsplit(value)
        if not value.startswith('https://') or p.scheme!='https' or not p.hostname or p.username or p.password or p.fragment:
            return False
        if p.hostname in ('localhost',) or p.hostname.endswith(('.localhost','.local','.internal')):
            return False
        try:
            ip=ipaddress.ip_address(p.hostname)
            if not ip.is_global:return False
        except ValueError:pass
        if p.port not in (None,443):return False
        return True
    except (ValueError, TypeError):
        return False

def validate(data, path):
    schema=json.loads((ROOT/path).read_text(encoding='utf8'))
    Draft202012Validator.check_schema(schema)
    v=Draft202012Validator(schema,format_checker=FormatChecker())
    return ['SCHEMA:'+path.name+':'+'/'.join(map(str,e.absolute_path))+':'+e.message for e in sorted(v.iter_errors(data),key=lambda x:str(x.path))]

def check(sample:dict, now:str):
    reasons=[]
    if not isinstance(sample,dict) or not all(x in sample for x in ['item','evidence_packet','manifest']):
        return ['SAMPLE_SHAPE_MISSING']
    item,packet,manifest=sample['item'],sample['evidence_packet'],sample['manifest']
    if re.search(r'(sk-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|(?:api[_-]?key|access[_-]?token|secret)\s*[=:]\s*[^\s\"\']{10,})',json.dumps(sample,ensure_ascii=False),re.I):
        reasons.append('POSSIBLE_SECRET_IN_INPUT')
    for data,filename in ((item,'newsroom-item-v2.schema.json'),(packet,'newsroom-evidence-v1.schema.json'),(manifest,'visual-article-v1.schema.json')):
        reasons.extend(validate(data,ROOT/'contracts'/filename))
    if reasons:return sorted(set(reasons))
    # Existing editorial gate and evidence linkage, augmented below (no changes to R1 code).
    try:reasons.extend(editorial_check(packet,manifest))
    except (ValueError,KeyError,TypeError) as exc:reasons.append('EDITORIAL_INPUT:'+str(exc)[:120])
    if re.search(r'<\s*[a-zA-Z][\w-]*(\s|>|/)',manifest['title']):reasons.append('TITLE_CONTAINS_HTML_TAG')
    if manifest['article_id']!=packet['article_id']:reasons.append('ARTICLE_ID_MISMATCH')
    if item['source_published_at'] != packet['source_published_at']:reasons.append('SOURCE_DATE_MISMATCH')
    if item['event_at']!=packet.get('event_at'):reasons.append('EVENT_DATE_MISMATCH')
    if item['fetched_at']!=packet['fetched_at']:reasons.append('FETCHED_DATE_MISMATCH')
    if len(sample.get('faqs',[]))>3:reasons.append('TOO_MANY_INTERACTIVE_ITEMS')
    for faq in sample.get('faqs',[]):
        if not isinstance(faq,dict) or set(faq)!={'question','answer'} or any(not isinstance(faq[k],str) or not 2<=len(faq[k])<=900 for k in ('question','answer')):
            reasons.append('INVALID_INTERACTIVE_DATA');break
    urls=set()
    for src in packet['sources']:
        if not allowed_https(src['url']):reasons.append('UNSAFE_SOURCE_URL')
        else:urls.add(canonical(src['url']))
        if src['published_at']!=packet['source_published_at']:reasons.append('SOURCE_RECORD_DATE_MISMATCH')
    if not allowed_https(item['canonical_url']):reasons.append('UNSAFE_CANONICAL_URL')
    elif canonical(item['canonical_url']) not in urls:reasons.append('ITEM_NOT_IN_EVIDENCE_SOURCES')
    try:
        seen=iso(item['fetched_at'])
        now_time=iso(now)
        if abs((now_time-seen).total_seconds())>60*60*48:reasons.append('DISCOVERY_TIME_INCONSISTENT')
        published=source_day(item['source_published_at'])
        if published>seen.date():reasons.append('FUTURE_SOURCE_PUBLICATION')
        if (now_time.date()-published).days>7:reasons.append('OLD_NEWS_REQUIRES_REVIEW')
        if item['event_at'] and date.fromisoformat(item['event_at'])>now_time.date():reasons.append('FUTURE_EVENT_DATE')
    except (TypeError,ValueError,KeyError):reasons.append('INVALID_OR_UNKNOWN_DATE')
    registry=json.loads((ROOT/'config/newsroom-sources.v1.json').read_text('utf8'))
    if item['source_id'] not in {s['id'] for s in registry['sources']}:
        reasons.append('SOURCE_NOT_IN_REGISTRY')
    if not registry.get('network_enabled') is False:reasons.append('NETWORK_DISABLED_REQUIRED')
    if manifest['gates']['editorial']!='PENDING' or manifest['gates']['visual_qa']=='FAIL':
        reasons.append('EDITORIAL_OR_VISUAL_NOT_ELIGIBLE')
    if any(m['type']=='image' for m in manifest['modules']):
        reasons.append('IMAGE_AVAILABILITY_UNVERIFIED_OFFLINE')
    if any(m.get('source_ids',[])==[] for m in manifest['modules']):
        reasons.append('MODULE_WITHOUT_EVIDENCE_SOURCE')
    actual_src={s['id'] for s in packet['sources']}
    if len(actual_src)!=len(packet['sources']):reasons.append('DUPLICATED_SOURCE_ID')
    actual_claim={e['claim_id'] for e in packet['evidence']}
    if len(actual_claim)!=len(packet['evidence']):reasons.append('DUPLICATED_CLAIM_ID')
    if any(e['source_id'] not in actual_src for e in packet['evidence']):reasons.append('EVIDENCE_REFERENCES_MISSING_SOURCE')
    if any(set(c['source_ids'])-actual_src for c in manifest['claims']):reasons.append('CLAIM_REFERENCES_MISSING_SOURCE')
    if any(set(m.get('source_ids',[]))-actual_src for m in manifest['modules']):reasons.append('MODULE_REFERENCES_MISSING_SOURCE')
    # No dynamic instructions from feed/web content: model output is data, not executable code.
    # Unicode, Thai and literal HTML in text are allowed because the trusted renderer escapes all text.
    return sorted(set(reasons))

def main():
    try:
        data=json.load(sys.stdin)
        reasons=check(data['sample'],data['now'])
        print(json.dumps({'status':'HOLD' if reasons else 'ELIGIBLE_FOR_MOCK_ONLY','reasons':reasons,'engine':'jsonschema.Draft202012Validator','network_calls':0,'production_write':False},ensure_ascii=False))
    except (Exception,) as exc:
        print(json.dumps({'status':'HOLD','reasons':['VALIDATOR_EXCEPTION:'+type(exc).__name__+':'+str(exc)[:100]],'network_calls':0,'production_write':False},ensure_ascii=False))

if __name__=='__main__':main()
