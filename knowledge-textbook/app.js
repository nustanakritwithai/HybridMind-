import { searchCatalog } from '../search/local-search.mjs';
import { safeCanonicalUrl } from '../search/safe-url.mjs';
import { validateContentBundle, renderStructuredContent } from './content-renderer.mjs';
import { prepareInteractiveEntries } from './labs/registry.mjs';
import { mountInteractiveLabs, disposeInteractiveLabs } from './labs/manager.mjs';

const $ = (s, root = document) => root.querySelector(s);
const state = { catalog: null, contentById: new Map(), topicId: null, sectionId: null, pathId: null, invalidSection: false, progressEnabled: false, progressPaused: false };
const emptyCatalog = { snapshot: { captured_at: null, coverage_complete: false }, topics: [], articles: [], sections: [], learning_paths: [], relationships: [] };
const text = value => String(value ?? '');
function el(tag, value, cls) { const n = document.createElement(tag); if (value !== undefined) n.textContent = text(value); if (cls) n.className = cls; return n; }
function link(href, value, cls) { const a = el('a', value, cls); a.href = href; return a; }
function isSafeArticle(article) { return article?.status === 'published' && article?.visibility === 'public' && article?.password_protected === false; }
function canonicalArticleUrl(article) { return safeCanonicalUrl(article?.canonical_url); }
function route(topicId, sectionId, pathId = null) { const u = new URL(location.href); u.searchParams.delete('topic'); u.searchParams.delete('section'); u.searchParams.delete('path'); if (topicId) u.searchParams.set('topic', topicId); if (sectionId) u.searchParams.set('section', sectionId); if (pathId) u.searchParams.set('path', pathId); return u.pathname + u.search; }
function topicLabel(t) { return t?.label_th || t?.label_en || t?.topic_id || 'Untitled topic'; }
function topicDescription(topic) {
  if (topic?.topic_id === 'hm:topic:verify-ai-work') return 'ฝึกตรวจคำตอบ AI โค้ดที่สร้างขึ้น การอ้างอิง ความสดใหม่ของเอกสาร และการอนุมัติการทำงานของเอเจนต์';
  if (String(topic?.definition ?? '').startsWith('Proposed textbook chapter crosswalk')) return 'หัวข้อบทนี้เป็นข้อเสนอจากการจัดหมวดหมู่บทความ WordPress และรอการทบทวนจากกองบรรณาธิการ';
  return topic?.definition ?? '';
}
function topicArticleMapping(topic, article) {
  const relation = (state.catalog.relationships || []).find(r => r.from_id === topic.topic_id && r.to_id === article.article_id);
  if (relation?.review_status === 'rejected') return null;
  const direct = (article.topic_ids || []).includes(topic.topic_id) || article.primary_topic_id === topic.topic_id;
  return relation?.review_status === 'approved' ? 'approved' : relation?.review_status === 'proposed' || direct ? 'proposed' : null;
}
function articlesFor(topic) {
  const articles = state.catalog.articles.filter(a => isSafeArticle(a) && topicArticleMapping(topic, a));
  const order = [1077,1073,2241,2310,2494].map(id => `hm:article:${id}`);
  return topic.topic_id === 'hm:topic:verify-ai-work' ? articles.sort((a,b)=>order.indexOf(a.article_id)-order.indexOf(b.article_id)) : articles;
}
function topicSections(topic) { return articlesFor(topic).flatMap(article => state.catalog.sections.filter(section => section.article_id === article.article_id).sort((a,b) => a.display_order - b.display_order)); }
function selectedTopic() { return state.catalog.topics.find(t => t.topic_id === state.topicId); }
function progressKey(topic) { return `hm-reading:${topic.topic_id}`; }
const consentKey = 'hm-reading:consent';
function readProgress(topic) {
  if (!state.progressEnabled || !topic) return null;
  try {
    const p = JSON.parse(localStorage.getItem(progressKey(topic)) || 'null'); if (!p) return null;
    let migrated = false;
    if (!Object.hasOwn(p, 'lastViewedSectionId')) { p.lastViewedSectionId = p.sectionId ?? null; migrated = true; }
    if (!Object.hasOwn(p, 'lastViewedContentRevision')) { p.lastViewedContentRevision = p.revision ?? null; migrated = true; }
    if (!Array.isArray(p.completionEvents)) {
      p.completionEvents = p.completed === true ? [{ topicRevision: null, status: 'completed', changedAt: p.savedAt ?? null, legacy: true }] : [];
      migrated = true;
    }
    if (Object.hasOwn(p, 'sectionId') || Object.hasOwn(p, 'revision') || Object.hasOwn(p, 'completed')) migrated = true;
    delete p.sectionId; delete p.revision; delete p.completed;
    if (migrated) localStorage.setItem(progressKey(topic), JSON.stringify(p));
    return p;
  } catch { return null; }
}
function topicContentRevision(topic) { return `${topic.topic_revision ?? ''}:${articlesFor(topic).map(a => `${a.article_id}@${a.article_revision ?? a.modified_at ?? ''}`).sort().join('|')}`; }
function explicitTopicRevision(topic) { return topic?.topic_revision === null || topic?.topic_revision === undefined || topic?.topic_revision === '' ? null : String(topic.topic_revision); }
function completionStatus(topic, progress) {
  const topicRevision = explicitTopicRevision(topic), events = progress?.completionEvents ?? [];
  const latestByRevision = new Map();
  events.forEach((event, index) => latestByRevision.set(String(event.topicRevision), { event, index }));
  const currentEvent = topicRevision === null ? null : latestByRevision.get(topicRevision)?.event ?? null;
  let previousCompletion = null, previousCompletionIndex = -1;
  if (topicRevision !== null) for (const [revision, latest] of latestByRevision) {
    if (revision !== topicRevision && latest.event.status === 'completed' && latest.index > previousCompletionIndex) {
      previousCompletion = latest.event; previousCompletionIndex = latest.index;
    }
  }
  return { topicRevision, currentEvent, completed: currentEvent?.status === 'completed', reviewNeeded: topicRevision !== null && !currentEvent && Boolean(previousCompletion), previousCompletion };
}
function saveProgress(topic) { if (!state.progressEnabled || state.progressPaused || !topic) return; try { const prior = readProgress(topic); localStorage.setItem(progressKey(topic), JSON.stringify({ lastViewedContentRevision: topicContentRevision(topic), lastViewedSectionId: state.sectionId || prior?.lastViewedSectionId || null, completionEvents: prior?.completionEvents ?? [], savedAt: new Date().toISOString() })); } catch {} }
function searchParamsFromControls() { const u = new URL(location.href); for (const [key, id] of [['q','search-input'],['filterTopic','filter-topic'],['type','filter-type'],['level','filter-level'],['locale','filter-locale'],['sort','filter-sort']]) { const value = $(`#${id}`)?.value || ''; if (value) u.searchParams.set(key, value); else u.searchParams.delete(key); } return u; }
function syncSearchUrl({ replace = false } = {}) { const u = searchParamsFromControls(); history[replace ? 'replaceState' : 'pushState']({}, '', u); }
function restoreSearchFromUrl() { const u = new URL(location.href); for (const [key, id] of [['q','search-input'],['filterTopic','filter-topic'],['type','filter-type'],['level','filter-level'],['locale','filter-locale'],['sort','filter-sort']]) { const node = $(`#${id}`); if (node) node.value = u.searchParams.get(key) || ''; } renderSearch(); }
function renderTopicNav(target) {
  target.replaceChildren();
  const children = new Map();
  for (const topic of state.catalog.topics) {
    const parentId = topic.parent_topic_id || null, list = children.get(parentId) || [];
    list.push(topic); children.set(parentId, list);
  }
  const draw = (topic, depth = 0) => {
    const a = link(route(topic.topic_id), topicLabel(topic), `topic-link${topic.topic_id === state.topicId ? ' active' : ''}${depth ? ' child' : ''}`);
    a.setAttribute('aria-current', topic.topic_id === state.topicId ? 'page' : 'false'); target.append(a);
    for (const child of children.get(topic.topic_id) || []) draw(child, depth + 1);
  };
  for (const topic of children.get(null) || []) draw(topic);
  if (!state.catalog.topics.length) target.append(el('p', 'ไม่มีหัวข้อในข้อมูลชุดนี้', 'muted'));
}
function renderLearningPaths() {
  const target = $('#learning-paths'); target.replaceChildren();
  if (!state.catalog.learning_paths.length) return;
  target.append(el('h2', 'เส้นทางการเรียนรู้'));
  for (const path of state.catalog.learning_paths) {
    const firstTopic = path.ordered_topic_ids[0];
    const card = el('div', undefined, 'learning-path-card');
    if (firstTopic) card.append(link(route(firstTopic, null, path.path_id), path.title)); else card.append(el('strong', path.title));
    const goal = path.path_id === 'hm:path:verify-ai-work-basics' ? 'เรียนรู้วิธีตรวจสอบผลลัพธ์ AI ด้วยหลักฐานจากบทความที่เสนอให้ศึกษา' : path.goal;
    card.append(el('small', `${path.status === 'proposed' ? 'เส้นทางที่เสนอ' : path.status} · ${goal}`));
    target.append(card);
  }
}
function topicPaths(topic) { return state.catalog.learning_paths.filter(path => (path.ordered_topic_ids || []).includes(topic.topic_id)); }
function renderTopicPathChoices(topic) {
  const paths = topicPaths(topic); if (!paths.length) return null;
  const nav = el('nav', undefined, 'topic-path-choices'); nav.setAttribute('aria-label', 'Choose a learning path');
  const active = paths.find(path => path.path_id === state.pathId);
  nav.append(el('strong', active ? `Active learning path: ${active.title}` : 'Choose a learning path for ordered previous and next topics', 'active-path-label'));
  for (const path of paths) {
    const choice = link(route(topic.topic_id, state.sectionId, path.path_id), path.title, `topic-path-choice${active?.path_id === path.path_id ? ' selected' : ''}`);
    choice.dataset.pathId = path.path_id;
    if (active?.path_id === path.path_id) choice.setAttribute('aria-current', 'page');
    nav.append(choice);
  }
  return nav;
}
function renderSearch() {
  const box = $('#search-results'); box.replaceChildren(); const q = $('#search-input').value.trim(); if (!q) return;
  let matches = [], notice = null;
  try { const found = searchCatalog(state.catalog, q, { topicId: $('#filter-topic').value, contentType: $('#filter-type').value, difficulty: $('#filter-level').value, locale: $('#filter-locale').value, sort: document.querySelector('#filter-sort')?.value || 'relevance' }, [...state.contentById.values()]); matches = Array.isArray(found) ? found : found?.results || []; notice = found?.notice ?? null; } catch (err) { console.warn('Keyword search unavailable', err); }
  if (!matches.length) {
    if (notice === 'unpublished-content') box.append(el('p', 'ค้นหาเฉพาะบทความที่เผยแพร่สาธารณะ ระบบไม่แสดงฉบับร่างหรือเนื้อหาส่วนตัว', 'proposed-note'));
    box.append(el('p', 'ไม่พบผลลัพธ์ ลองใช้คำค้นอื่น', 'muted')); return;
  }
  box.append(el('p', `พบ ${matches.length} รายการ | ค้นด้วยคำสำคัญ`, 'result-count'));
  for (const result of matches.slice(0, 12)) {
    const destination = result.kind === 'topic' ? route(result.id) : result.topicId
      ? route(result.topicId, result.kind === 'section' ? result.id : null)
      : safeCanonicalUrl(result.url) || route(state.topicId);
    const a = link(destination, '', 'result-card');
    a.append(el('span', ({topic:'หัวข้อ',article:'บทความ',section:'หัวข้อย่อย'}[result.kind] || 'ผลลัพธ์'), 'result-kind'), el('strong', result.title), el('span', result.snippet || '', 'result-snippet'));
    box.append(a);
  }
}
function sectionNode(section) {
  const block = el('section', undefined, 'lesson-section'); block.id = `sec-${section.section_id}`;
  const h = el(`h${section.heading_level === 3 ? 3 : 2}`, section.heading_text); h.id = `heading-${section.section_id}`; block.append(h);
  if (section.summary) block.append(el('p', section.summary, 'section-summary'));
  if (section.content_text) block.append(el('p', section.content_text));
  if (!section.content_text && !section.summary) block.append(el('p', 'ข้อมูลชุดนี้มีเฉพาะชื่อหัวข้อย่อย ยังไม่มีเนื้อหาส่วนนี้', 'muted'));
  if (section.anchor_status !== 'verified' || !section.anchor) block.append(el('small', 'ลิงก์หัวข้อนี้ยังไม่ได้ตรวจยืนยันกับ WordPress', 'proposed-note'));
  return block;
}
function renderReader() {
  const out = $('#reader-content'); disposeInteractiveLabs(out); out.replaceChildren(); const topic = selectedTopic();
  if (!topic) { const empty = el('div', undefined, 'empty-state'); empty.append(el('h2', 'Choose a topic to begin'), el('p', 'This snapshot may not cover every published article.')); out.append(empty); return; }
  out.append(el('p', topic.status === 'ready' && topic.editorial_status === 'approved' ? 'หัวข้อที่ผ่านการทบทวน' : 'หัวข้อที่เสนอ | รอทบทวนโดยกองบรรณาธิการ', 'eyebrow'), el('h1', topicLabel(topic), 'reader-title'));
  const description = topicDescription(topic);
  if (description) out.append(el('p', description, 'lead'));
  out.append(el('p', state.contentById.size ? 'แสดงเนื้อหาที่นำเข้าจาก WordPress และผ่านการตรวจสอบสำหรับบทความที่มีข้อมูลเท่านั้น ส่วนองค์ประกอบโต้ตอบที่ไม่รองรับจะแสดงคำอธิบายแบบคงที่; เปิดต้นฉบับเพื่อใช้สื่อโต้ตอบเต็มรูปแบบ' : 'ข้อจำกัดของต้นแบบ: ข้อมูลที่ได้รับมีชื่อเรื่อง บทคัดย่อ และหัวข้อย่อย แต่ไม่มี HTML เนื้อหาเต็ม ไฟล์ภาพ หรือบล็อก Gutenberg ฉบับนี้จึงไม่สร้างบทเรียนทดแทน เปิดบทความต้นฉบับเพื่ออ่านเนื้อหา ภาพ และตัวอย่างโต้ตอบครบถ้วน', 'scope-note'));
  const prior = readProgress(topic), revision = topicContentRevision(topic), completion = completionStatus(topic, prior);
  if (prior?.lastViewedContentRevision) {
    const viewed = state.catalog.sections.find(sec => sec.section_id === prior.lastViewedSectionId);
    out.append(el('p', prior.lastViewedContentRevision === revision ? `อ่านล่าสุด: ${viewed?.heading_text || 'จุดเริ่มต้นของหัวข้อ'}` : 'หัวข้อนี้มีการปรับปรุงหลังจากอ่านครั้งล่าสุด', prior.lastViewedContentRevision === revision ? 'progress-note' : 'updated-note'));
  }
  if (state.progressEnabled) {
    if (completion.reviewNeeded) out.append(el('p', `Review needed: previously completed at topic revision ${completion.previousCompletion.topicRevision}.`, 'review-needed'));
    else out.append(el('p', completion.completed ? `Completed at topic revision ${completion.topicRevision}.` : completion.topicRevision ? `Not completed at topic revision ${completion.topicRevision}.` : 'Completion tracking requires an explicit topic revision.', completion.completed ? 'completion-note' : 'progress-note'));
    const button = el('button', completion.completed ? 'Mark current revision incomplete' : 'Mark current revision complete', 'complete-topic'); button.type = 'button';
    button.disabled = completion.topicRevision === null; button.setAttribute('aria-pressed', String(completion.completed));
    button.addEventListener('click', () => {
      if (completion.topicRevision === null) return;
      try {
        const events = prior?.completionEvents ?? [];
        events.push({ topicRevision: completion.topicRevision, status: completion.completed ? 'incomplete' : 'completed', changedAt: new Date().toISOString() });
        localStorage.setItem(progressKey(topic), JSON.stringify({ lastViewedContentRevision: revision, lastViewedSectionId: state.sectionId || prior?.lastViewedSectionId || null, completionEvents: events, savedAt: new Date().toISOString() }));
      } catch {}
      renderReader();
    });
    out.append(button);
  }
  const articles = articlesFor(topic), sections = topicSections(topic);
  const subnav = el('nav', undefined, 'in-page-toc'); subnav.setAttribute('aria-label', 'สารบัญหัวข้อย่อยในบทความ');
  subnav.append(el('strong', 'เลือกดูหัวข้อย่อยของบทความ'));
  for (const article of articles) {
    const outline = el('details', undefined, 'article-outline');
    const headings = sections.filter(s => s.article_id === article.article_id);
    const summary = el('summary', `${article.title} — ${headings.length} หัวข้อย่อย`); outline.append(summary);
    const links = el('div', undefined, 'outline-links');
    headings.forEach(s => links.append(link(route(topic.topic_id, s.section_id, state.pathId), s.heading_text)));
    outline.append(links); subnav.append(outline);
  }
  out.append(subnav);
  const section = sections.find(s => s.section_id === state.sectionId);
  if (state.invalidSection || (state.sectionId && !section)) out.append(el('p', 'ไม่พบรหัสหัวข้อย่อยนี้ จึงแสดงหน้าหัวข้อแทน', 'fallback-note'));
  if (section && !state.contentById.has(section.article_id)) { const node = sectionNode(section); out.append(node); requestAnimationFrame(() => node.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })); }
  else if (!section && !state.contentById.size && sections.length) out.append(el('p', 'เลือกหัวข้อย่อยด้านบนเพื่อดูข้อมูลจาก snapshot หรือเปิดบทความต้นฉบับ', 'muted'));
  if (!sections.length) out.append(el('p', 'ไม่พบหัวข้อย่อยในข้อมูลชุดนี้', 'muted'));
  const source = el('div', undefined, 'source-list'); source.append(el('h2', 'บทความต้นฉบับและสื่อ'));
  if (!articles.length) source.append(el('p', 'ยังไม่มีบทความที่เชื่อมกับหัวข้อนี้'));
  articles.forEach((a, articleIndex) => {
    const card = el('article', undefined, 'source-card');
    card.append(el('h3', a.title));
    const contentEntry=state.contentById.get(a.article_id); if(contentEntry?.provenance==='wordpress_export') { card.append(el("small", "Public WordPress snapshot: "+new Date(contentEntry.imported_at).toLocaleDateString("th-TH")+" · source revision "+contentEntry.source_revision, "source-meta")); card.append(renderStructuredContent(contentEntry,{document,sourceArticle:a,sections:sections.filter(item=>item.article_id===a.article_id)})); }
    if (topicArticleMapping(topic, a) !== 'approved') card.append(el('span', 'เสนอให้เชื่อมโยง | รอทบทวนโดยกองบรรณาธิการ', 'mapping-note'));
    card.append(el('p', a.summary || 'บทความจาก WordPress'));
    if (a.modified_at) card.append(el('small', `แก้ไขต้นฉบับล่าสุด: ${new Date(a.modified_at).toLocaleDateString('th-TH')}`, 'source-meta'));
    const url = canonicalArticleUrl(a);
    if (url) {
      const sourceLink = link(url, 'อ่านบทความต้นฉบับบน WordPress (เนื้อหา ภาพ และตัวอย่างโต้ตอบ)', 'source-link');
      sourceLink.target = '_blank'; sourceLink.rel = 'noopener noreferrer';
      card.append(sourceLink);
    } else card.append(el('p', 'ลิงก์ต้นฉบับไม่ผ่านการตรวจสอบ จึงซ่อนไว้', 'fallback-note'));
    const articlePager = el('nav', undefined, 'article-pager'); articlePager.setAttribute('aria-label', 'Previous and next source articles');
    for (const [label,neighbor] of [['ก่อนหน้า', articles[articleIndex-1]], ['ถัดไป',articles[articleIndex+1]]]) {
      if (!neighbor) continue;
      const firstSection = sections.find(item=>item.article_id===neighbor.article_id);
      articlePager.append(link(route(topic.topic_id,firstSection?.section_id,state.pathId), `${label}: ${neighbor.title}`));
    }
    card.append(articlePager); source.append(card);
  });
  out.append(source);
  mountInteractiveLabs(out);
  if (section && state.contentById.has(section.article_id)) {
    const target = document.getElementById("sec-" + section.section_id);
    if (target) requestAnimationFrame(() => { if (target.isConnected && state.sectionId === section.section_id) target.scrollIntoView({block:"start",behavior:"instant"}); });
    else out.append(el("p", "This heading changed in the latest source revision. The full article is shown below its title; use its original WordPress link for the source outline.", "fallback-note"));
    const index = sections.indexOf(section), pager = el("nav", undefined, "topic-pager");
    pager.setAttribute("aria-label", "Previous and next sections");
    for (const [label,item] of [["Previous",sections[index-1]],["Next",sections[index+1]]]) if (item) pager.append(link(route(topic.topic_id,item.section_id,state.pathId), label+": "+item.heading_text));
    out.insertBefore(pager, source);
  }
  const pathChoice = renderTopicPathChoices(topic); if (pathChoice) out.append(pathChoice);
  const path = state.catalog.learning_paths.find(p => p.path_id === state.pathId);
  if (path) {
    const sequence = path.ordered_topic_ids || [], ix = sequence.indexOf(topic.topic_id), prev = ix > 0 ? state.catalog.topics.find(t=>t.topic_id===sequence[ix-1]) : null, next = ix >= 0 && ix < sequence.length-1 ? state.catalog.topics.find(t=>t.topic_id===sequence[ix+1]) : null;
    const pager = el('nav', undefined, 'topic-pager'); pager.setAttribute('aria-label', `Previous and next topics in ${path.title}`);
    pager.append(prev ? link(route(prev.topic_id, null, path.path_id), `← ก่อนหน้า: ${topicLabel(prev)}`) : el('span', `จุดเริ่มต้น · ${path.title}`));
    pager.append(next ? link(route(next.topic_id, null, path.path_id), `ถัดไป: ${topicLabel(next)} →`) : el('span', `สิ้นสุด · ${path.title}`)); out.append(pager);
  }
  if (state.progressEnabled && !state.progressPaused && (!prior || prior.lastViewedContentRevision === revision)) saveProgress(topic);
}
function syncRoute({ userNavigation = false } = {}) {
  const u = new URL(location.href), topics = state.catalog.topics; state.topicId = u.searchParams.get('topic') || topics[0]?.topic_id || null; state.sectionId = u.searchParams.get('section'); const requestedPath=u.searchParams.get('path'); const validPath=state.catalog.learning_paths.find(p=>p.path_id===requestedPath&&(p.ordered_topic_ids||[]).includes(state.topicId)); state.pathId=validPath?.path_id||null; if(requestedPath && !state.pathId){u.searchParams.delete('path');history.replaceState({},'',u);}
  const topic = selectedTopic(); state.invalidSection = Boolean(state.sectionId && topic && !topicSections(topic).some(s => s.section_id === state.sectionId));
  if (state.invalidSection) state.sectionId = null;
  renderTopicNav($('#topic-toc')); renderMobileToc(); renderReader(); state.invalidSection = false;
}
function renderMobileToc() {
  const target = $('#mobile-topic-toc'); renderTopicNav(target);
  const topic = selectedTopic(); if (!topic) return;
  const subnav = el('nav', undefined, 'mobile-section-toc'); subnav.setAttribute('aria-label', 'หัวข้อย่อยในหัวข้อนี้');
  const title = el('strong', 'หัวข้อย่อยในหัวข้อนี้'); subnav.append(title);
  const articles = articlesFor(topic), sections = topicSections(topic);
  if (!sections.length) subnav.append(el('p', 'ไม่พบหัวข้อย่อยในข้อมูลชุดนี้', 'muted'));
  for (const article of articles) {
    const outline = el('details', undefined, 'article-outline');
    const headings = sections.filter(s => s.article_id === article.article_id);
    outline.append(el('summary', `${article.title} — ${headings.length} หัวข้อย่อย`));
    const links = el('div', undefined, 'outline-links');
    headings.forEach(s => links.append(link(route(topic.topic_id, s.section_id, state.pathId), s.heading_text)));
    outline.append(links); subnav.append(outline);
  }
  target.append(subnav);
  if (state.catalog.learning_paths.length) {
    const paths = el('nav', undefined, 'mobile-path-links'); paths.setAttribute('aria-label', 'เส้นทางการเรียนรู้');
    paths.append(el('strong', 'เส้นทางการเรียนรู้'));
    for (const path of state.catalog.learning_paths) for (const topicId of path.ordered_topic_ids ?? []) paths.append(link(route(topicId, null, path.path_id), `${path.title}: ${topicLabel(state.catalog.topics.find(t=>t.topic_id===topicId))}`));
    target.append(paths);
  }
}
async function start() {
  try { const res = await fetch('../data/pilot-catalog.json'); if (!res.ok) throw new Error(`HTTP ${res.status}`); state.catalog = await res.json(); }
  catch (err) { state.catalog = emptyCatalog; $('#reader-content').append(el('p', `Catalog unavailable (${err.message}).`, 'fallback-note')); }
  state.catalog = { ...emptyCatalog, ...state.catalog }; state.catalog.topics ||= []; state.catalog.articles ||= []; state.catalog.sections ||= []; state.catalog.relationships ||= [];
  state.contentById = new Map(); try { const response=await fetch('../data/pilot-content-bundle.json'); if(response.ok){const bundle=await response.json();validateContentBundle(bundle,{catalog:state.catalog});await prepareInteractiveEntries(bundle.articles);state.contentById=new Map(bundle.articles.filter(entry=>entry.provenance==='wordpress_export').map(entry=>[entry.article_id,entry]));} } catch(error) { console.info('No validated WordPress content bundle; showing metadata fallback.'); }
  const snap = state.catalog.snapshot || {}; $('#snapshot-label').textContent = `ข้อมูล ${snap.captured_at ? new Date(snap.captured_at).toLocaleDateString('th-TH') : 'ไม่ทราบวันที่'} | ${snap.coverage_complete ? 'ครบตาม snapshot' : 'ข้อมูลบางส่วน'}`;
  const topicFilter = $('#filter-topic'); state.catalog.topics.forEach(t => { const option = document.createElement('option'); option.value = t.topic_id; option.textContent = topicLabel(t); topicFilter.append(option); });
  const progressControls = $('#progress-controls'); progressControls.replaceChildren();
  const label = el('label', undefined, 'progress-toggle'), input = document.createElement('input'); input.type='checkbox'; input.id='progress-opt-in';
  try { state.progressEnabled = localStorage.getItem(consentKey) === 'yes'; } catch { state.progressEnabled = false; }
  input.checked=state.progressEnabled; input.setAttribute('aria-label','บันทึกความคืบหน้าไว้ในอุปกรณ์นี้'); label.append(input,document.createTextNode('บันทึกความคืบหน้าไว้ในอุปกรณ์นี้')); progressControls.append(label);
  input.addEventListener('change',()=>{state.progressEnabled=input.checked;state.progressPaused=false;try{if(input.checked)localStorage.setItem(consentKey,'yes');else localStorage.removeItem(consentKey);}catch{}renderReader();});
  const reset=el('button','ล้างความคืบหน้าและการยินยอม','reset-progress'); reset.type='button'; reset.addEventListener('click',()=>{try{Object.keys(localStorage).filter(k=>k.startsWith('hm-reading:')).forEach(k=>localStorage.removeItem(k));}catch{}state.progressEnabled=false;state.progressPaused=true;input.checked=false;renderReader();}); progressControls.append(reset);
  const filterDisclosure = $('#filter-disclosure'), mobileLayout = matchMedia('(max-width:760px)');
  const syncFilterDisclosure = () => { filterDisclosure.open = !mobileLayout.matches; };
  syncFilterDisclosure(); mobileLayout.addEventListener('change', syncFilterDisclosure);
  $('#search-form').addEventListener('submit', e => { e.preventDefault(); syncSearchUrl(); renderSearch(); }); $('#search-input').addEventListener('input', () => {renderSearch();syncSearchUrl({replace:true});});
  ['filter-topic','filter-type','filter-level','filter-locale','filter-sort'].forEach(id => $(`#${id}`)?.addEventListener('change',()=>{renderSearch();syncSearchUrl();}));
  $('#mobile-toc').addEventListener('click', e => { if (e.target.closest('a')) $('#mobile-toc').open = false; });
  document.addEventListener('click', e => { const a = e.target.closest('a[href*="topic="]'); if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; const dest = new URL(a.href); if (dest.origin !== location.origin) return; e.preventDefault(); history.pushState({}, '', dest); syncRoute({ userNavigation: true }); window.scrollTo(0,0); });
  window.addEventListener('popstate', () => {restoreSearchFromUrl();syncRoute({userNavigation:true});}); restoreSearchFromUrl(); syncRoute(); renderLearningPaths();
}
start();
