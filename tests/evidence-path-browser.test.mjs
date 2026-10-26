import { browserEndpoint } from './browser-endpoint.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const edgePath = [process.env.HM_EDGE_PATH, process.platform === 'win32' ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' : null].filter(Boolean).find(existsSync);

class PipeClient {
  constructor(socket) { this.socket = socket; this.nextId = 1; this.pending = new Map(); socket.addEventListener('message', event => { const m = JSON.parse(event.data); if (!m.id || !this.pending.has(m.id)) return; const p = this.pending.get(m.id); clearTimeout(p.timer); this.pending.delete(m.id); m.error ? p.reject(new Error(`CDP ${p.method}: ${JSON.stringify(m.error)}`)) : p.resolve(m); }); }
  request(method, params = {}, sessionId) { const id = this.nextId++; return new Promise((resolveRequest, reject) => { const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 10000); this.pending.set(id, { resolve: resolveRequest, reject, timer, method }); this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); }); }
  async evaluate(expression, sessionId) { const r = await this.request('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true }, sessionId); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text || `Evaluation failed: ${expression}`); return r.result.result.value; }
}
async function waitFor(cdp, expression, sessionId, predicate = Boolean, timeoutMs = 15000) { const end = Date.now() + timeoutMs; while (Date.now() < end) { const value = await cdp.evaluate(expression, sessionId); if (predicate(value)) return value; await delay(100); } throw new Error(`Browser condition timed out: ${expression}`); }
async function reloadPageAndWait(cdp, sessionId) {
  const previous = await cdp.evaluate('performance.timeOrigin', sessionId);
  await cdp.request('Page.reload', {}, sessionId);
  await waitFor(cdp, `performance.timeOrigin !== ${previous} && document.readyState !== 'loading'`, sessionId);
}
function serverAddress(server) { return new Promise((resolveAddress, reject) => { let output = ''; const timer = setTimeout(() => reject(new Error('Static server did not report a port')), 10000); server.stdout.setEncoding('utf8'); server.stdout.on('data', chunk => { output += chunk; const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)\//); if (match) { clearTimeout(timer); resolveAddress(`http://127.0.0.1:${match[1]}`); } }); server.once('error', reject); }); }

test('evidence learning path, six source simulations, mobile accessibility and revision-safe navigation', {skip:!edgePath&&'Installed browser unavailable; set HM_EDGE_PATH.'}, async t=>{
 const liveUrl=process.env.HM_LIVE_URL||'';
 const server=liveUrl?null:spawn(process.execPath,['scripts/serve-pilot.mjs'],{cwd:root,env:{...process.env,HM_PILOT_PORT:'0'},stdio:['ignore','pipe','inherit']});
 let browser,cdp,sessionId;
 const shots=[],coverage=[],external=[],errors=[];
 try{
  const base=liveUrl?new URL(liveUrl).origin:await serverAddress(server);
  const profile=join(tmpdir(),'hm-evidence-path-'+process.pid+'-'+Date.now());
  browser=spawn(edgePath,['--headless=new','--no-sandbox','--disable-gpu','--disable-background-networking','--no-first-run','--no-default-browser-check','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe'],windowsHide:true});
  const [port,path]=await browserEndpoint(join(profile,'DevToolsActivePort'),browser);
  const socket=new WebSocket('ws://127.0.0.1:'+port+path);await new Promise((ok,fail)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',fail,{once:true});});
  cdp=new PipeClient(socket);
  const {result:target}=await cdp.request('Target.createTarget',{url:'about:blank'});
  const {result:attached}=await cdp.request('Target.attachToTarget',{targetId:target.targetId,flatten:true});sessionId=attached.sessionId;
  await cdp.request('Page.enable',{},sessionId);await cdp.request('Runtime.enable',{},sessionId);await cdp.request('Network.enable',{},sessionId);
  socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.sessionId!==sessionId)return;if(m.method==='Network.requestWillBeSent'&&/^https?:/.test(m.params.request.url)&&new URL(m.params.request.url).origin!==new URL(base).origin)external.push(m.params.request.url);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});
  const book=liveUrl?new URL(liveUrl):new URL((process.env.HM_PILOT_BASE_PATH||'')+'/knowledge-textbook/',base);book.search='';
  if(liveUrl){const release=await fetch(new URL('../release.json',book)).then(r=>r.json());assert.equal(release.source_commit,process.env.HM_EXPECTED_RELEASE_SHA);assert.equal(release.articles,8);assert.equal(release.reviewed_lab_roots,12);}
  const ev=(fn,arg)=>cdp.evaluate('('+fn.toString()+')('+JSON.stringify(arg)+')',sessionId);
  const wait=expression=>waitFor(cdp,expression,sessionId);
  const dir=join(root,'artifacts',liveUrl?'live-evidence-path':'evidence-path');mkdirSync(dir,{recursive:true});
  const shot=async name=>{const r=await cdp.request('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false},sessionId);const p=join(dir,name+'.png');writeFileSync(p,Buffer.from(r.result.data,'base64'));shots.push(p);};
  await cdp.request('Page.navigate',{url:book.href},sessionId);await wait("document.querySelectorAll('.book-topic-card').length===12");
  const ids=['retrieval-evaluation','evidence-sufficiency','claim-decomposition'];
  assert.deepEqual(await ev(()=>[...document.querySelectorAll('.evidence-path-guide ol a')].map(a=>new URL(a.href).searchParams.get('topic'))),ids.map(id=>'hm:topic:'+id));
  assert.match(await ev(()=>document.querySelector('.evidence-path-guide').textContent),/ANALYSIS/);
  await ev(()=>{localStorage.setItem('hm-reading:consent','yes');localStorage.setItem('hm-reading:hm:topic:verify-ai-work',JSON.stringify({lastViewedContentRevision:'1:previous',lastViewedSectionId:null,completionEvents:[{topicRevision:'1',status:'completed',changedAt:'2026-10-25T00:00:00Z'}],savedAt:'2026-10-25T00:00:00Z'}));});
  await reloadPageAndWait(cdp,sessionId);await wait("document.querySelector('.evidence-path-guide')");
  await ev(()=>document.querySelector('.evidence-path-guide ol a').click());
  const configs=[{id:1740,topic:ids[0],kinds:['retrievalExplorer','retrievalGame']},{id:1755,topic:ids[1],kinds:['sufficiencyExplorer','sufficiencyGame']},{id:1770,topic:ids[2],kinds:['claimsExplorer','claimsGame']}];
  for(const [index,cfg]of configs.entries()){
   await wait("new URL(location.href).searchParams.get('topic')==='hm:topic:"+cfg.topic+"' && document.querySelectorAll('.hm-reviewed-lab[data-lab-ready=\"true\"]').length===2");
   assert.equal(await ev(()=>new URL(location.href).searchParams.get('path')),'hm:path:evidence-to-answer');
   const facts=await ev(()=>{const card=document.querySelector('.source-card');const duplicate=[...document.querySelectorAll('[id]')].map(x=>x.id).filter((x,i,a)=>a.indexOf(x)!==i);card.querySelectorAll('img').forEach(x=>x.loading='eager');return{chars:card.innerText.length,images:card.querySelectorAll('img').length,source:!!card.querySelector('a.source-link[href^="https://hybridmind.online/"]'),unsafe:card.querySelectorAll('script,style,iframe,object,embed,[onclick]').length,fallback:card.querySelectorAll('.interactive-static-fallback,.media-fallback').length,duplicate};});
   assert.ok(facts.chars>10000);assert.equal(facts.images,6);assert.equal(facts.source,true);assert.equal(facts.unsafe,0);assert.equal(facts.fallback,0);assert.deepEqual(facts.duplicate,[]);
   await wait("[...document.querySelectorAll('.source-card img')].every(x=>x.complete&&x.naturalWidth>0)");
   for(const kind of cfg.kinds){
    const state=await ev(kind=>{const r=document.querySelector('[data-lab-kind="'+kind+'"]');return r.hmSnapshot();},kind);assert.ok(state&&typeof state==='object',kind+' source semantic snapshot');
    const exercised=await ev(kind=>{
     const root=document.querySelector('[data-lab-kind="'+kind+'"]'),record={kind,selectOptions:[],checkboxes:[],buttons:[],unlabelled:[]};
     const reset=()=>root.querySelector('[data-action="reset"]').click();
     const label=e=>e.getAttribute('aria-label')||e.labels?.[0]?.textContent||e.textContent?.trim()||'';
     for(const e of root.querySelectorAll('button,input,select,textarea'))if(!label(e))record.unlabelled.push(e.outerHTML.slice(0,160));
     const selectors=[...root.querySelectorAll('select')].map(e=>[...e.attributes].filter(a=>a.name.startsWith('data-')).map(a=>'['+a.name+'="'+a.value+'"]').join(''));
     for(const sel of selectors){reset();const node=root.querySelector(sel);if(!node)continue;const values=[...node.options].map(o=>o.value);for(const value of values){const e=root.querySelector(sel);if(!e)continue;e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}));record.selectOptions.push(sel+'='+value);}}
     reset();
     const boxes=[...root.querySelectorAll('input[type=checkbox]')].map(e=>[...e.attributes].filter(a=>a.name.startsWith('data-')).map(a=>'['+a.name+'="'+a.value+'"]').join(''));
     for(const sel of boxes){const e=root.querySelector(sel);if(!e)continue;e.click();const again=root.querySelector(sel);if(again)again.click();record.checkboxes.push(sel);}
     const buttons=[...root.querySelectorAll('button')].map(e=>[...e.attributes].filter(a=>a.name.startsWith('data-')).map(a=>'['+a.name+'="'+a.value+'"]').join('')).filter(Boolean);
     for(const sel of buttons){reset();const b=root.querySelector(sel);if(b&&!b.disabled){b.click();record.buttons.push(sel);}}
     reset();return record;
    },kind);
    assert.deepEqual(exercised.unlabelled,[],kind+' every control has an accessible label');
    await ev(kind=>document.querySelector('[data-lab-kind="'+kind+'"] select').focus(),kind);
    await cdp.request('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9},sessionId);
    await cdp.request('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9},sessionId);
    assert.equal(await ev(kind=>document.activeElement?.closest('.hm-reviewed-lab')?.dataset.labKind===kind,kind),true,kind+' keyboard focus advances inside the lab');
    assert.ok(exercised.selectOptions.length>0&&exercised.buttons.length>0,kind+' controls exercised');coverage.push(exercised);
    for(const [label,width,height,mobile]of [['desktop',1440,1000,false],['mobile',390,844,true]]){
     await cdp.request('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile},sessionId);
     await ev(kind=>document.querySelector('[data-lab-kind="'+kind+'"]').scrollIntoView({block:'start',behavior:'instant'}),kind);await delay(100);
     assert.equal(await ev(()=>document.documentElement.scrollWidth>innerWidth+1),false,kind+' '+label+' overflow');
     await shot(cfg.id+'-'+kind+'-'+label);
    }
   }
   // Semantic cases expose distinctions the articles teach, not just DOM presence.
   const semantic=await ev(id=>{
    const root=kind=>document.querySelector('[data-lab-kind="'+kind+'"]');
    const input=(r,key,value)=>{const e=r.querySelector(key);if(!e)throw Error('Missing semantic control '+key);if(e.type==='checkbox')e.checked=value;else e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}));};
    if(id===1740){
     const r=root('retrievalExplorer');input(r,'[data-input="rank"]','good');input(r,'[data-input="capacity"]','5');input(r,'[data-input="policy"]','evidence');const supported=r.hmSnapshot();input(r,'[data-input="policy"]','abstain');const abstain=r.hmSnapshot();input(r,'[data-input="goldComplete"]',false);const unknown=r.hmSnapshot();
     const g=root('retrievalGame');input(g,'[data-config="challenge"]','pipeline');g.querySelector('[data-action="reset"]').click();g.querySelector('[data-action="rerank-time"]').click();g.querySelector('[data-action="capacity-price"]').click();
     for(const [key,value]of [['[data-diagnosis="time"]','retrieval'],['[data-diagnosis="price"]','context'],['[data-answer="time"]','10:00'],['[data-answer="price"]','50'],['[data-source="time"]','D1'],['[data-source="price"]','D2']])input(g,key,value);
     g.querySelector('[data-action="grade"]').click();return{supported:supported.metrics.claimSupport.value,abstain:abstain.metrics.claimSupport.status,coverage:abstain.metrics.answerCoverage.value,unknown:unknown.metrics.recall.status,win:g.hmSnapshot().result?.goal};
    }
    if(id===1755){
     const r=root('sufficiencyExplorer');r.querySelector('[data-fact="E2"]').click();const sufficient=r.hmSnapshot();r.querySelector('[data-action="copy"]').click();const duplicate=r.hmSnapshot();input(r,'[data-input="policy"]','ignore-demo');r.querySelector('[data-fact="E8"]').click();const ignored=r.hmSnapshot();
     const g=root('sufficiencyGame');input(g,'[data-config="preset"]','missingAND');g.querySelector('[data-action="reset"]').click();g.querySelector('[data-fetch="E2"]').click();input(g,'[data-answer="witness"]','sun');input(g,'[data-answer="room"]','RoomA3');g.querySelector('[data-action="grade"]').click();
     return{sufficient:sufficient.completeWitnesses.length,duplicate:duplicate.copies,world:ignored.sourceWorldTruth,invalidWitness:ignored.completeWitnesses.some(w=>w.ids.includes('E8')),win:g.hmSnapshot().result?.goal};
    }
    const r=root('claimsExplorer');input(r,'[data-input="strategy"]','faithful');const faithful=r.hmSnapshot();
    const g=root('claimsGame');g.querySelector('[data-action="reset"]').click();
    for(const id of g.hmSnapshot().selected)g.querySelector('[data-candidate="'+id+'"]').click();
    for(const id of ['C1','C2','C3','C4','C5'])g.querySelector('[data-candidate="'+id+'"]').click();
    for(const [id,status]of [['C1','SUPPORTED'],['C2','SUPPORTED'],['C3','SUPPORTED'],['C4','NOT_IN_REFERENCE'],['C5','CONTRADICTED']])input(g,'[data-support="'+id+'"]',status);
    g.querySelector('[data-action="grade"]').click();return{complete:faithful.completeFaithfulAtomicDecomposition,missing:faithful.missingUnits,support:faithful.supportCounts,world:faithful.sourceWorldTruth,win:g.hmSnapshot().result?.goal};
   },cfg.id);
   if(cfg.id===1740)assert.deepEqual(semantic,{supported:1,abstain:'NA',coverage:0,unknown:'UNKNOWN',win:true});
   if(cfg.id===1755){assert.ok(semantic.sufficient>0);assert.ok(semantic.duplicate>0);assert.equal(semantic.invalidWitness,false);assert.equal(semantic.win,true);}
   if(cfg.id===1770){assert.equal(semantic.complete,true);assert.deepEqual(semantic.missing,[]);assert.equal(semantic.world,'UNKNOWN');assert.equal(semantic.support.NOT_IN_REFERENCE,1);assert.equal(semantic.support.CONTRADICTED,1);assert.equal(semantic.win,true);}
   const before=await ev(kinds=>kinds.map(k=>document.querySelector('[data-lab-kind="'+k+'"]').hmSnapshot()),cfg.kinds);
   if(index<2){
    await ev(()=>document.querySelector('#topic-finish .topic-pager a:last-child').click());
    await wait("new URL(location.href).searchParams.get('topic')==='hm:topic:"+configs[index+1].topic+"'");
    await ev(()=>history.back());await wait("document.querySelector('[data-lab-kind=\""+cfg.kinds[0]+"\"][data-lab-ready=\"true\"]')");
    assert.deepEqual(await ev(kinds=>kinds.map(k=>document.querySelector('[data-lab-kind="'+k+'"]').hmSnapshot()),cfg.kinds),before,'semantic state restored after Back');
    await ev(()=>history.forward());await wait("new URL(location.href).searchParams.get('topic')==='hm:topic:"+configs[index+1].topic+"'");
   }
  }
  assert.match(await ev(()=>document.querySelector('.evidence-next-source').href),/article=hm%3Aarticle%3A2241/);
  const prior=await ev(()=>JSON.parse(localStorage.getItem('hm-reading:hm:topic:verify-ai-work')).completionEvents);
  assert.deepEqual(prior,[{topicRevision:'1',status:'completed',changedAt:'2026-10-25T00:00:00Z'}],'old pilot completion history survives new topics');
  await ev(()=>document.querySelector('#topic-finish .complete-topic').click());
  assert.equal(await ev(()=>JSON.parse(localStorage.getItem('hm-reading:hm:topic:claim-decomposition')).completionEvents.at(-1).topicRevision),'1');
  await ev(()=>document.querySelector('.reset-progress').click());
  assert.equal(await ev(()=>Object.keys(localStorage).some(k=>k.startsWith('hm-reading:'))),false);
  await ev(()=>document.querySelector('#topic-finish .book-link').click());await wait("document.querySelector('.evidence-path-guide')");
  await ev(()=>{const f=document.querySelector('#filter-topic');f.value='hm:topic:claim-decomposition';f.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#search-input').value='Claim Decomposition';document.querySelector('#search-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
  await wait("[...document.querySelectorAll('.result-card')].some(a=>a.href.includes('article=hm%3Aarticle%3A1770'))");
  await ev(()=>[...document.querySelectorAll('.result-card')].find(a=>a.href.includes('article=hm%3Aarticle%3A1770')).click());
  await wait("new URL(location.href).searchParams.get('article')==='hm:article:1770' && document.querySelectorAll('.hm-reviewed-lab[data-lab-ready=\"true\"]').length===2");
  await ev(()=>document.querySelector('#mobile-toc summary').click());assert.equal(await ev(()=>document.querySelector('#mobile-toc').open),true);
  const sectionHref=await ev(()=>document.querySelector('#mobile-topic-toc a[href*="section="]').href);
  await ev(href=>[...document.querySelectorAll('#mobile-topic-toc a')].find(a=>a.href===href).click(),sectionHref);
  await wait("new URL(location.href).searchParams.has('section')");
  assert.equal(await ev(()=>!!document.getElementById('sec-'+new URL(location.href).searchParams.get('section'))),true);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  writeFileSync(join(dir,'verification.json'),JSON.stringify({verifiedAt:new Date().toISOString(),expectedReleaseSha:process.env.HM_EXPECTED_RELEASE_SHA||null,articles:3,labRoots:6,coverage,externalRequests:external,errors,screenshots:shots},null,2));
  t.diagnostic('Evidence path proof: '+join(dir,'verification.json'));
 }finally{
  if(browser?.pid){try{await cdp?.request('Browser.close');cdp?.socket.close();}catch{}await Promise.race([new Promise(r=>browser.once('exit',r)),delay(2000)]);if(browser.exitCode===null)browser.kill();}
  if(server?.pid&&server.exitCode===null)server.kill();
 }
});
