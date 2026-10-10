"""Fail-closed HTML + serialized Gutenberg verifier. No external network or parser execution."""
from __future__ import annotations
import json, re, sys
from html.parser import HTMLParser
from urllib.parse import urlsplit
from pathlib import Path
from tools.newsroom.pipeline import canonical

ALLOWED_BLOCKS={'group','heading','paragraph','list','list-item','columns','column','image','quote','html'}
BLOCK_ATTRS={'className','level','backgroundColor','textColor','style','layout','id','sizeSlug','linkDestination'}
TAGS={
'div':{'class','style'}, 'p':{'class'},'h2':{'class'},'h3':{'class'},
'ul':{'class'},'li':set(),'section':{'class','aria-label'},
'details':set(),'summary':set(), 'a':{'href','rel','target'},
'figure':{'class'},'figcaption':{'class'},'img':{'src','alt','class'},
'blockquote':{'class'},'cite':set(), 'em':set(),'strong':set()
}
STYLE='border-radius:18px;padding-top:22px;padding-right:22px;padding-bottom:22px;padding-left:22px'
VOID_TAGS={'img'}
BLOCK_OPEN=re.compile(r'^wp:([a-z][a-z-]*)(?:\s+(\{.*\}))?\s*$')
BLOCK_CLOSE=re.compile(r'^/wp:([a-z][a-z-]*)\s*$')

def safe_url(url, source_urls):
    if not isinstance(url,str):return False
    try:
        if canonical(url) not in {canonical(x) for x in source_urls}:return False
    except (ValueError, TypeError):return False
    try:
        p=urlsplit(url)
        return p.scheme=='https' and bool(p.hostname) and not p.username and not p.password and not p.fragment and p.port in (None,443)
    except ValueError:return False

class Guardian(HTMLParser):
    def __init__(self,source_urls):
        super().__init__(convert_charrefs=True)
        self.source_urls=source_urls
        self.errors=[];self.blocks=[];self.tags=[];self.links=[];self.details=0;self.paragraphs=0
    def reject(self,why):self.errors.append(why)
    def handle_comment(self,data):
        val=data.strip()
        m=BLOCK_OPEN.fullmatch(val)
        if m:
            name=m.group(1)
            if name not in ALLOWED_BLOCKS:self.reject('UNSAFE_BLOCK:'+name)
            if m.group(2):
                try:
                    attrs=json.loads(m.group(2))
                    if not isinstance(attrs,dict) or set(attrs)-BLOCK_ATTRS:self.reject('UNSAFE_BLOCK_ATTRIBUTES')
                    if re.search(r'(?i)(javascript:|data:|<script|onerror\s*=|onload\s*=|url\s*\(|expression\s*\()',m.group(2)):
                        self.reject('UNSAFE_BLOCK_ATTR_CONTENT')
                except json.JSONDecodeError:self.reject('BAD_BLOCK_JSON')
            self.blocks.append(name)
            return
        m=BLOCK_CLOSE.fullmatch(val)
        if m:
            if not self.blocks or self.blocks.pop()!=m.group(1):self.reject('BLOCK_NESTING_MISMATCH')
            return
        self.reject('UNRECOGNIZED_HTML_COMMENT')
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag,attrs)
    def handle_starttag(self,tag,attrs):
        tag=tag.lower()
        if tag not in TAGS:
            self.reject('FORBIDDEN_TAG:'+tag);return
        names=[name for name,_ in attrs]
        if len(names)!=len(set(names)):self.reject('DUPLICATED_ATTRIBUTE')
        if set(names)-TAGS[tag]:self.reject('FORBIDDEN_ATTRIBUTE:'+tag+':'+','.join(sorted(set(names)-TAGS[tag])))
        values=dict(attrs)
        if any(re.match(r'^on[a-z]+$',x,re.I) for x in names):self.reject('EVENT_HANDLER')
        if 'style' in values and values['style']!=STYLE:self.reject('BAD_INLINE_STYLE')
        if 'class' in values and not re.fullmatch(r'[a-zA-Z0-9_\- ]{1,200}',values['class']):self.reject('BAD_CLASS')
        if tag=='a':
            if not safe_url(values.get('href'),self.source_urls):self.reject('URL_NOT_EVIDENCED_OR_UNSAFE')
            if values.get('target')!='_blank' or values.get('rel')!='noopener noreferrer':self.reject('BAD_LINK_SECURITY_ATTRS')
            self.links.append(values.get('href'))
        if tag=='img':
            src=values.get('src','')
            if not src.startswith('https://hybridmind.online/wp-content/uploads/'):self.reject('UNTRUSTED_IMAGE_URL')
            if not values.get('alt'):self.reject('MISSING_ALT')
        if tag=='details':self.details+=1
        if tag=='p':self.paragraphs+=1
        if tag not in VOID_TAGS:self.tags.append(tag)
    def handle_endtag(self,tag):
        if tag not in TAGS or tag in VOID_TAGS:self.reject('UNEXPECTED_ENDTAG:'+tag)
        elif not self.tags or self.tags.pop()!=tag:self.reject('HTML_NESTING_MISMATCH:'+tag)
    def unknown_decl(self,data):self.reject('UNSAFE_DECLARATION')
    def handle_decl(self,decl):self.reject('UNSAFE_DOCTYPE')
    def handle_pi(self,data):self.reject('UNSAFE_PROCESSING_INSTRUCTION')

def check_html(markup:str, sources:list[dict]) -> list[str]:
    if not isinstance(markup,str) or not markup:return ['EMPTY_OUTPUT']
    source_urls={s['url'] for s in sources}
    parser=Guardian(source_urls)
    try:parser.feed(markup);parser.close()
    except (ValueError,TypeError) as exc:return ['HTML_PARSER_ERROR:'+type(exc).__name__]
    errs=parser.errors
    if parser.blocks:errs.append('UNCLOSED_GUTENBERG_BLOCKS')
    if parser.tags:errs.append('UNCLOSED_HTML_TAGS')
    safe_links={canonical(x) for x in parser.links if x and safe_url(x,source_urls)}
    if not {canonical(x) for x in source_urls}.issubset(safe_links):errs.append('REFERENCES_NOT_VISIBLE')
    if parser.paragraphs<4:errs.append('ACCESSIBLE_FALLBACK_TOO_SHORT')
    if parser.details<1:errs.append('MISSING_FIXED_INTERACTIVE')
    if parser.details>3:errs.append('INTERACTIVE_LIMIT_EXCEEDED')
    return sorted(set(errs))

def main():
    request=json.load(sys.stdin)
    issues=check_html(request['markup'],request['sources'])
    print(json.dumps({'status':'PASS' if not issues else 'HOLD','reasons':issues,'gutenberg_blocks_checked':True,'url_allowlist':'evidence-packet-only'},ensure_ascii=False))
if __name__=='__main__':main()
