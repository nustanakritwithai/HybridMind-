import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { projectPublicCatalog } from '../scripts/public-projection.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const edgeCandidates = [process.env.HM_EDGE_PATH, process.platform === 'win32' ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' : null].filter(Boolean);
const edgePath = edgeCandidates.find(existsSync);
const offlinePath = join(root, 'offline', 'pilot-catalog-full.json');
const catalogPath = existsSync(offlinePath) ? offlinePath : join(root, 'data', 'pilot-catalog.json');
const catalog = projectPublicCatalog(JSON.parse(readFileSync(catalogPath, 'utf8')));

class PipeClient {
  constructor(child) {
    this.child = child;
    this.nextId = 1;
    this.pending = new Map();
    this.buffer = '';
    child.stdio[4].setEncoding('utf8');
    child.stdio[4].on('data', chunk => {
      this.buffer += chunk;
      let boundary;
      while ((boundary = this.buffer.indexOf('\0')) >= 0) {
        const raw = this.buffer.slice(0, boundary); this.buffer = this.buffer.slice(boundary + 1);
        if (!raw) continue;
        let message;
        try { message = JSON.parse(raw); } catch { continue; }
        if (message.id && this.pending.has(message.id)) {
          const { resolve, reject, timer, method, params } = this.pending.get(message.id); clearTimeout(timer); this.pending.delete(message.id);
          if (message.error) reject(new Error(`CDP ${method} (${JSON.stringify(params ?? {})}): ${JSON.stringify(message.error)}`)); else resolve(message);
        }
      }
    });
  }
  request(method, params = {}, sessionId) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 10000);
      this.pending.set(id, { resolve, reject, timer, method, params });
      this.child.stdio[3].write(`${JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })}\0`);
    });
  }
  async evaluate(expression, sessionId) {
    const response = await this.request('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true }, sessionId);
    if (response.result.exceptionDetails) throw new Error(response.result.exceptionDetails.text || `Browser evaluation failed: ${expression}`);
    return response.result.result.value;
  }
}

async function waitFor(client, expression, sessionId, predicate = Boolean, timeoutMs = 10000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const value = await client.evaluate(expression, sessionId);
    if (predicate(value)) return value;
    await delay(100);
  }
  throw new Error(`Browser condition timed out: ${expression}`);
}

function serverAddress(server) {
  return new Promise((resolveAddress, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Static server did not report a port')), 10000);
    server.stdout.setEncoding('utf8');
    server.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)\//);
      if (match) { clearTimeout(timer); resolveAddress(`http://127.0.0.1:${match[1]}`); }
    });
    server.once('error', reject);
  });
}

test('responsive reader navigation, search, progress, missing anchors, and safe text', { skip: !edgePath && 'Microsoft Edge is not available; set HM_EDGE_PATH to run the local browser acceptance test.' }, async t => {
  const server = spawn(process.execPath, ['scripts/serve-pilot.mjs'], { cwd: root, env: { ...process.env, HM_PILOT_PORT: '0' }, stdio: ['ignore', 'pipe', 'inherit'] });
  let browser;
  let sessionId;
  try {
    const base = await serverAddress(server);
    const profile = join(tmpdir(), `hm-reader-e2e-${process.pid}-${Date.now()}`);
    browser = spawn(edgePath, ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--remote-debugging-pipe', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
    browser.once('error', error => { throw error; });
    const cdp = new PipeClient(browser);
    await delay(400);
    const { result: createdTarget } = await cdp.request('Target.createTarget', { url: 'about:blank' });
    const { result: attachedTarget } = await cdp.request('Target.attachToTarget', { targetId: createdTarget.targetId, flatten: true });
    sessionId = attachedTarget.sessionId;
    await cdp.request('Page.enable', {}, sessionId);
    await cdp.request('Runtime.enable', {}, sessionId);
    const orderedPathId='hm:path:e2e-ordered', conflictingPathId='hm:path:e2e-conflicting';
    const orderedTopicIds=['hm:topic:verify-ai-work','hm:topic:ai-news-industry','hm:topic:ai-agents-automation'];
    const conflictingTopicIds=['hm:topic:verify-ai-work','hm:topic:ai-agents-automation','hm:topic:ai-news-industry'];
    const orderedTopics=orderedTopicIds.map(id=>catalog.topics.find(topic=>topic.topic_id===id)); assert.ok(orderedTopics.every(Boolean));
    const progressArticleId=catalog.relationships.find(relation=>relation.from_id===orderedTopicIds[0]&&catalog.articles.some(article=>article.article_id===relation.to_id))?.to_id; assert.ok(progressArticleId);
    const e2ePaths=[
      {path_id:orderedPathId,title:'Browser test ordered path',ordered_topic_ids:orderedTopicIds},
      {path_id:conflictingPathId,title:'Browser test conflicting path',ordered_topic_ids:conflictingTopicIds},
    ];
    const injectPath=`(()=>{const original=window.fetch.bind(window);window.fetch=(...args)=>original(...args).then(async response=>{if(!String(args[0]).includes('pilot-catalog.json'))return response;const data=await response.json();data.learning_paths.push(...ñPATHSñ);const revision=JSON.parse(localStorage.getItem('hm-test-revision-overrides')||'{}');const topic=data.topics.find(t=>t.topic_id===ñTOPICñ);if(revision.topicRevision!==undefined)topic.topic_revision=revision.topicRevision;const article=data.articles.find(a=>a.article_id===ñARTICLEñ);if(revision.articleRevision!==undefined)article.article_revision=revision.articleRevision;return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}})});})()`
      .replace('ñPATHSñ',JSON.stringify(e2ePaths)).replace('ñTOPICñ',JSON.stringify(orderedTopicIds[0])).replace('ñARTICLEñ',JSON.stringify(progressArticleId));
    await cdp.request('Page.addScriptToEvaluateOnNewDocument',{source:injectPath},sessionId);
    const topicUrl=new URL(`/knowledge-textbook/?topic=${encodeURIComponent(orderedTopicIds[0])}`,base).href;
    await cdp.request('Page.navigate', { url: topicUrl }, sessionId);
    await waitFor(cdp, `document.querySelector('#snapshot-label')?.textContent || ''`, sessionId, value => value.includes('ข้อมูล'));
    await waitFor(cdp, `document.querySelectorAll('#reader-content .source-card').length`, sessionId, value => value === 5);
    assert.match(await cdp.evaluate(`document.querySelector('#search-form').textContent`, sessionId), /ค้นหา/);
    assert.match(await cdp.evaluate(`document.querySelector('#reader-content').textContent`, sessionId), /ข้อจำกัดของต้นแบบ/);
    assert.equal(await cdp.evaluate(`Array.from(document.querySelectorAll('#reader-content .source-link')).every(a=>new URL(a.href).hostname==='hybridmind.online'&&a.target==='_blank'&&a.rel.includes('noopener'))`, sessionId), true);
    assert.equal(await cdp.evaluate(`document.querySelectorAll('#learning-paths .learning-path-card').length`, sessionId), 3);
    assert.match(await cdp.evaluate(`document.querySelector('#learning-paths').textContent`, sessionId), /เส้นทางการเรียนรู้/);
    assert.equal(await cdp.evaluate(`new URL(location.href).searchParams.has('path')===false&&document.querySelector('.topic-pager')===null&&document.querySelector('.active-path-label').textContent.startsWith('Choose a learning path')`,sessionId),true,'a bare topic route must not auto-select a path');
    assert.equal(await cdp.evaluate(`document.querySelectorAll('.topic-path-choice').length`,sessionId),3);
    await cdp.evaluate(`document.querySelector('[data-path-id="${orderedPathId}"]').click()`,sessionId);
    await waitFor(cdp,`new URL(location.href).searchParams.get('path')`,sessionId,value=>value===orderedPathId);
    assert.equal(await cdp.evaluate(`document.querySelector('.active-path-label').textContent`,sessionId),'Active learning path: Browser test ordered path');
    assert.equal(await cdp.evaluate(`document.querySelector('.topic-pager a:last-child')?.textContent`,sessionId),`ถัดไป: ${orderedTopics[1].label_th||orderedTopics[1].label_en||orderedTopics[1].topic_id} →`);
    await cdp.evaluate(`document.querySelector('[data-path-id="${conflictingPathId}"]').click()`,sessionId);
    await waitFor(cdp,`new URL(location.href).searchParams.get('path')`,sessionId,value=>value===conflictingPathId);
    assert.equal(await cdp.evaluate(`document.querySelector('.active-path-label').textContent`,sessionId),'Active learning path: Browser test conflicting path');
    assert.equal(await cdp.evaluate(`document.querySelector('.topic-pager a:last-child')?.getAttribute('href')`,sessionId),`/knowledge-textbook/?topic=${encodeURIComponent(conflictingTopicIds[1])}&path=${encodeURIComponent(conflictingPathId)}`,'conflicting path order must determine the next topic');
    await cdp.evaluate(`document.querySelector('[data-path-id="${orderedPathId}"]').click()`,sessionId);
    await waitFor(cdp,`new URL(location.href).searchParams.get('path')`,sessionId,value=>value===orderedPathId);
    await cdp.evaluate(`document.querySelector('.topic-pager a:last-child').click()`,sessionId);
    await waitFor(cdp,`new URL(location.href).searchParams.get('topic')`,sessionId,value=>value===orderedTopicIds[1]);
    assert.equal(await cdp.evaluate(`document.querySelector('.topic-pager a:first-child')?.textContent`,sessionId),`← ก่อนหน้า: ${orderedTopics[0].label_th||orderedTopics[0].label_en||orderedTopics[0].topic_id}`);
    assert.equal(await cdp.evaluate(`document.querySelector('.topic-pager a:last-child')?.textContent`,sessionId),`ถัดไป: ${orderedTopics[2].label_th||orderedTopics[2].label_en||orderedTopics[2].topic_id} →`);
    // Completion follows explicit topic revisions; last-view freshness follows article revisions.
    await cdp.evaluate("history.pushState({},'',location.pathname+'?topic=hm%3Atopic%3Averify-ai-work&path=hm%3Apath%3Ae2e-ordered');window.dispatchEvent(new PopStateEvent('popstate'))", sessionId);
    await waitFor(cdp, 'new URL(location.href).searchParams.get(\'topic\')', sessionId, value => value === orderedTopicIds[0]);
    const progressKey = 'hm-reading:' + orderedTopicIds[0], progressKeyJson = JSON.stringify('hm-reading:' + orderedTopicIds[0]);
    const progressValue = 'JSON.parse(localStorage.getItem(' + progressKeyJson + '))';
    await cdp.evaluate('document.querySelector(\'#progress-opt-in\').click()', sessionId);
    await waitFor(cdp, 'localStorage.getItem(' + progressKeyJson + ')', sessionId);
    assert.equal(await cdp.evaluate('localStorage.getItem(\'hm-reading:consent\')===\'yes\'&&Array.isArray(' + progressValue + '.completionEvents)&&Object.hasOwn(' + progressValue + ',\'lastViewedSectionId\')', sessionId), true);
    await cdp.evaluate('document.querySelector(\'.complete-topic\').click()', sessionId);
    assert.equal(await cdp.evaluate(progressValue + '.completionEvents.length===1&&' + progressValue + '.completionEvents[0].topicRevision===\'1\'&&document.querySelector(\'.complete-topic\').getAttribute(\'aria-pressed\')===\'true\'', sessionId), true);
    await cdp.evaluate('localStorage.setItem(\'hm-test-revision-overrides\',JSON.stringify({articleRevision:\'browser-article-revision-2\'}));location.reload()', sessionId);
    await waitFor(cdp, 'document.querySelector(\'.complete-topic\')?.getAttribute(\'aria-pressed\')||\'\'', sessionId, value => value === 'true');
    assert.equal(await cdp.evaluate('document.querySelector(\'.updated-note\')!==null&&document.querySelector(\'.completion-note\').textContent.includes(\'topic revision 1\')&&' + progressValue + '.completionEvents.length===1', sessionId), true, 'article revision changes must not invalidate topic-revision completion');
    await cdp.evaluate('localStorage.setItem(\'hm-test-revision-overrides\',JSON.stringify({articleRevision:\'browser-article-revision-2\',topicRevision:2}));location.reload()', sessionId);
    await waitFor(cdp, 'document.querySelector(\'.review-needed\')?.textContent||\'\'', sessionId, value => value.includes('previously completed at topic revision 1'));
    assert.equal(await cdp.evaluate('document.querySelector(\'.complete-topic\').getAttribute(\'aria-pressed\')===\'false\'&&' + progressValue + '.completionEvents.length===1', sessionId), true);
    await cdp.evaluate('(()=>{const p=JSON.parse(localStorage.getItem(' + progressKeyJson + '));p.completionEvents.push({topicRevision:\'1\',status:\'incomplete\',changedAt:new Date().toISOString()});localStorage.setItem(' + progressKeyJson + ',JSON.stringify(p));location.reload()})()', sessionId);
    await waitFor(cdp, 'document.querySelector(\'.complete-topic\')?.getAttribute(\'aria-pressed\')||\'\'', sessionId, value => value === 'false');
    assert.equal(await cdp.evaluate('document.querySelector(\'.review-needed\')===null&&' + progressValue + '.completionEvents.length===2&&' + progressValue + '.completionEvents[0].status===\'completed\'&&' + progressValue + '.completionEvents[1].status===\'incomplete\'', sessionId), true, 'a later incomplete event must clear the older completion for that revision');
    await cdp.evaluate('document.querySelector(\'.complete-topic\').click();document.querySelector(\'.complete-topic\').click();document.querySelector(\'.complete-topic\').click()', sessionId);
    assert.equal(await cdp.evaluate('(()=>{const e=' + progressValue + '.completionEvents;return e.length===5&&e.map(x=>x.status).join(\',\')===\'completed,incomplete,completed,incomplete,completed\'&&e.map(x=>x.topicRevision).join(\',\')===\'1,1,2,2,2\'&&document.querySelector(\'.complete-topic\').getAttribute(\'aria-pressed\')===\'true\'})()', sessionId), true, 'completion toggles must append revision-stamped history events');
    await cdp.evaluate('localStorage.setItem(' + progressKeyJson + ',JSON.stringify({revision:\'old-revision\',sectionId:\'legacy-section\',savedAt:new Date().toISOString()}));location.reload()', sessionId);
    await waitFor(cdp, 'document.querySelector(\'#progress-opt-in\')?.checked', sessionId);
    assert.equal(await cdp.evaluate('document.querySelector(\'.updated-note\')!==null&&' + progressValue + '.lastViewedSectionId===\'legacy-section\'&&Array.isArray(' + progressValue + '.completionEvents)&&' + progressValue + '.completionEvents.length===0&&!Object.hasOwn(' + progressValue + ',\'sectionId\')&&!Object.hasOwn(' + progressValue + ',\'completed\')', sessionId), true);
    await cdp.evaluate('document.querySelector(\'.reset-progress\').click()', sessionId);
    assert.equal(await cdp.evaluate('Object.keys(localStorage).filter(k=>k.startsWith(\'hm-reading:\')).length===0&&!document.querySelector(\'#progress-opt-in\').checked', sessionId), true);
    await cdp.evaluate('localStorage.removeItem(\'hm-test-revision-overrides\');history.pushState({},\'\',location.pathname+\'?topic=hm%3Atopic%3Aai-agents-automation\');window.dispatchEvent(new PopStateEvent(\'popstate\'))', sessionId);
    const afterResetKeyJson = JSON.stringify('hm-reading:hm:topic:ai-agents-automation');
    await delay(100); assert.equal(await cdp.evaluate('localStorage.getItem(' + progressKeyJson + ')===null&&localStorage.getItem(\'hm-reading:consent\')===null', sessionId), true);
    await cdp.evaluate('document.querySelector(\'#progress-opt-in\').click()', sessionId);
    await waitFor(cdp, 'localStorage.getItem(' + afterResetKeyJson + ')', sessionId);

    await cdp.evaluate(`history.back()`,sessionId); await waitFor(cdp,`new URL(location.href).searchParams.get('topic')`,sessionId,value=>value===orderedTopicIds[0]);
    assert.equal(await cdp.evaluate(`document.querySelector('#search-input').labels.length>0 && document.querySelector('#search-results').getAttribute('aria-live')==='polite'`,sessionId),true);
    await cdp.evaluate(`document.querySelector('.reset-progress').click();localStorage.removeItem('hm-test-revision-overrides')`,sessionId);
    const screenshotUrl = new URL(topicUrl); screenshotUrl.searchParams.set('path', orderedPathId);
    await cdp.request('Page.navigate', { url: screenshotUrl.href }, sessionId);
    await waitFor(cdp,`new URL(location.href).searchParams.get('path')`,sessionId,value=>value===orderedPathId);
    await cdp.evaluate(`window.scrollTo(0,0)`,sessionId);

    // Capture the rendered prototype at desktop and phone widths for the handoff.
    const screenshotDir = join(root, 'artifacts', 'screenshots'); mkdirSync(screenshotDir, { recursive: true });
    await cdp.request('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
    const desktop = await cdp.request('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, sessionId);
    writeFileSync(join(screenshotDir, 'desktop.png'), Buffer.from(desktop.result.data, 'base64'));
    await cdp.request('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }, sessionId);
    await cdp.evaluate(`window.scrollTo(0,0)`, sessionId); await delay(100);
    assert.equal(await cdp.evaluate(`getComputedStyle(document.querySelector('#mobile-toc')).display`, sessionId), 'block');
    assert.equal(await cdp.evaluate(`document.querySelector('#filter-disclosure').open`, sessionId), false);
    assert.equal(await cdp.evaluate(`getComputedStyle(document.querySelector('#learning-paths')).display`, sessionId), 'none');
    assert.ok(await cdp.evaluate(`document.querySelector('#reader-content h1').getBoundingClientRect().top < innerHeight/2`, sessionId), 'Mobile reader heading should appear before the middle of the first screen.');
    const widths = await cdp.evaluate(`({viewport:innerWidth,document:document.documentElement.scrollWidth})`, sessionId);
    assert.ok(widths.document <= widths.viewport + 1, `Mobile page overflows horizontally: ${JSON.stringify(widths)}`);
    const mobile = await cdp.request('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }, sessionId);
    writeFileSync(join(screenshotDir, 'mobile.png'), Buffer.from(mobile.result.data, 'base64'));
    await cdp.evaluate(`document.querySelector('#mobile-toc summary').focus()`, sessionId); await cdp.request('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32,nativeVirtualKeyCode:32,text:' ',unmodifiedText:' '},sessionId); await cdp.request('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32},sessionId);
    assert.equal(await cdp.evaluate(`document.querySelector('#mobile-toc').open`, sessionId), true);
    assert.ok(await cdp.evaluate(`document.querySelectorAll('#mobile-topic-toc .article-outline').length`, sessionId) > 0);
    await cdp.request('Emulation.clearDeviceMetricsOverride', {}, sessionId);

    // Search includes verified records, supports a no-result state, and never searches unknown password rows.
    const unknownTitle = 'offline private inventory sentinel';
    await cdp.evaluate(`(()=>{const i=document.querySelector('#search-input');i.value=${JSON.stringify(unknownTitle)};i.dispatchEvent(new Event('input',{bubbles:true}));})()`, sessionId);
    assert.ok(!(await cdp.evaluate(`document.querySelector('#search-results').textContent`, sessionId)).includes(unknownTitle));
    await cdp.evaluate(`(()=>{const i=document.querySelector('#search-input');i.value='citation';i.dispatchEvent(new Event('input',{bubbles:true}));})()`, sessionId);
    assert.ok(await cdp.evaluate(`document.querySelectorAll('#search-results .result-card').length`, sessionId) > 0);
    await cdp.evaluate(`(()=>{for(const [id,value] of [['filter-topic','hm:topic:verify-ai-work'],['filter-type','unknown'],['filter-level','unknown'],['filter-locale','th']]){const e=document.querySelector('#'+id);e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}));}})()`, sessionId);
    assert.ok(await cdp.evaluate(`document.querySelectorAll('#search-results .result-card').length`, sessionId) > 0);
    await cdp.evaluate(`(()=>{const i=document.querySelector('#search-input');i.value='citation';i.dispatchEvent(new Event('input',{bubbles:true}));const f=document.querySelector('#filter-topic');f.value='hm:topic:verify-ai-work';f.dispatchEvent(new Event('change',{bubbles:true}));const sort=document.querySelector('#filter-sort');sort.value='date';sort.dispatchEvent(new Event('change',{bubbles:true}));})()`,sessionId);
    assert.equal(await cdp.evaluate(`(()=>{const p=new URL(location.href).searchParams;return p.get('q')==='citation'&&p.get('filterTopic')==='hm:topic:verify-ai-work'&&p.get('sort')==='date'&&p.get('type')==='unknown'&&p.get('level')==='unknown'&&p.get('locale')==='th'})()`,sessionId),true);
    await cdp.evaluate(`document.querySelector('#topic-toc a[href*="ai-news-industry"]').click()`,sessionId);
    await waitFor(cdp,`new URL(location.href).searchParams.get('topic')`,sessionId,value=>value==='hm:topic:ai-news-industry');
    await cdp.evaluate(`history.back()`,sessionId);
    await waitFor(cdp,`new URL(location.href).searchParams.get('topic')`,sessionId,value=>value==='hm:topic:verify-ai-work');
    assert.equal(await cdp.evaluate(`(()=>{const p=new URL(location.href).searchParams;return document.querySelector('#search-input').value==='citation'&&document.querySelector('#filter-topic').value==='hm:topic:verify-ai-work'&&document.querySelector('#filter-sort').value==='date'&&document.querySelector('#filter-type').value==='unknown'&&document.querySelector('#filter-level').value==='unknown'&&document.querySelector('#filter-locale').value==='th'&&p.get('q')==='citation'})()`,sessionId),true);
    await cdp.evaluate(`(()=>{const i=document.querySelector('#search-input');i.value='zqvzxqx';i.dispatchEvent(new Event('input',{bubbles:true}));})()`, sessionId);
    assert.match(await cdp.evaluate(`document.querySelector('#search-results').textContent`, sessionId), /ไม่พบผลลัพธ์/);

    // Repeated navigation and browser Back/Forward restore the route and reader title.
    await cdp.evaluate(`(()=>{document.querySelector('#topic-toc a[href*="ai-news-industry"]').click();document.querySelector('#topic-toc a[href*="ai-agents-automation"]').click();})()`, sessionId);
    await waitFor(cdp, `location.search`, sessionId, value => value.includes('ai-agents-automation'));
    await waitFor(cdp, `document.querySelector('#reader-content h1')?.textContent`, sessionId, value => value.includes('AI Agent'));
    await cdp.evaluate(`history.back()`, sessionId);
    await waitFor(cdp, `location.search`, sessionId, value => value.includes('ai-news-industry'));
    await cdp.evaluate(`history.forward()`, sessionId);
    await waitFor(cdp, `location.search`, sessionId, value => value.includes('ai-agents-automation'));

    // Stable section routes display the unverified-anchor warning and canonical link without an invented fragment.
    const sampleSection = catalog.sections.find(section => section.article_id === 'hm:article:1077');
    const sectionUrl = new URL('/knowledge-textbook/', base); sectionUrl.searchParams.set('topic', 'hm:topic:verify-ai-work'); sectionUrl.searchParams.set('section', sampleSection.section_id);
    await cdp.request('Page.navigate', { url: sectionUrl.href }, sessionId);
    await waitFor(cdp, `document.querySelector('.lesson-section .proposed-note')?.textContent || ''`, sessionId, value => value.includes('ยังไม่ได้ตรวจยืนยัน'));
    const canonicalUrl = catalog.articles.find(article => article.article_id === sampleSection.article_id).canonical_url;
    assert.equal(await cdp.evaluate(`Array.from(document.querySelectorAll('.source-link')).some(a=>a.getAttribute('href')===${JSON.stringify(canonicalUrl)})`, sessionId), true);
    const invalidUrl = new URL('/knowledge-textbook/?topic=hm%3Atopic%3Averify-ai-work&section=hm%3Asection%3A999999%3Amissing', base);
    await cdp.request('Page.navigate', { url: invalidUrl.href }, sessionId);
    await waitFor(cdp, `document.querySelector('.fallback-note')?.textContent || ''`, sessionId, value => value.includes('ไม่พบรหัส'));

    // Malicious source text must remain text, with no executable markup inserted.
    const injected = `<img id="hm-xss" src=x onerror="window.hmXss=true">`;
    const script = `(()=>{const original=window.fetch.bind(window);window.fetch=(...args)=>original(...args).then(async response=>{const url=String(args[0]);if(!url.includes('pilot-catalog.json'))return response;const data=await response.json();data.topics.find(t=>t.topic_id==='hm:topic:verify-ai-work').label_th=${JSON.stringify(injected)};return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}})});})()`;
    await cdp.request('Page.addScriptToEvaluateOnNewDocument', { source: script }, sessionId);
    await cdp.request('Page.navigate', { url: topicUrl }, sessionId);
    await waitFor(cdp, `document.querySelector('#reader-content h1')?.textContent || ''`, sessionId, value => value === injected);
    assert.equal(await cdp.evaluate(`Boolean(document.querySelector('#hm-xss'))`, sessionId), false);
    assert.notEqual(await cdp.evaluate(`window.hmXss`, sessionId), true);
    t.diagnostic(`Screenshots saved under ${join('artifacts', 'screenshots')}`);
  } finally {
    if (browser?.pid && !browser.killed) {
      try { browser.stdio[3]?.write(`${JSON.stringify({ id: 999999, method: 'Browser.close' })}\0`); } catch {}
      await Promise.race([new Promise(resolveExit => browser.once('exit', resolveExit)), delay(2000)]);
      if (browser.exitCode === null) browser.kill();
    }
    if (server.pid && server.exitCode === null) server.kill();
  }
});
