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
  async evaluate(expression, sessionId) { const r = await this.request('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true }, sessionId); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.text || `Evaluation failed: ${expression}`); return r.result.result.value; }
}
async function waitFor(cdp, expression, sessionId, predicate = Boolean, timeoutMs = 15000) { const end = Date.now() + timeoutMs; while (Date.now() < end) { const value = await cdp.evaluate(expression, sessionId); if (predicate(value)) return value; await delay(100); } throw new Error(`Browser condition timed out: ${expression}`); }
async function reloadPageAndWait(cdp, sessionId) {
  const previous = await cdp.evaluate('performance.timeOrigin', sessionId);
  await cdp.request('Page.reload', {}, sessionId);
  await waitFor(cdp, `performance.timeOrigin !== ${previous} && document.readyState !== 'loading'`, sessionId);
}
function serverAddress(server) { return new Promise((resolveAddress, reject) => { let output = ''; const timer = setTimeout(() => reject(new Error('Static server did not report a port')), 10000); server.stdout.setEncoding('utf8'); server.stdout.on('data', chunk => { output += chunk; const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)\//); if (match) { clearTimeout(timer); resolveAddress(`http://127.0.0.1:${match[1]}`); } }); server.once('error', reject); }); }

test('bounded book-to-article reading journey, browser history, completion, and responsive layout', { skip: !edgePath && 'Microsoft Edge unavailable; set HM_EDGE_PATH to run the reading journey acceptance suite.' }, async t => {
  const liveUrl = process.env.HM_LIVE_URL || '';
  const server = liveUrl ? null : spawn(process.execPath, ['scripts/serve-pilot.mjs'], { cwd: root, env: { ...process.env, HM_PILOT_PORT: '0' }, stdio: ['ignore', 'pipe', 'inherit'] });
  let browser, cdp, sessionId;
  try {
    const base = liveUrl ? new URL(liveUrl).origin : await serverAddress(server);
    const profile = join(tmpdir(), `hm-reading-journey-${process.pid}-${Date.now()}`);
    browser = spawn(edgePath, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
    let launchError = ''; browser.stderr.on('data', chunk => { launchError += chunk.toString(); });
    const [port,path] = await browserEndpoint(join(profile,'DevToolsActivePort'), browser);
    const socket = new WebSocket(`ws://127.0.0.1:${port}${path}`);
    await new Promise((ok, fail) => { socket.addEventListener('open', ok, { once: true }); socket.addEventListener('error', fail, { once: true }); });
    cdp = new PipeClient(socket); const { result: target } = await cdp.request('Target.createTarget', { url: 'about:blank' }); const { result: attached } = await cdp.request('Target.attachToTarget', { targetId: target.targetId, flatten: true }); sessionId = attached.sessionId;
    await cdp.request('Page.enable', {}, sessionId); await cdp.request('Runtime.enable', {}, sessionId);
    if (liveUrl) { const sha = process.env.HM_EXPECTED_RELEASE_SHA; assert.ok(sha, 'HM_EXPECTED_RELEASE_SHA is required for live verification'); const release = await fetch(new URL('../release.json', liveUrl)).then(r => { assert.ok(r.ok, `live release.json returned ${r.status}`); return r.json(); }); assert.equal(release.source_commit, sha); }
    const bookUrl = liveUrl ? (()=>{const u=new URL(liveUrl);u.search='';u.searchParams.set('view','book');return u.href;})() : new URL(`${process.env.HM_PILOT_BASE_PATH || ''}/knowledge-textbook/`, base).href;
    const explicitBookUrl = new URL(bookUrl); explicitBookUrl.searchParams.set('view','book');
    await cdp.request('Page.navigate', { url: bookUrl }, sessionId);
    await waitFor(cdp, `document.querySelectorAll('#book-toc .book-topic-card').length`, sessionId, n => n === 12);
    const cards = await cdp.evaluate(`(()=>[...document.querySelectorAll('#book-toc .book-topic-card')].map(c=>({topicId:c.dataset.topicId,available:!!c.querySelector('.book-articles'),href:c.querySelector('.book-open')?.href||''})))()`, sessionId);
    assert.equal(cards.length, 12, 'book index has eight parent topics, the pilot, and three new evidence topics');
    assert.ok(cards.every(c => c.href), 'each book card has a stable topic route');
    assert.ok(cards.some(c => c.available), 'book cards with articles expose an available article list/count');
    assert.ok(cards.some(c => !c.available), 'book cards distinguish proposed or empty topics');
    const screenshotDir = join(root, 'artifacts', liveUrl ? 'live-reading-journey' : 'reading-journey'); mkdirSync(screenshotDir, { recursive: true }); const shots = [];
    async function capture(name) { const r = await cdp.request('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, sessionId); const path = join(screenshotDir, `${name}.png`); writeFileSync(path, Buffer.from(r.result.data, 'base64')); shots.push(path); }
    for (const [label, width, height, mobile] of [['desktop',1440,1000,false],['mobile',390,844,true]]) { await cdp.request('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile},sessionId); assert.equal(await cdp.evaluate('document.documentElement.scrollWidth > innerWidth + 1',sessionId),false,`${label} book index has no horizontal overflow`); await capture(`book-${label}`); }
    await cdp.request('Emulation.clearDeviceMetricsOverride',{},sessionId);
    const filterExists = await cdp.evaluate(`!!document.querySelector('#filter-topic')`,sessionId); assert.ok(filterExists, 'book filter control is present');
    const filterTag = await cdp.evaluate(`document.querySelector('#filter-topic').tagName`,sessionId);
    const journeyTopic = cards.find(c=>c.topicId==='hm:topic:verify-ai-work') || cards.find(c=>c.available); assert.ok(journeyTopic?.topicId,'book has an available pilot topic');
    await cdp.request('Page.navigate',{url:journeyTopic.href},sessionId); await cdp.request('Page.navigate',{url:explicitBookUrl.href},sessionId); await waitFor(cdp,`document.querySelectorAll('#book-toc .book-topic-card').length`,sessionId,n=>n===12); assert.equal(await cdp.evaluate(`new URL(location.href).searchParams.get('view')`,sessionId),'book','a later book navigation wins an interrupted topic load');
    let selectedTopicId = '', filterHistoryEntries = 0;
    for (const candidate of cards.filter(c=>c.available)) {
      if (filterTag === 'SELECT') { await cdp.evaluate(`(()=>{const e=document.querySelector('#filter-topic');e.value=${JSON.stringify(candidate.topicId)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`,sessionId); filterHistoryEntries++; }
      const count = await cdp.evaluate(`document.querySelectorAll('.result-card[href*="article="]').length`,sessionId);
      if (count > 0) { selectedTopicId = candidate.topicId; break; }
    }
    const filtered = await cdp.evaluate(`(()=>({cards:[...document.querySelectorAll('#book-toc .book-topic-card')].filter(x=>!x.hidden&&!x.matches('[aria-hidden="true"]')).length,results:document.querySelectorAll('.result-card[href*="article="]').length,href:document.querySelector('.result-card[href*="article="]')?.href||''}))()`,sessionId);
    assert.ok(filtered.results > 0 && filtered.href, `empty-keyword topic filtering shows matching results (${JSON.stringify(filtered)}; topic=${selectedTopicId})`);
    assert.ok(await cdp.evaluate(`new URL(location.href).searchParams.get('filterTopic')`,sessionId),'topic filter is represented in browser history');
    await cdp.evaluate(`history.go(-${filterHistoryEntries})`,sessionId); await waitFor(cdp,`new URL(location.href).searchParams.get('filterTopic')||''`,sessionId,v=>v==='');
    await cdp.evaluate(`history.go(${filterHistoryEntries})`,sessionId); await waitFor(cdp,`new URL(location.href).searchParams.get('filterTopic')`,sessionId,v=>v===selectedTopicId);
    for (const [label,width,height,mobile] of [['desktop',1440,1000,false],['mobile',390,844,true]]) { await cdp.request('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile},sessionId); assert.equal(await cdp.evaluate('document.documentElement.scrollWidth > innerWidth + 1',sessionId),false,`${label} filtered book has no overflow`); await capture(`book-filtered-${label}`); }
    await cdp.request('Emulation.clearDeviceMetricsOverride',{},sessionId);
    const resultUrl = new URL(filtered.href); const articleId = resultUrl.searchParams.get('article'); assert.ok(/^hm:article:.+/.test(articleId), 'result article links carry a stable article ID');
    await cdp.evaluate(`document.querySelector('.result-card[href*="article="]').click()`,sessionId);
    await waitFor(cdp, `location.search.includes('article=') && document.querySelector('.source-card[id^="article-"]')`, sessionId);
    assert.equal(await cdp.evaluate(`!!document.querySelector('.source-card[id="article-${articleId}"]')`,sessionId),true,'article deep link targets the matching source card');
    assert.ok(await cdp.evaluate(`document.querySelector('.article-outline .article-start')`,sessionId),'article outline links to article start');
    assert.ok(await cdp.evaluate(`(()=>{const card=document.querySelector('.source-card[id="article-${articleId}"]');return Math.abs(card.getBoundingClientRect().top)<40&&card.querySelector('h3')===document.activeElement})()`,sessionId),'article bookmark scrolls to and focuses its title');
    assert.equal(await cdp.evaluate(`!!document.querySelector('.topic-finish .complete-topic')`,sessionId),false,'article navigation does not require completion opt-in');
    await reloadPageAndWait(cdp, sessionId); await waitFor(cdp,`!!document.querySelector('.source-card[id="article-${articleId}"]')`,sessionId);
    const missingUrl = new URL(await cdp.evaluate('location.href',sessionId)); missingUrl.searchParams.set('article','hm:article:missing-journey'); await cdp.request('Page.navigate',{url:missingUrl.href},sessionId); await waitFor(cdp,`document.querySelector('#topic-finish')`,sessionId); assert.equal(await cdp.evaluate(`!!document.querySelector('.source-card[id="article-hm:article:missing-journey"]')`,sessionId),false,'missing article bookmark falls back without a false article target'); assert.ok(await cdp.evaluate(`!!document.querySelector('#reader-content .fallback-note')`,sessionId),'missing article bookmark explains the fallback');
    const topicUrl = journeyTopic?.href; assert.ok(topicUrl,'an available topic can be opened from book'); await cdp.request('Page.navigate',{url:topicUrl},sessionId); await waitFor(cdp,`document.querySelectorAll('.source-card').length`,sessionId,n=>n>0);
    const pilotArticles = await cdp.evaluate(`(()=>[...document.querySelectorAll('.source-card')].map(x=>x.id.replace(/^article-/,'')))()`,sessionId);
    if (journeyTopic.topicId==='hm:topic:verify-ai-work') assert.equal(await cdp.evaluate(`document.querySelectorAll('.hm-reviewed-lab[data-lab-ready="true"]').length`,sessionId),6,'pilot topic retains all six existing interactive labs');
    const firstArticleHref = await cdp.evaluate(`document.querySelector('.article-outline .article-start')?.href||''`,sessionId); assert.ok(firstArticleHref,'topic outline has an article start link'); await cdp.evaluate(`document.querySelector('.article-outline .article-start').click()`,sessionId); await waitFor(cdp,`new URL(location.href).searchParams.get('article')`,sessionId,id=>id===pilotArticles[0]);
    const landing = await waitFor(cdp,`(()=>{const c=document.querySelector('.source-card[id="article-${pilotArticles[0]}"]');return {top:c?.getBoundingClientRect().top,focused:c?.querySelector('h3')===document.activeElement}})()`,sessionId,value=>Math.abs(value.top)<40&&value.focused); assert.ok(Math.abs(landing.top)<40&&landing.focused,'article start scrolls to and focuses its title');
    for (const [label,width,height,mobile] of [['desktop',1440,1000,false],['mobile',390,844,true]]) { await cdp.request('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile},sessionId); await cdp.evaluate(`document.querySelector('.source-card[id="article-${pilotArticles[0]}"]').scrollIntoView({block:'start',behavior:'instant'})`,sessionId); assert.equal(await cdp.evaluate('document.documentElement.scrollWidth > innerWidth + 1',sessionId),false,`${label} article start has no horizontal overflow`); await capture(`article-start-${label}`); }
    await cdp.request('Emulation.clearDeviceMetricsOverride',{},sessionId);
    const nextHref = await cdp.evaluate(`document.querySelector('.source-card[id="article-${pilotArticles[0]}"] .article-pager a:last-child')?.href||''`,sessionId); assert.ok(nextHref,'first pilot article pager links to its next source article'); await cdp.evaluate(`document.querySelector('.source-card[id="article-${pilotArticles[0]}"] .article-pager a:last-child').click()`,sessionId); await waitFor(cdp,`new URL(location.href).searchParams.get('article')`,sessionId,id=>id===pilotArticles[1]);
    for (let i=0;i<2;i++) { await cdp.evaluate('history.back()',sessionId); await waitFor(cdp,`new URL(location.href).searchParams.get('article')`,sessionId,id=>id===pilotArticles[0]); await cdp.evaluate('history.forward()',sessionId); await waitFor(cdp,`new URL(location.href).searchParams.get('article')`,sessionId,id=>id===pilotArticles[1]); }
    await reloadPageAndWait(cdp, sessionId); await waitFor(cdp,`new URL(location.href).searchParams.get('article')`,sessionId,id=>id===pilotArticles[1]); await waitFor(cdp,`document.querySelectorAll('.source-card').length`,sessionId,n=>n===pilotArticles.length); await waitFor(cdp,`!!document.querySelector('.source-card[id="article-${pilotArticles[1]}"]')`,sessionId);
    for (let i=2;i<pilotArticles.length;i++) { const previousId=pilotArticles[i-1]; const pagerInfo=await cdp.evaluate(`(()=>{const card=document.querySelector('.source-card[id="article-${previousId}"]');return {href:card?.querySelector('.article-pager a:last-child')?.href||'',pager:card?.querySelector('.article-pager')?.outerHTML||'',ids:[...document.querySelectorAll('.source-card')].map(x=>x.id)}})()`,sessionId); assert.ok(pagerInfo.href,`pilot article ${i-1} has a next article (${JSON.stringify(pagerInfo)})`); await cdp.evaluate(`document.querySelector('.source-card[id="article-${previousId}"] .article-pager a:last-child').click()`,sessionId); await waitFor(cdp,`new URL(location.href).searchParams.get('article')`,sessionId,id=>id===pilotArticles[i]); }
    assert.equal(await cdp.evaluate(`!!document.querySelector('.complete-topic')`,sessionId),false,'topic navigation works without opting into completion tracking');
    await cdp.evaluate(`(()=>{const x=document.querySelector('#progress-opt-in');x.checked=true;x.dispatchEvent(new Event('change',{bubbles:true}));})()`,sessionId); await waitFor(cdp,`document.querySelector('#topic-finish .complete-topic')`,sessionId);
    const endState = await cdp.evaluate(`(()=>{const f=document.querySelector('#topic-finish'),back=f?.querySelector('a[data-reader-route]'),complete=f?.querySelector('.complete-topic');return {finish:!!f,back:back?.getAttribute('href')||'',complete:!!complete,topComplete:!!document.querySelector(':not(#topic-finish) > [data-completion-controls] .complete-topic'),text:f?.innerText||''}})()`,sessionId);
    assert.ok(endState.finish && endState.back && endState.complete && endState.topComplete,'topic end provides completion while keeping the top control available'); assert.ok(/view=book/.test(endState.back));
    const labBeforeCompletion = await cdp.evaluate(`(()=>{window.__journeyLab=document.querySelector('.hm-reviewed-lab[data-lab-ready="true"]');document.querySelector('#topic-finish').scrollIntoView({block:'end',behavior:'instant'});return scrollY})()`,sessionId); await cdp.evaluate(`document.querySelector('#topic-finish .complete-topic')?.click()`,sessionId); await delay(100); const completion = await cdp.evaluate(`(()=>{const p=JSON.parse(localStorage.getItem('hm-reading:${journeyTopic.topicId}')||'{}');return {scroll:scrollY,text:document.querySelector('#topic-finish').innerText,events:p.completionEvents||[],sameLab:window.__journeyLab===document.querySelector('.hm-reviewed-lab[data-lab-ready="true"]')}})()`,sessionId); assert.ok(Math.abs(completion.scroll-labBeforeCompletion)<=20,'completion updates in place without a scroll jump'); assert.equal(completion.events.at(-1)?.status,'completed','completion is stored after explicit opt-in'); assert.equal(completion.sameLab,true,'completion does not remount interactive labs');
    await cdp.evaluate(`document.querySelector('#topic-finish .complete-topic')?.click()`,sessionId); const incomplete = await cdp.evaluate(`JSON.parse(localStorage.getItem('hm-reading:${journeyTopic.topicId}')||'{}').completionEvents?.at(-1)?.status`,sessionId); assert.equal(incomplete,'incomplete','completion can be reset to incomplete');
    for (const [label,width,height,mobile] of [['desktop',1440,1000,false],['mobile',390,844,true]]) { await cdp.request('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile},sessionId); await delay(250); await cdp.evaluate(`document.querySelector('#topic-finish').scrollIntoView({block:'end',behavior:'instant'})`,sessionId); await waitFor(cdp,`(()=>{const r=document.querySelector('#topic-finish').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1})()`,sessionId); assert.equal(await cdp.evaluate('document.documentElement.scrollWidth > innerWidth + 1',sessionId),false,`${label} topic end has no horizontal overflow`); await capture(`article-end-${label}`); }
    await cdp.evaluate(`document.querySelector('.reset-progress').click()`,sessionId); assert.equal(await cdp.evaluate(`(()=>{const s={consent:localStorage.getItem('hm-reading:consent'),progress:Object.keys(localStorage).some(k=>k.startsWith('hm-reading:')&&k!=='hm-reading:consent'),controls:document.querySelectorAll('.complete-topic').length};return s.consent===null&&!s.progress&&s.controls===0})()`,sessionId),true,'reset removes progress, consent, and both completion controls');
    await cdp.evaluate(`document.querySelector('#topic-finish a[data-reader-route]').click()`,sessionId); await waitFor(cdp,`new URL(location.href).searchParams.get('view')`,sessionId,v=>v==='book');
    const evidencePath=join(screenshotDir,'verification.json'); writeFileSync(evidencePath,JSON.stringify({testedUrl:bookUrl,expectedReleaseSha:process.env.HM_EXPECTED_RELEASE_SHA||null,verifiedAt:new Date().toISOString(),assertedCoverage:['bare and explicit book routes','12 topic cards with available/proposed distinction','empty-keyword topic filter and filter Back/Forward','result article deep link and missing bookmark fallback','pilot article start landing, repeated Back/Forward, bookmark reload, and all source articles','six existing pilot interactive labs','completion opt-in, stored complete/incomplete status, no scroll jump/remount, and progress reset','390x844 and 1440x1000 overflow checks'],screenshots:shots},null,2));
    t.diagnostic(`Reading journey screenshots: ${shots.join(', ')}; evidence: ${evidencePath}`);
  } finally {
    if (browser?.pid && !browser.killed) { try { await cdp?.request('Browser.close'); cdp?.socket.close(); } catch {} await Promise.race([new Promise(resolveExit=>browser.once('exit',resolveExit)),delay(2000)]); if (browser.exitCode===null) browser.kill(); }
    if (server?.pid && server.exitCode===null) server.kill();
  }
});
