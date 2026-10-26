import { browserEndpoint } from './browser-endpoint.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// This suite intentionally uses the same isolated, loopback-only Edge/CDP setup as
// reader-browser.test.mjs. It does not share browser profiles or kill global processes.
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const basePath = process.env.HM_PILOT_BASE_PATH || '';
const edgeCandidates = [process.env.HM_EDGE_PATH, process.platform === 'win32' ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' : null].filter(Boolean);
const edgePath = edgeCandidates.find(existsSync);
const expected = {
  'hm:article:2241': { controls: 32, kinds: ['video', 'citation'] },
  'hm:article:2310': { controls: 34, kinds: ['video', 'authorization'] },
  'hm:article:2494': { controls: 41, kinds: ['video', 'approval'] },
};
const plainArticles = ['hm:article:1073', 'hm:article:1077'];

class PipeClient {
  constructor(socket) {
    this.socket = socket; this.nextId = 1; this.pending = new Map();
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data); if (!message.id || !this.pending.has(message.id)) return;
      const { resolve, reject, timer, method } = this.pending.get(message.id); clearTimeout(timer); this.pending.delete(message.id);
      if (message.error) reject(new Error(`CDP ${method}: ${JSON.stringify(message.error)}`)); else resolve(message);
    });
  }
  request(method, params = {}, sessionId) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 10000);
      this.pending.set(id, { resolve, reject, timer, method });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  async evaluate(expression, sessionId) {
    const response = await this.request('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true }, sessionId);
    if (response.result.exceptionDetails) throw new Error(response.result.exceptionDetails.text || `Evaluation failed: ${expression}`);
    return response.result.result.value;
  }
}

async function waitFor(client, expression, sessionId, predicate = Boolean, timeoutMs = 15000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) { const value = await client.evaluate(expression, sessionId); if (predicate(value)) return value; await delay(100); }
  throw new Error(`Browser condition timed out: ${expression}`);
}
function serverAddress(server) {
  return new Promise((resolveAddress, reject) => {
    let output = ''; const timer = setTimeout(() => reject(new Error('Static server did not report a port')), 10000);
    server.stdout.setEncoding('utf8'); server.stdout.on('data', chunk => { output += chunk; const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)\//); if (match) { clearTimeout(timer); resolveAddress(`http://127.0.0.1:${match[1]}`); } });
    server.once('error', reject);
  });
}

test('article interactive controls, responsive state, remounts, and source safety', { skip: !edgePath && 'Microsoft Edge is unavailable; set HM_EDGE_PATH to run the local interactive acceptance suite.' }, async t => {
  const liveUrl = process.env.HM_LIVE_URL || '';
  const server = liveUrl ? null : spawn(process.execPath, ['scripts/serve-pilot.mjs'], { cwd: root, env: { ...process.env, HM_PILOT_PORT: '0' }, stdio: ['ignore', 'pipe', 'inherit'] });
  let browser, cdp, sessionId;
  try {
    const base = liveUrl ? new URL(liveUrl).origin : await serverAddress(server);
    const profile = join(tmpdir(), `hm-interactive-e2e-${process.pid}-${Date.now()}`);
    browser = spawn(edgePath, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
    let launchError = ''; browser.stderr.on('data', chunk => { launchError += chunk.toString(); });
    const [port,path] = await browserEndpoint(join(profile,'DevToolsActivePort'), browser);
    const socket = new WebSocket(`ws://127.0.0.1:${port}${path}`);
    await new Promise((resolveOpen, reject) => { socket.addEventListener('open', resolveOpen, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    cdp = new PipeClient(socket);
    const { result: target } = await cdp.request('Target.createTarget', { url: 'about:blank' });
    const { result: attached } = await cdp.request('Target.attachToTarget', { targetId: target.targetId, flatten: true }); sessionId = attached.sessionId;
    await cdp.request('Page.enable', {}, sessionId); await cdp.request('Runtime.enable', {}, sessionId);
    await cdp.request('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] }, sessionId);
    const topic = 'hm:topic:verify-ai-work';
    const url = liveUrl || new URL(`${basePath}/knowledge-textbook/?topic=${encodeURIComponent(topic)}`, base).href;
    if (liveUrl) {
      const expectedSha = process.env.HM_EXPECTED_RELEASE_SHA;
      assert.ok(expectedSha, 'HM_EXPECTED_RELEASE_SHA is required for live interactive verification');
      const releaseUrl = new URL('../release.json', url).href;
      const release = await fetch(releaseUrl).then(response => { assert.ok(response.ok, `live release.json returned ${response.status}`); return response.json(); });
      assert.equal(release.source_commit, expectedSha, 'live release SHA matches the expected release');
    }
    await cdp.request('Page.navigate', { url }, sessionId);
    await waitFor(cdp, `document.querySelectorAll('#reader-content .source-card').length`, sessionId, n => n >= 5);
    const initialPlayback = await cdp.evaluate(`['hm:article:2241','hm:article:2310','hm:article:2494'].map(id=>document.querySelector('[data-article-id="'+id+'"] [data-lab-kind="video"] [data-source-anchor="hm-pause-scene"]')?.getAttribute('aria-pressed'))`, sessionId);
    assert.deepEqual(initialPlayback, ['false','false','false'], 'no-preference playback starts on in all video instances');

    const registrySafety = await cdp.evaluate(`(async()=>{const registry=await import('./labs/registry.mjs');const bundle=await (await fetch('../data/pilot-content-bundle.json')).json();const source=bundle.articles.find(x=>x.article_id==='hm:article:2241');await registry.prepareInteractiveEntries([source]);const cloned=structuredClone(source);cloned.blocks[0].html += '<button id="copied-approved-root" data-lab-kind="approval" data-lab-ready="true" onclick="window.__clonedLabRan=true">run</button>';const accepted=await registry.prepareInteractiveEntries([cloned]);return {accepted,roots:registry.approvedLabRoots(cloned),sourceStillApproved:!!registry.approvedLabRoots(source),active:window.__clonedLabRan===true}})()`, sessionId);
    assert.deepEqual(registrySafety.accepted, [], 'mutated source HTML fails its pinned SHA'); assert.equal(registrySafety.roots, null, 'copied metadata cannot create a trusted registry approval'); assert.equal(registrySafety.sourceStillApproved, true, 'the verified source entry remains approved'); assert.equal(registrySafety.active, false, 'the modified inline handler stays inert');
    const results = {};
    const articleIds = Object.keys(expected);
    for (const articleId of [...articleIds, ...plainArticles]) {
      const article = await cdp.evaluate(`document.querySelector('[data-article-id="${articleId}"]')?.closest('.source-card')?.outerHTML || ''`, sessionId);
      assert.ok(article, `article ${articleId} is rendered`);
      await cdp.evaluate(`document.querySelector('[data-article-id="${articleId}"]').closest('.source-card').scrollIntoView({block:'start',behavior:'instant'})`, sessionId);
      if (plainArticles.includes(articleId)) {
        assert.equal(await cdp.evaluate(`document.querySelector('[data-article-id="${articleId}"]').closest('.source-card').querySelectorAll('.hm-reviewed-lab').length`, sessionId), 0, `${articleId} remains noninteractive`);
        continue;
      }
      const spec = expected[articleId];
      await waitFor(cdp, `document.querySelectorAll('[data-article-id="${articleId}"] .hm-reviewed-lab[data-lab-ready="true"]').length`, sessionId, n => n === spec.kinds.length);
      const roots = await cdp.evaluate(`Array.from(document.querySelectorAll('[data-article-id="${articleId}"] .hm-reviewed-lab[data-lab-ready="true"]')).map(root=>({kind:root.dataset.labKind,controls:[...root.querySelectorAll('input,select,button,textarea')].filter(x=>x.closest('.hm-reviewed-lab')===root&&!x.matches('[data-lab-reset]')).length,initialValues:[...root.querySelectorAll('input,select,textarea')].filter(x=>x.closest('.hm-reviewed-lab')===root&&!x.readOnly).map(x=>x.type==='checkbox'?x.checked:x.tagName==='SELECT'?x.value:x.value),details:[...root.querySelectorAll('details')].filter(x=>x.closest('.hm-reviewed-lab')===root).length,reset:[...root.querySelectorAll('[data-lab-reset]')].some(x=>x.closest('.hm-reviewed-lab')===root),sources:[...root.querySelectorAll('[data-source-anchor]')].map(x=>x.dataset.sourceAnchor),html:root.innerHTML}))`, sessionId);
      assert.deepEqual(roots.map(r => r.kind).sort(), [...spec.kinds].sort(), `${articleId} approved lab kinds`);
      assert.ok(roots.every(r => r.reset), `${articleId} has one root reset control in each lab`);
      const total = roots.reduce((n, r) => n + r.controls, 0);
      assert.equal(total, spec.controls, `${articleId}: all expected source controls are mounted before reset`);
      assert.ok(roots.every(r => r.sources.length > 0), `${articleId} retains source anchors as inert data attributes`);
      results[articleId] = { roots, total };
      results[articleId].initialValues = roots.flatMap(r => r.initialValues);
    }

    // The named source controls are explicit coverage gates. Every source button,
    // field, and disclosure must be reached, while each scenario produces visible feedback.
    const exercised = await cdp.evaluate(`(()=>{
      const article=document.querySelector('[data-article-id="hm:article:2241"]'); const root=article;
      const bySourceId=(r,id)=>r.querySelector('[data-source-anchor="'+id+'"]');
      const citation=root.querySelector('[data-lab-kind="citation"]');
      const cCurrent=bySourceId(citation,'hmcite-current'), cCitation=bySourceId(citation,'hmcite-citation'), cCase=bySourceId(citation,'hmcite-case');
      if(cCurrent&&cCitation&&cCase){for(const current of [...cCurrent.options])for(const cite of [...cCitation.options])cCase.selectedIndex=0,cCurrent.value=current.value,cCitation.value=cite.value,cCurrent.dispatchEvent(new Event('change',{bubbles:true})),cCitation.dispatchEvent(new Event('change',{bubbles:true})),bySourceId(citation,'hmcite-evaluate').click();
        for(const option of [...cCase.options]){cCase.value=option.value;cCase.dispatchEvent(new Event('change',{bubbles:true}));bySourceId(citation,'hmcite-evaluate').click();}}
      const acl=document.querySelector('[data-article-id="hm:article:2310"] [data-lab-kind="authorization"]');
      if(acl){for(const x of acl.querySelectorAll('select')){for(const o of [...x.options]){x.value=o.value;x.dispatchEvent(new Event('change',{bubbles:true}));}}
        const tenant=bySourceId(acl,'hmacl-tenant'); if(tenant) for(const o of [...tenant.options]){tenant.value=o.value;tenant.dispatchEvent(new Event('change',{bubbles:true}));bySourceId(acl,'hmacl-next')?.click();bySourceId(acl,'hmacl-prev')?.click();}
        bySourceId(acl,'hmacl-reset')?.click(); for(const b of acl.querySelectorAll('button:not([data-lab-reset])')) b.click();}
      const approval=document.querySelector('[data-article-id="hm:article:2494"] [data-lab-kind="approval"]');
      if(approval){for(const el of approval.querySelectorAll('input,select,textarea')){if(el.type==='checkbox')el.checked=!el.checked;else if(el.tagName==='SELECT')el.selectedIndex=Math.min(1,el.options.length-1);else if(el.type==='range')el.value=el.max;else el.value='acceptance-test';el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
        for(const b of approval.querySelectorAll('button:not([data-lab-reset])'))b.click();}
      const videos=[...document.querySelectorAll('.hm-reviewed-lab[data-lab-kind="video"]')];
      for(const v of videos){for(const b of v.querySelectorAll('[data-camera]'))b.click();for(const b of v.querySelectorAll('[data-stage]'))b.click();bySourceId(v,'hm-pause-scene')?.click();
        for(const b of v.querySelectorAll('[data-platform]'))b.click();const f=bySourceId(v,'hm-format');if(f)for(const o of [...f.options]){f.value=o.value;f.dispatchEvent(new Event('change',{bubbles:true}));}
        for(const el of v.querySelectorAll('input,select,textarea')){if(el.type==='checkbox')el.checked=!el.checked;else if(el.tagName==='SELECT')el.selectedIndex=Math.min(1,el.options.length-1);else if(el.type==='range')el.value=el.max;else if(!el.readOnly)el.value='<img src=x onerror=window.__labXss=1>';el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
        bySourceId(v,'hm-generate-prompt')?.click();for(const b of v.querySelectorAll('[data-source-anchor="hm-copy-prompt"],[data-source-anchor="hm-copy-prompt-bottom"]'))b.click();for(const d of v.querySelectorAll('details')){d.open=!d.open;d.dispatchEvent(new Event('toggle'));}
        const canvas=v.querySelector('canvas');if(canvas){canvas.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1,clientX:20,clientY:20}));canvas.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:1,clientX:80,clientY:65}));canvas.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1,clientX:80,clientY:65}));canvas.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'ArrowRight'}));canvas.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:40,clientY:40}));}}
      const roots=[...document.querySelectorAll('.hm-reviewed-lab[data-lab-ready="true"]')];
      return {controlIds:roots.flatMap(r=>[...r.querySelectorAll('input,select,button,textarea')].filter(e=>e.closest('.hm-reviewed-lab')===r&&!e.matches('[data-lab-reset]')).map(e=>e.dataset.sourceAnchor||e.dataset.camera||e.dataset.stage||e.dataset.platform||e.getAttribute('aria-label')||e.name||e.type)), citationResult:bySourceId(citation,'hmcite-case-result')?.textContent||'', aclText:acl?.textContent||'', approvalText:approval?.textContent||'', prompts:[...document.querySelectorAll('.hm-reviewed-lab textarea')].map(x=>x.value), errors:window.__labXss===true};
    })()`, sessionId);
    const semantic = await cdp.evaluate(`(async()=>{
      const by=(r,id)=>r.querySelector('[data-source-anchor="'+id+'"]');
      const cite=document.querySelector('[data-article-id="hm:article:2241"] [data-lab-kind="citation"]');
      const current=by(cite,'hmcite-current'),citation=by(cite,'hmcite-citation'),caseSelect=by(cite,'hmcite-case'),timeline=by(cite,'hmcite-timeline-result'),caseResult=by(cite,'hmcite-case-result');
      const revisionStates=[];for(const a of [...current.options])for(const b of [...citation.options]){current.value=a.value;citation.value=b.value;current.dispatchEvent(new Event('change',{bubbles:true}));citation.dispatchEvent(new Event('change',{bubbles:true}));revisionStates.push({pair:a.value+'/'+b.value,state:timeline.dataset.state});}
      const caseStates=[];for(const option of [...caseSelect.options]){caseSelect.value=option.value;caseSelect.dispatchEvent(new Event('change',{bubbles:true}));by(cite,'hmcite-evaluate').click();caseStates.push({id:option.value,state:caseResult.dataset.state,text:caseResult.textContent});}
      const acl=document.querySelector('[data-article-id="hm:article:2310"] [data-lab-kind="authorization"]'),tenant=by(acl,'hmacl-tenant'),position=by(acl,'hmacl-filter-position'),topk=by(acl,'hmacl-topk'),order=by(acl,'hmacl-order-result');
      const set=(e,v)=>{e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));};
      set(tenant,'tenant-a');set(topk,[...topk.options].at(-1).value);set(position,'early');const earlyA=order.textContent;set(position,'late');const lateA=order.textContent;set(tenant,'tenant-b');set(position,'early');const earlyB=order.textContent;set(tenant,'missing');set(position,'early');const missing=order.textContent;
      const nodes=[...acl.querySelectorAll('.acl-node')],step=()=>nodes.findIndex(n=>n.classList.contains('is-active'));by(acl,'hmacl-reset').click();for(let i=0;i<5;i++)by(acl,'hmacl-prev').click();const minStep=step();for(let i=0;i<8;i++)by(acl,'hmacl-next').click();const maxStep=step();
      const approval=document.querySelector('[data-article-id="hm:article:2494"] [data-lab-kind="approval"]'),status=by(approval,'ap2217-status'),fields=['tenant','actor','tool','report','revision','visibility','body'];
      const mutate=el=>{if(el.tagName==='SELECT')el.selectedIndex=(el.selectedIndex+1)%el.options.length;else el.value='changed-'+Math.random().toString(16).slice(2);el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
      const approvalFields=[];for(const name of fields){by(approval,'ap2217-reset').click();by(approval,'ap2217-approve').click();const field=by(approval,'ap2217-'+name),old=field.value;mutate(field);by(approval,'ap2217-consume').click();const changedStatus=status.textContent;field.value=old;field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));by(approval,'ap2217-consume').click();approvalFields.push({name,first:changedStatus,afterRestore:status.textContent});}
      const scope=[];for(const name of ['tenant','actor']){by(approval,'ap2217-reset').click();by(approval,'ap2217-approve').click();const field=by(approval,'ap2217-'+name),old=field.value;mutate(field);by(approval,'ap2217-consume').click();scope.push({name,text:status.textContent});field.value=old;field.dispatchEvent(new Event('change',{bubbles:true}));}
      by(approval,'ap2217-reset').click();by(approval,'ap2217-approve').click();by(approval,'ap2217-expire').click();by(approval,'ap2217-consume').click();const expired=status.textContent;
      by(approval,'ap2217-reset').click();by(approval,'ap2217-approve').click();by(approval,'ap2217-consume').click();const allowed=status.textContent;by(approval,'ap2217-consume').click();const replay=status.textContent;
      const scene=by(approval,'ap2217-scene'),sceneResult=by(approval,'ap2217-scene-result'),sceneStates=[];for(const o of [...scene.options]){set(scene,o.value);sceneStates.push({id:o.value,state:sceneResult.dataset.state,text:sceneResult.textContent});}
      const view=by(approval,'ap2217-view'),track=by(approval,'ap2217-track'),viewBeforeFour=track.dataset.view;for(let i=0;i<4;i++)view.click();const viewAfterFour=track.dataset.view;by(approval,'ap2217-reset').click();const resetStatus=status.textContent;by(approval,'ap2217-consume').click();const afterReset=status.textContent;
      const video=document.querySelector('[data-article-id="hm:article:2241"] [data-lab-kind="video"]'),vp=(id)=>by(video,id);
      const cameras=[];for(const b of video.querySelectorAll('[data-camera]')){b.click();cameras.push({id:b.dataset.camera,pressed:b.getAttribute('aria-pressed')});}
      const stages=[];for(const b of video.querySelectorAll('[data-stage]')){b.click();stages.push({id:b.dataset.stage,current:b.getAttribute('aria-pressed')});}
      video.querySelector('[data-lab-reset]')?.click();const pause=vp('hm-pause-scene'),pauseBefore=pause.getAttribute('aria-pressed');pause.click();const paused=pause.getAttribute('aria-pressed');pause.click();const resumed=pause.getAttribute('aria-pressed');
      const platformResults=[];for(const b of video.querySelectorAll('[data-platform]')){b.click();platformResults.push({id:b.dataset.platform,pressed:b.getAttribute('aria-pressed'),ratio:vp('hm-ratio-text').textContent});}
      const format=vp('hm-format'),formats=[];for(const o of [...format.options]){set(format,o.value);formats.push({value:o.value,prompt:vp('hm-prompt-text').value});}
      const malicious='<img src=x onerror=window.__labXss=1>';vp('hm-topic').value=malicious;vp('hm-topic').dispatchEvent(new Event('input',{bubbles:true}));const escapedPrompt=vp('hm-prompt-text').value.includes(malicious),injectedNode=video.querySelector('img[src="x"]');
      const duration=vp('hm-duration');const rangeLimits=[];for(const b of video.querySelectorAll('[data-platform]')){b.click();duration.value=duration.min;duration.dispatchEvent(new Event('input',{bubbles:true}));rangeLimits.push({id:b.dataset.platform,min:duration.min,max:duration.max,atMin:duration.value});duration.value=duration.max;duration.dispatchEvent(new Event('input',{bubbles:true}));rangeLimits.at(-1).atMax=duration.value;}
      const toggleResults=[];for(const id of ['hm-subtitles','hm-motion','hm-voice']){const e=vp(id);e.checked=!e.checked;e.dispatchEvent(new Event('change',{bubbles:true}));toggleResults.push({id,checked:e.checked});}
      const metrics={};for(const [id,value] of [['hm-clip-count','60'],['hm-manual-min','15'],['hm-ai-min','180'],['hm-hour-rate','100'],['hm-ai-cost','500']]){const e=vp(id);e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));metrics[id]=e.value;}metrics.hours=vp('hm-hours-saved').textContent;metrics.cost=vp('hm-cost-saving').textContent;metrics.color=getComputedStyle(vp('hm-cost-saving')).color;
      vp('hm-generate-prompt').click();const generated=vp('hm-prompt-text').value;vp('hm-copy-prompt').click();await new Promise(r=>setTimeout(r,120));const copyStatus=by(video,'hm-copy-status').textContent,selection=window.getSelection()?.toString()||'';vp('hm-copy-prompt-bottom').click();
      const canvas=vp('hm-3d-canvas');const before=canvas.toDataURL();canvas.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:3,clientX:30,clientY:30}));canvas.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:3,clientX:100,clientY:80}));canvas.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:3,clientX:100,clientY:80}));const drag=by(video,'hm-view-label').textContent;canvas.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'ArrowRight'}));const rect=canvas.getBoundingClientRect(),oldStage=video.querySelector('.hm-node-btn.is-current')?.dataset.stage;let tapped=false;for(let y=4;y<rect.height&&!tapped;y+=12)for(let x=4;x<rect.width&&!tapped;x+=12){canvas.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:4,clientX:rect.left+x,clientY:rect.top+y}));canvas.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:4,clientX:rect.left+x,clientY:rect.top+y}));tapped=video.querySelector('.hm-node-btn.is-current')?.dataset.stage!==oldStage;}
      return {revisionStates,caseStates,earlyA,lateA,earlyB,missing,minStep,maxStep,approvalFields,scope,expired,allowed,replay,sceneStates,viewBeforeFour,viewAfterFour,resetStatus,afterReset,cameras,stages,pauseBefore,paused,resumed,platformResults,formats,escapedPrompt,injectedNode:!!injectedNode,rangeLimits,toggleResults,metrics,generated:generated.length,copyStatus,selectionLength:selection.length,canvasChanged:canvas.toDataURL()!==before,drag,tapped};
    })()`, sessionId);
    const aclCartesian = await cdp.evaluate(`(()=>{const r=document.querySelector('[data-article-id="hm:article:2310"] [data-lab-kind="authorization"]'),by=id=>r.querySelector('[data-source-anchor="'+id+'"]'),tenant=by('hmacl-tenant'),position=by('hmacl-filter-position'),topk=by('hmacl-topk'),out=by('hmacl-order-result'),rows=[];for(const t of [...tenant.options])for(const p of [...position.options])for(const k of [...topk.options]){tenant.value=t.value;position.value=p.value;topk.value=k.value;for(const e of [tenant,position,topk])e.dispatchEvent(new Event('change',{bubbles:true}));rows.push({tenant:t.value,position:p.value,topk:k.value,text:out.textContent});}return rows})()`, sessionId);
    const videoIsolation = await cdp.evaluate(`(()=>{const articles=['hm:article:2241','hm:article:2310','hm:article:2494'],videos=articles.map(id=>({id,root:document.querySelector('[data-article-id="'+id+'"] [data-lab-kind="video"]')})),by=(r,id)=>r.querySelector('[data-source-anchor="'+id+'"]');for(const v of videos){v.root.querySelector('[data-lab-reset]')?.click();v.root.querySelector('[data-platform="youtube"]')?.click();const topic=by(v.root,'hm-topic');topic.value='article-local-'+v.id;topic.dispatchEvent(new Event('input',{bubbles:true}));}const snapshots=videos.map(v=>({id:v.id,topic:by(v.root,'hm-topic').value,prompt:by(v.root,'hm-prompt-text').value,preview:by(v.root,'hm-preview-title').textContent,ratio:by(v.root,'hm-ratio-text').textContent,duration:by(v.root,'hm-duration').value,max:by(v.root,'hm-duration').max,metric:by(v.root,'hm-count-value').textContent}));const otherBefore=snapshots.slice(1).map(x=>x.prompt);const count=by(videos[0].root,'hm-clip-count');count.value=count.max;count.dispatchEvent(new Event('input',{bubbles:true}));const firstMetric=by(videos[0].root,'hm-count-value').textContent,othersAfter=videos.slice(1).map(v=>by(v.root,'hm-prompt-text').value);
      const semantics=videos.map(v=>{const r=v.root,cameras=[],stages=[],platforms=[],toggles=[];for(const b of r.querySelectorAll('[data-camera]')){b.click();cameras.push({id:b.dataset.camera,pressed:b.getAttribute('aria-pressed'),label:by(r,'hm-view-label').textContent});}for(const b of r.querySelectorAll('[data-stage]')){b.click();stages.push({id:b.dataset.stage,pressed:b.getAttribute('aria-pressed'),current:r.querySelector('.hm-node-btn.is-current')?.dataset.stage});}for(const b of r.querySelectorAll('[data-platform]')){b.click();const d=by(r,'hm-duration');platforms.push({id:b.dataset.platform,pressed:b.getAttribute('aria-pressed'),min:d.min,max:d.max,ratio:by(r,'hm-ratio-text').textContent});}for(const id of ['hm-subtitles','hm-motion','hm-voice']){const e=by(r,id);e.checked=!e.checked;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));toggles.push({id,checked:e.checked,subtitleVisible:by(r,'hm-demo-sub').style.display,glowOpacity:r.querySelector('.hm-frame-glow')?.style.opacity,prompt:by(r,'hm-prompt-text').value});}by(r,'hm-generate-prompt').click();return {id:v.id,cameras,stages,platforms,toggles,generated:by(r,'hm-prompt-text').value,feedback:by(r,'hm-copy-status').textContent};});
      return {snapshots,otherBefore,othersAfter,firstMetric,maxClips:count.max,semantics}})()`, sessionId);
    const interactionCoverage = await cdp.evaluate(`(async()=>{const articles=['hm:article:2241','hm:article:2310','hm:article:2494'],covered=[],details=[];for(const aid of articles){const article=document.querySelector('[data-article-id="'+aid+'"]').closest('.source-card');for(const r of article.querySelectorAll('.hm-reviewed-lab[data-lab-ready="true"]')){const prefix=aid+'/'+r.dataset.labKind;for(const e of r.querySelectorAll('input,select,button,textarea')){if(e.closest('.hm-reviewed-lab')!==r||e.matches('[data-lab-reset]'))continue;const name=e.dataset.sourceAnchor||e.dataset.camera||e.dataset.stage||e.dataset.platform||e.type;const key=prefix+'/'+name;if(e.tagName==='SELECT'){for(const o of [...e.options]){e.value=o.value;e.dispatchEvent(new Event('change',{bubbles:true}));}}else if(e.tagName==='BUTTON'){e.click();}else if(e.type==='checkbox'){e.checked=!e.checked;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}else if(e.type==='range'){e.value=e.max;e.dispatchEvent(new Event('input',{bubbles:true}));e.value=e.min;e.dispatchEvent(new Event('input',{bubbles:true}));}else if(e.readOnly){void e.value;}else{e.value='coverage-'+name;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}covered.push(key);}for(const d of [...r.querySelectorAll('details')].filter(x=>x.closest('.hm-reviewed-lab')===r)){d.open=!d.open;details.push(prefix+'/'+(d.dataset.sourceAnchor||d.querySelector('summary')?.textContent||'disclosure'));}}}await new Promise(r=>setTimeout(r,100));return {covered,details,resets:[...document.querySelectorAll('.hm-reviewed-lab[data-lab-ready="true"] [data-lab-reset]')].length,copyStatus:[...document.querySelectorAll('[data-source-anchor="hm-copy-status"]')].map(x=>x.textContent)}})()`, sessionId);
    assert.deepEqual(semantic.revisionStates.map(x=>x.state), ['verified','rejected','rejected','verified'], 'citation 2x2 current/cited revision combinations');
    const caseCodes={correct:'QUOTE_VERIFIED',stale:'STALE_REVISION',mutated:'DIGEST_MISMATCH',wrongspan:'QUOTE_SPAN_MISMATCH',unknown:'UNKNOWN_SOURCE'};
    for(const item of semantic.caseStates){assert.equal(item.state,item.id==='correct'?'verified':'rejected');assert.ok(item.text.includes(caseCodes[item.id]), `citation case ${item.id} output`);}
    assert.ok(semantic.earlyA.includes('hydrated IDs [doc-A1]')&&!semantic.earlyA.includes('doc-forbidden'), 'tenant A authorization filters before hydration');
    assert.ok(semantic.lateA.includes('hydrated IDs [doc-forbidden')&&semantic.lateA.includes('allowed output IDs [doc-A1]'), 'late filtering exposes forbidden hydration before output filtering');
    assert.ok(semantic.earlyB.includes('hydrated IDs [doc-B1]')&&!semantic.earlyB.includes('doc-forbidden'), 'tenant B authorization filters before hydration');
    assert.ok(semantic.missing.includes('hydrated IDs []')&&semantic.minStep===0&&semantic.maxStep===3, 'missing tenant denies by default and step controls clamp to endpoints');
    const candidates=['doc-forbidden','doc-A1','doc-B1'];assert.equal(aclCartesian.length,12,'all tenant × filter-position × TopK combinations were evaluated');
    for(const row of aclCartesian){const allowed=row.tenant==='tenant-a'?['doc-A1']:row.tenant==='tenant-b'?['doc-B1']:[],hydrated=row.position==='early'?candidates.filter(id=>allowed.includes(id)).slice(0,Number(row.topk)):candidates.slice(0,Number(row.topk));const output=hydrated.filter(id=>allowed.includes(id));const actualHydrated=row.text.match(/hydrated IDs \[([^\]]*)\]/)?.[1].split(', ').filter(Boolean)||[];const actualOutput=row.text.match(/allowed output IDs \[([^\]]*)\]/)?.[1].split(', ').filter(Boolean)||[];assert.deepEqual(actualHydrated,hydrated,`authorization hydrated IDs ${row.tenant}/${row.position}/TopK${row.topk}`);assert.deepEqual(actualOutput,output,`authorization output IDs ${row.tenant}/${row.position}/TopK${row.topk}`);}
    for(const item of semantic.approvalFields){assert.ok(item.first.includes(item.name==='tenant'||item.name==='actor'?'DENY_SCOPE':'DENY_CHANGED'), `${item.name} approval change is rejected`);if(!['tenant','actor'].includes(item.name))assert.ok(item.afterRestore.includes('DENY_INVALIDATED'),'restoring changed action cannot revive invalidated approval');}
    assert.ok(semantic.scope.every(x=>x.text.includes('DENY_SCOPE')));assert.ok(semantic.expired.includes('DENY_EXPIRED'));assert.ok(semantic.allowed.includes('ALLOW_MOCK_ONLY'));assert.ok(semantic.replay.includes('DENY_USED'));
    assert.deepEqual(semantic.sceneStates.map(x=>x.id).sort(), ['a','changed','expired','replay']);assert.ok(semantic.sceneStates.every(x=>x.text.length>0));assert.equal(semantic.viewAfterFour,semantic.viewBeforeFour,'four view clicks cycle back to the starting view');assert.ok(semantic.afterReset.includes('DENY_UNKNOWN'));
    assert.deepEqual(semantic.cameras.map(x=>x.id).sort(),['front','orbit','top']);assert.equal(semantic.stages.length,6);assert.ok(semantic.stages.every(x=>x.current==='true'));assert.equal(semantic.pauseBefore,'false');assert.equal(semantic.paused,'true','pause control pauses active playback');assert.equal(semantic.resumed,'false','pause control resumes playback');assert.ok(semantic.platformResults.every(x=>x.pressed==='true'&&x.ratio.length>0));assert.equal(semantic.formats.length,3);
    assert.ok(semantic.escapedPrompt&&!semantic.injectedNode,'video topic is escaped as prompt text');assert.ok(semantic.rangeLimits.every(x=>Number(x.min)===Number(x.atMin)&&Number(x.max)===Number(x.atMax)));
    assert.equal(semantic.toggleResults.length,3);assert.equal(semantic.metrics.hours,'-165.0 ชม./เดือน');assert.ok(semantic.metrics.cost.includes('46,500')&&semantic.metrics.cost.includes('−'),'negative savings are displayed');assert.ok(semantic.generated>100);
    const copied = /คัดลอก Prompt แล้ว/.test(semantic.copyStatus) ? 'clipboard-write' : 'selection-fallback';
    if(copied==='selection-fallback') assert.ok(semantic.selectionLength>0, `clipboard blocked; fallback selection is present (${semantic.copyStatus})`);
    assert.equal(semantic.canvasChanged,true,'canvas responds visually to pointer drag and keyboard input');assert.equal(semantic.drag,'CUSTOM 3D');assert.equal(semantic.tapped,true,'canvas tap selects a rendered stage');
    assert.equal(videoIsolation.snapshots.length,3);for(const item of videoIsolation.snapshots){assert.ok(item.prompt.includes(item.topic));assert.ok(item.preview.includes(item.topic));assert.ok(item.ratio.includes('16:9'));assert.equal(item.duration,'420');assert.equal(item.max,'600');}assert.ok(videoIsolation.firstMetric.startsWith('60'));assert.deepEqual(videoIsolation.othersAfter,videoIsolation.otherBefore,'changing one video calculator leaves other articles unchanged');
    const platformLimits={tiktok:[15,180],reels:[15,180],youtube:[300,600]};for(const item of videoIsolation.semantics){assert.equal(item.cameras.length,3);assert.ok(item.cameras.every(c=>c.pressed==='true'&&c.label.toUpperCase().includes(c.id.toUpperCase())),'each camera button selects its own view');assert.equal(item.stages.length,6);assert.ok(item.stages.every(s=>s.pressed==='true'&&s.current===s.id),'each workflow stage button selects its own stage');for(const p of item.platforms){assert.equal(p.pressed,'true');assert.deepEqual([Number(p.min),Number(p.max)],platformLimits[p.id]);assert.ok(p.ratio.includes(p.id==='youtube'?'16:9':'9:16'));}assert.equal(item.toggles.length,3);for(const toggle of item.toggles){if(toggle.id==='hm-subtitles')assert.equal(toggle.subtitleVisible,toggle.checked?'inline-block':'none');if(toggle.id==='hm-motion')assert.equal(toggle.glowOpacity,toggle.checked?'1':'0.22');if(toggle.id==='hm-voice')assert.ok(toggle.prompt.includes(toggle.checked?'เสียงพากย์':'เสียงจากฟุตเทจเดิม'));}assert.ok(item.generated.includes(`article-local-${item.id}`)&&item.generated.includes('YouTube'));}
    assert.equal(interactionCoverage.covered.length,107,'all 107 source controls received an action or value read');assert.equal(new Set(interactionCoverage.covered).size,107,'source control coverage IDs are unique and complete');assert.equal(interactionCoverage.resets,6,'each of six roots has an added reset control');assert.ok(interactionCoverage.details.length>0,'all source details disclosures were toggled');assert.equal(new Set(interactionCoverage.details).size,interactionCoverage.details.length,'details disclosure coverage IDs are unique');
    const allControlCount = Object.values(results).reduce((n, x) => n + x.total, 0);
    assert.equal(exercised.controlIds.length, allControlCount, 'enumerated and exercised every source control exactly once by ownership');
    assert.ok(!exercised.errors, 'malicious title remains inert');
    assert.ok(exercised.citationResult.length > 0, 'citation combinations render evaluation output');
    assert.ok(exercised.aclText.length > 0, 'authorization tenant and retrieval controls show state');
    assert.ok(exercised.approvalText.length > 0, 'approval edits and actions show state');
    assert.ok(exercised.prompts.some(text => text.length > 0), 'video generation produces a prompt');

    // Test reset boundaries, URL history/remount registration and duplicate IDs.
    for (const articleId of articleIds) {
      await cdp.evaluate(`document.querySelector('[data-article-id="${articleId}"]').closest('.source-card').scrollIntoView({block:'start',behavior:'instant'})`, sessionId);
      const defaults = results[articleId].initialValues;
      await cdp.evaluate(`document.querySelectorAll('[data-article-id="${articleId}"] [data-lab-reset]').forEach(x=>x.click())`, sessionId);
      assert.equal(await cdp.evaluate(`document.querySelector('[data-article-id="${articleId}"]').querySelectorAll('.hm-reviewed-lab[data-lab-ready="true"]').length`, sessionId), expected[articleId].kinds.length);
      assert.deepEqual(await cdp.evaluate(`(()=>{const a=document.querySelector('[data-article-id="${articleId}"]');return [...a.querySelectorAll('.hm-reviewed-lab')].flatMap(r=>[...r.querySelectorAll('input,select,textarea')].filter(x=>x.closest('.hm-reviewed-lab')===r&&!x.readOnly)).map(x=>x.type==='checkbox'?x.checked:x.value)})()`, sessionId), defaults, `${articleId} reset restores initial editable state`);
      assert.equal(await cdp.evaluate(`(()=>{const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);return ids.length===new Set(ids).size})()`, sessionId), true, 'no duplicate IDs after reset/remount');
    }
    // A real topic switch disposes the article roots and Back recreates them.
    // Manager getState must preserve changed controls without duplicating listeners.
    const navArticle = 'hm:article:2241';
    await cdp.evaluate(`document.querySelector('[data-article-id="${navArticle}"]').closest('.source-card').scrollIntoView({block:'start',behavior:'instant'})`, sessionId);
    const beforeRemount = await cdp.evaluate(`(()=>{const by=(r,id)=>r.querySelector('[data-source-anchor="'+id+'"]'),a=document.querySelector('[data-article-id="${navArticle}"]'),v=a.querySelector('[data-lab-kind="video"]'),c=a.querySelector('[data-lab-kind="citation"]'),acl=document.querySelector('[data-article-id="hm:article:2310"] [data-lab-kind="authorization"]'),ap=document.querySelector('[data-article-id="hm:article:2494"] [data-lab-kind="approval"]');
      v.querySelector('[data-platform="youtube"]').click();const input=by(v,'hm-topic');input.value='remount-state-sentinel';input.dispatchEvent(new Event('input',{bubbles:true}));
      by(c,'hmcite-current').value='v1';by(c,'hmcite-citation').value='v2';by(c,'hmcite-current').dispatchEvent(new Event('change',{bubbles:true}));by(c,'hmcite-citation').dispatchEvent(new Event('change',{bubbles:true}));by(c,'hmcite-case').value='mutated';by(c,'hmcite-case').dispatchEvent(new Event('change',{bubbles:true}));by(c,'hmcite-evaluate').click();
      by(acl,'hmacl-tenant').value='tenant-b';by(acl,'hmacl-filter-position').value='late';by(acl,'hmacl-topk').value=[...by(acl,'hmacl-topk').options].at(-1).value;for(const e of [by(acl,'hmacl-tenant'),by(acl,'hmacl-filter-position'),by(acl,'hmacl-topk')])e.dispatchEvent(new Event('change',{bubbles:true}));by(acl,'hmacl-next').click();by(acl,'hmacl-next').click();
      by(ap,'ap2217-report').value='remount-approved-report';by(ap,'ap2217-report').dispatchEvent(new Event('input',{bubbles:true}));by(ap,'ap2217-approve').click();by(ap,'ap2217-scene').value='changed';by(ap,'ap2217-scene').dispatchEvent(new Event('change',{bubbles:true}));by(ap,'ap2217-view').click();
      return {citationCurrent:by(c,'hmcite-current').value,citationRef:by(c,'hmcite-citation').value,citationState:by(c,'hmcite-timeline-result').dataset.state,citationCase:by(c,'hmcite-case-result').textContent,tenant:by(acl,'hmacl-tenant').value,position:by(acl,'hmacl-filter-position').value,topk:by(acl,'hmacl-topk').value,step:[...acl.querySelectorAll('.acl-node')].findIndex(n=>n.classList.contains('is-active')),order:by(acl,'hmacl-order-result').textContent,report:by(ap,'ap2217-report').value,status:by(ap,'ap2217-status').textContent,scene:by(ap,'ap2217-scene').value,sceneText:by(ap,'ap2217-scene-result').textContent,view:by(ap,'ap2217-track').dataset.view,viewLabel:by(ap,'ap2217-view').textContent};})()`, sessionId);
    assert.equal(beforeRemount.citationState,'rejected');assert.ok(beforeRemount.citationCase.includes('DIGEST_MISMATCH'));assert.equal(beforeRemount.tenant,'tenant-b');assert.equal(beforeRemount.position,'late');assert.equal(beforeRemount.step,2);assert.ok(beforeRemount.order.includes('doc-forbidden'));assert.equal(beforeRemount.report,'remount-approved-report');assert.ok(beforeRemount.status.includes('receipt'));assert.equal(beforeRemount.scene,'changed');assert.equal(beforeRemount.view,'1');
    const toOtherTopic = await cdp.evaluate(`document.querySelector('#topic-toc a[href*="ai-news-industry"]')?.getAttribute('href')||''`, sessionId); assert.ok(toOtherTopic, 'second topic navigation exists');
    await cdp.evaluate(`document.querySelector('#topic-toc a[href*="ai-news-industry"]').click()`, sessionId);
    await waitFor(cdp, `new URL(location.href).searchParams.get('topic')`, sessionId, value => value === 'hm:topic:ai-news-industry');
    await cdp.evaluate('history.back()', sessionId); await waitFor(cdp, `new URL(location.href).searchParams.get('topic')`, sessionId, value => value === topic);
    const restored = await cdp.evaluate(`(()=>{const by=(r,id)=>r.querySelector('[data-source-anchor="'+id+'"]'),a=document.querySelector('[data-article-id="${navArticle}"]'),v=a.querySelector('[data-lab-kind="video"]'),c=a.querySelector('[data-lab-kind="citation"]'),acl=document.querySelector('[data-article-id="hm:article:2310"] [data-lab-kind="authorization"]'),ap=document.querySelector('[data-article-id="hm:article:2494"] [data-lab-kind="approval"]');return {topic:by(v,'hm-topic')?.value,platform:v.querySelector('[data-platform="youtube"]')?.getAttribute('aria-pressed'),duration:by(v,'hm-duration')?.value,max:by(v,'hm-duration')?.max,ready:v.dataset.labReady,rootCount:a.querySelectorAll('.hm-reviewed-lab[data-lab-ready="true"]').length,citationCurrent:by(c,'hmcite-current').value,citationRef:by(c,'hmcite-citation').value,citationState:by(c,'hmcite-timeline-result').dataset.state,citationCase:by(c,'hmcite-case-result').textContent,tenant:by(acl,'hmacl-tenant').value,position:by(acl,'hmacl-filter-position').value,topk:by(acl,'hmacl-topk').value,step:[...acl.querySelectorAll('.acl-node')].findIndex(n=>n.classList.contains('is-active')),order:by(acl,'hmacl-order-result').textContent,report:by(ap,'ap2217-report').value,status:by(ap,'ap2217-status').textContent,scene:by(ap,'ap2217-scene').value,sceneText:by(ap,'ap2217-scene-result').textContent,view:by(ap,'ap2217-track').dataset.view,viewLabel:by(ap,'ap2217-view').textContent}})()`, sessionId);
    assert.equal(restored.topic, 'remount-state-sentinel', 'video form state survives disposal and remount'); assert.equal(restored.platform, 'true', 'selected platform survives remount'); assert.equal(restored.duration, '420', 'YouTube 420-second duration survives route remount'); assert.equal(restored.max, '600', 'YouTube duration range remains configured after remount'); assert.equal(restored.ready, 'true'); assert.equal(restored.rootCount, expected[navArticle].kinds.length);
    assert.deepEqual({citationCurrent:restored.citationCurrent,citationRef:restored.citationRef,citationState:restored.citationState,citationCase:restored.citationCase.includes('DIGEST_MISMATCH'),tenant:restored.tenant,position:restored.position,topk:restored.topk,step:restored.step,report:restored.report,scene:restored.scene,sceneText:restored.sceneText.includes('DENY_CHANGED'),view:restored.view,viewLabel:restored.viewLabel},{citationCurrent:beforeRemount.citationCurrent,citationRef:beforeRemount.citationRef,citationState:beforeRemount.citationState,citationCase:true,tenant:beforeRemount.tenant,position:beforeRemount.position,topk:beforeRemount.topk,step:beforeRemount.step,report:beforeRemount.report,scene:beforeRemount.scene,sceneText:true,view:beforeRemount.view,viewLabel:beforeRemount.viewLabel},'citation, ACL, and approval domain state survives history remount');
    await cdp.evaluate(`document.querySelector('[data-article-id="hm:article:2494"] [data-lab-kind="approval"] [data-source-anchor="ap2217-consume"]').click()`,sessionId);assert.ok(await cdp.evaluate(`document.querySelector('[data-article-id="hm:article:2494"] [data-source-anchor="ap2217-status"]').textContent.includes('ALLOW_MOCK_ONLY')`,sessionId),'restored approval receipt can be consumed');
    await cdp.evaluate(`document.querySelector('[data-article-id="hm:article:2494"] [data-lab-kind="approval"] [data-source-anchor="ap2217-consume"]').click()`,sessionId);assert.ok(await cdp.evaluate(`document.querySelector('[data-article-id="hm:article:2494"] [data-source-anchor="ap2217-status"]').textContent.includes('DENY_USED')`,sessionId),'restored receipt rejects replay');
    await cdp.evaluate('history.forward()',sessionId);await waitFor(cdp,`new URL(location.href).searchParams.get('topic')`,sessionId,value=>value==='hm:topic:ai-news-industry');await cdp.evaluate('history.back()',sessionId);await waitFor(cdp,`new URL(location.href).searchParams.get('topic')`,sessionId,value=>value===topic);
    assert.ok(await cdp.evaluate(`document.querySelector('[data-article-id="hm:article:2494"] [data-source-anchor="ap2217-status"]').textContent.includes('DENY_USED')`,sessionId),'approval replay denial survives a second Back/Forward remount');
    await cdp.evaluate(`document.querySelectorAll('.hm-reviewed-lab[data-lab-ready="true"] [data-lab-reset]').forEach(x=>x.click())`,sessionId);
    assert.equal(await cdp.evaluate(`document.querySelectorAll('.hm-reviewed-lab[data-lab-ready="true"] [data-lab-reset]').length`,sessionId),6,'all six labs reset after repeated remounts');
    assert.notEqual(await cdp.evaluate(`document.querySelector('[data-article-id="${navArticle}"] [data-lab-kind="video"] [data-source-anchor="hm-topic"]').value`, sessionId), 'remount-state-sentinel', 'lab reset clears changed video state');
    await cdp.evaluate(`document.querySelector('[data-article-id="hm:article:2494"] [data-lab-kind="approval"] [data-source-anchor="ap2217-consume"]').click()`,sessionId);assert.ok(await cdp.evaluate(`document.querySelector('[data-article-id="hm:article:2494"] [data-source-anchor="ap2217-status"]').textContent.includes('DENY_UNKNOWN')`,sessionId),'reset clears approval receipt');
    assert.equal(await cdp.evaluate(`(()=>{const all=[...document.querySelectorAll('[id]')].map(x=>x.id);return all.length===new Set(all).size})()`, sessionId), true);

    // Network requests must remain loopback-local; imported source controls are
    // inert and cannot smuggle executable markup or inline event attributes.
    const safety = await cdp.evaluate(`(()=>({remote:[...performance.getEntriesByType('resource')].map(x=>x.name).filter(x=>/^https?:/.test(x)&&new URL(x).origin!==location.origin),active:[...document.querySelectorAll('.hm-reviewed-lab script,.hm-reviewed-lab iframe,.hm-reviewed-lab svg,.hm-reviewed-lab [onclick],.hm-reviewed-lab [onerror],.hm-reviewed-lab [onload]')].length,foreignIds:[...document.querySelectorAll('.hm-reviewed-lab [id]')].filter(x=>!x.hasAttribute('data-lab-reset')).map(x=>x.id),sources:[...document.querySelectorAll('.hm-reviewed-lab [data-source-anchor]')].length}))()`, sessionId);
    assert.deepEqual(safety.remote, [], 'interactive assets make no external requests'); assert.equal(safety.active, 0, 'copied source markup contains no active nodes or handlers');

    // Screenshots for every interactive root at desktop and mobile sizes.
    const screenshotDir = join(root, 'artifacts', liveUrl ? 'live-interactive' : 'interactive'); mkdirSync(screenshotDir, { recursive: true });
    const shots = [], canvases = [];
    for (const [label, width, height, mobile] of [['desktop', 1440, 1000, false], ['mobile', 390, 844, true]]) {
      await cdp.request('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile }, sessionId);
      for (const articleId of articleIds) {
        const rootMeta = await cdp.evaluate(`(()=>[...document.querySelector('[data-article-id="${articleId}"]').querySelectorAll('.hm-reviewed-lab[data-lab-ready="true"]')].map((r,i)=>({i,kind:r.dataset.labKind})))()`, sessionId);
        for (const { i, kind } of rootMeta) {
          await cdp.evaluate(`document.querySelector('[data-article-id="${articleId}"]').querySelectorAll('.hm-reviewed-lab[data-lab-ready="true"]')[${i}].scrollIntoView({block:'start',behavior:'instant'})`, sessionId); await delay(150);
          if (label === 'mobile') {
            const scroll = await cdp.evaluate(`(()=>{const r=document.querySelector('[data-article-id="${articleId}"]').querySelectorAll('.hm-reviewed-lab[data-lab-ready="true"]')[${i}],reset=r.querySelector('[data-lab-reset]');const before=scrollY;reset.click();const afterReset=scrollY;const field=[...r.querySelectorAll('input,select,textarea')].find(x=>x.closest('.hm-reviewed-lab')===r);if(field){field.focus({preventScroll:true});if(field.tagName==='SELECT'&&field.options.length>1)field.selectedIndex=1;else if(field.type==='range')field.value=field.max;else if(field.type==='checkbox')field.checked=!field.checked;else if(!field.readOnly)field.value='scroll-check';field.dispatchEvent(new Event(field.tagName==='SELECT'?'change':'input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));field.blur();}return {resetJump:Math.abs(afterReset-before),inputJump:Math.abs(scrollY-afterReset)}})()`, sessionId);
            assert.ok(scroll.resetJump <= 20, `${articleId}/${kind} reset does not jump the mobile viewport`); assert.ok(scroll.inputJump <= 20, `${articleId}/${kind} input edits do not jump the mobile viewport`);
          }
          const layout = await cdp.evaluate(`(()=>{const a=document.querySelector('[data-article-id="${articleId}"]').closest('.source-card'),r=document.querySelector('[data-article-id="${articleId}"]').querySelectorAll('.hm-reviewed-lab[data-lab-ready="true"]')[${i}];return {overflow:document.documentElement.scrollWidth>innerWidth+1,visible:!!r&&r.getBoundingClientRect().height>0&&r.getBoundingClientRect().top<innerHeight,scrollY:scrollY}})()`, sessionId);
          assert.equal(layout.overflow, false, `${label} ${articleId} has no horizontal viewport overflow`); assert.equal(layout.visible, true, `${label} ${articleId}/${kind} root is visible`);
          const result = await cdp.request('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, sessionId);
          const path = join(screenshotDir, `${articleId.replaceAll(':', '-')}-${kind}-${label}.png`); writeFileSync(path, Buffer.from(result.result.data, 'base64')); shots.push(path);
        }
        // Focused panel captures ensure the video scene, generated-prompt panel,
        // and cost calculator are visible at both responsive sizes.
        const videoRoot = await cdp.evaluate(`document.querySelector('[data-article-id="${articleId}"] [data-lab-kind="video"]') ? true : false`, sessionId);
        if (videoRoot) for (const [panel, anchor] of [['scene','hm-explore'],['prompt','hm-prompt-text'],['cost','hm-metrics']]) {
          await cdp.evaluate(`document.querySelector('[data-article-id="${articleId}"] [data-source-anchor="${anchor}"]').scrollIntoView({block:'start',behavior:'instant'})`, sessionId); await delay(200);
          const state = await cdp.evaluate(`(()=>{const x=document.querySelector('[data-article-id="${articleId}"] [data-source-anchor="${anchor}"]'),canvas=document.querySelector('[data-article-id="${articleId}"] [data-source-anchor="hm-3d-canvas"]');let pixels=null;if(canvas&&'${panel}'==='scene'){const ctx=canvas.getContext('2d'),im=ctx.getImageData(0,0,canvas.width,canvas.height).data,colors=new Set();let opaque=0;for(let i=0;i<im.length;i+=4*6){if(im[i+3]>0)opaque++;colors.add(im[i]+','+im[i+1]+','+im[i+2]+','+im[i+3]);}pixels={opaque,colors:colors.size};}return {overflow:document.documentElement.scrollWidth>innerWidth+1,visible:x.getBoundingClientRect().top<innerHeight&&x.getBoundingClientRect().bottom>0,pixels}})()`, sessionId);
          assert.equal(state.overflow, false, `${label} ${articleId}/${panel} panel has no viewport overflow`); assert.equal(state.visible, true, `${label} ${articleId}/${panel} panel is in view`);
          if(panel==='scene') { assert.ok(state.pixels.opaque>100&&state.pixels.colors>5,`${articleId} scene canvas has varied visible pixels`); canvases.push({articleId,viewport:label,...state.pixels}); }
          const result=await cdp.request('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false},sessionId);
          const path=join(screenshotDir,`${articleId.replaceAll(':','-')}-video-${panel}-${label}.png`);writeFileSync(path,Buffer.from(result.result.data,'base64'));shots.push(path);
        }
      }
      await cdp.request('Emulation.clearDeviceMetricsOverride', {}, sessionId);
    }
    await cdp.request('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
    await cdp.request('Page.reload', { ignoreCache: true }, sessionId);
    await waitFor(cdp, `document.querySelectorAll('.hm-reviewed-lab[data-lab-ready="true"]').length`, sessionId, n => n === 6);
    const reducedMotion = await cdp.evaluate(`(()=>{const videos=[...document.querySelectorAll('.hm-reviewed-lab[data-lab-kind="video"]')],states=[];for(const root of videos){const by=id=>root.querySelector('[data-source-anchor="'+id+'"]'),button=by('hm-pause-scene');const startup=button.getAttribute('aria-pressed');button.click();const playing=button.getAttribute('aria-pressed');button.click();const paused=button.getAttribute('aria-pressed');root.querySelector('[data-lab-reset]').click();const reset=button.getAttribute('aria-pressed');states.push({startup,playing,paused,reset});}return states})()`, sessionId);
    assert.deepEqual(reducedMotion, Array.from({length:3},()=>({startup:'true',playing:'false',paused:'true',reset:'true'})), 'reduced-motion starts paused while explicit play, pause, and reset still work');
    t.diagnostic(`Interactive screenshots: ${shots.join(', ')}`);
    const evidencePath = join(root, 'artifacts', liveUrl ? 'live-interactive-browser-evidence.json' : 'interactive-browser-evidence.json');
    writeFileSync(evidencePath, JSON.stringify({ testedUrl: url, expectedReleaseSha: process.env.HM_EXPECTED_RELEASE_SHA || null, verifiedAt: new Date().toISOString(), results: Object.fromEntries(Object.entries(results).map(([id, x]) => [id, { controls: x.total, kinds: x.roots.map(r => r.kind) }])), exercised, semantic, aclCartesian, videoIsolation, interactionCoverage, safety, canvases, reducedMotion, screenshots: shots }, null, 2));
  } finally {
    if (browser?.pid && !browser.killed) {
      try { await cdp?.request('Browser.close'); cdp?.socket.close(); } catch {}
      await Promise.race([new Promise(resolveExit => browser.once('exit', resolveExit)), delay(2000)]);
      if (browser.exitCode === null) browser.kill();
    }
    if (server?.pid && server.exitCode === null) server.kill();
  }
});
