import { safeCanonicalUrl } from './safe-url.mjs';

/** Local, transparent keyword search. This is not semantic search. */
const norm = (value = '') => String(value).normalize('NFKC').toLocaleLowerCase();
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
const fallbackTokenPattern = /[\p{Script=Thai}]+|[\p{L}\p{N}]+/gu;
const STOP_WORDS = new Set(`
  a an the and or but if so for to of in on at by from with as is are was were be been being do does did have has had can could should would may might will not no yes how what when where why which who this that these those it its we you your now currently there then about using use please help find read
  hybridmind search topic topics article articles section sections chapter chapters
  ทำ ยัง ไง ให้ อะไร บ้าง ก่อน เข้า ถ้า ต้อง จะ ว่า ไม่ ใช่ ใน กับ ของ จาก ไป มา มี ไหม หรือ แล้ว ได้ ตอน นี้ ขอ เป็น และ แต่ ตรง ไหน เมื่อ ไหร่ การ กัน ซ้ำ ผิด เดียว หลาย ควร อ่าน แบบ เอา ไว้ ขึ้น ลง ใหม่ เดิม อย่าง เท่า บน ถือ ช่วย ตั้ง ค่า เปิด ใช้ เลย อยาก ตอบ ภาษา เตรียม โปร เจ กต์
`.trim().split(/\s+/u));
// Query-only function words that otherwise survive Thai segmentation as
// independent tokens. This remains lexical filtering, not intent inference.
const EXTRA_STOP_WORDS = new Set(`
  before after if need must should what which how where why when does do can
  ถ้า ต้อง อะไร บ้าง ก่อน เข้า ตรงไหน ยังไง ยัง จะ ให้ มา แล้ว ได้ ที่ จริง มีผล ค้น ไทย ชนะ ด้วย แน่นอน สารบัญ เรา ไม่ได้ ตอบ คือ
`.trim().split(/\s+/u));
function tokens(value) {
  const input = norm(value);
  const segments = segmenter
    ? [...segmenter.segment(input)].filter(segment => segment.isWordLike).map(segment => segment.segment)
    : (input.match(fallbackTokenPattern) ?? []);
  return [...new Set(segments.filter(term => !/^\d+$/u.test(term) && !STOP_WORDS.has(term) && !EXTRA_STOP_WORDS.has(term)))];
}
const escapeHtml = value => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const navigationHeading = value => /^(?:อ่านต่อ|read more\b|table of contents\b|related posts?\b|share this article\b|subscribe\b)/iu.test(String(value ?? '').trim());
// Deny only explicit requests to retrieve private/draft excerpts. General
// public questions about draft policy remain searchable. Private records are
// excluded from documents() regardless of query wording.
const privateSnippetRequest = value => {
  const query = norm(value);
  const privateTarget = /\b(?:private|confidential)\b|(?:ส่วนตัว|ความลับ)/iu.test(query)
    || (/\b(?:draft|unpublished)\b|(?:ฉบับร่าง)/iu.test(query)
      && /\b(?:unpublished|not\s+published)\b|ยัง\s*ไม่\s*(?:เผยแพร่|publish)/iu.test(query));
  const snippetTarget = /\b(?:snippet|excerpt|quote|text|content)\b|(?:snippet|ข้อความ|เนื้อหา|ตัวอย่างข้อความ)/iu.test(query);
  const retrievalAction = /\b(?:get|fetch|retrieve|pull|show|return|give|find|ดึง|เอา|ขอ)\b|(?:ดึง|เอา|ขอ|แสดง|ส่งมา)/iu.test(query);
  return privateTarget && snippetTarget && retrievalAction;
};

function publicArticle(article) {
  // Unknown password state is excluded from the runtime index. Inventory rows
  // remain in the snapshot for coverage, but only an explicit false is public.
  return article?.status === 'published' && article?.visibility === 'public' && article?.password_protected === false;
}

function documents(catalog) {
  const topics = catalog?.topics ?? [];
  const topicById = new Map(topics.map(topic => [topic.topic_id, topic]));
  const relationshipTopicsByArticle = new Map();
  // Relationship mappings remain editorially proposed; they are searchable
  // context only and never upgrade editorial_status/review_status.
  for (const relation of catalog?.relationships ?? []) {
    if (relation.review_status !== 'rejected' && topicById.has(relation.from_id)) {
      const ids = relationshipTopicsByArticle.get(relation.to_id) ?? [];
      if (!ids.includes(relation.from_id)) ids.push(relation.from_id);
      relationshipTopicsByArticle.set(relation.to_id, ids);
    }
  }
  const docs = [];
  for (const topic of topics) {
    if (topic.status === 'archived') continue;
    docs.push({kind:'topic', id:topic.topic_id, title:topic.label_th, snippet:topic.definition,
      url:`?topic=${encodeURIComponent(topic.topic_id)}`, topicId:topic.topic_id,
      contentType:null, difficulty:topic.audience_level, locale:'th', date:null,
      searchable:[topic.label_th, topic.label_en, topic.definition, topic.intent,
        ...(topic.questions ?? []), ...(topic.search_aliases ?? []).map(a => a.value)].filter(Boolean).join(' ')});
  }
  const articles = (catalog?.articles ?? []).filter(publicArticle);
  const articleById = new Map(articles.map(article => [article.article_id, article]));
  for (const article of articles) {
    const topicIds = [...new Set([...(article.topic_ids ?? []), ...(article.primary_topic_id ? [article.primary_topic_id] : []), ...(relationshipTopicsByArticle.get(article.article_id) ?? [])])];
    const topicId = topicIds[0] ?? null;
    const topic = topicById.get(topicId);
    docs.push({kind:'article', id:article.article_id, title:article.title,
      snippet:escapeHtml(article.summary ?? ''), url:safeCanonicalUrl(article.canonical_url), topicId,
      topicIds,
      contentType:article.content_type, difficulty:article.audience_level, locale:article.locale,
      date:article.modified_at ?? article.published_at,
      searchable:[article.title, article.summary, topic?.label_th, topic?.label_en].filter(Boolean).join(' ')});
  }
  for (const section of catalog?.sections ?? []) {
    if (navigationHeading(section.heading_text)) continue;
    const article = articleById.get(section.article_id);
    if (!article) continue;
    const topicIds = [...new Set([...(article.topic_ids ?? []), ...(article.primary_topic_id ? [article.primary_topic_id] : []), ...(relationshipTopicsByArticle.get(article.article_id) ?? [])])];
    const topicId = topicIds[0] ?? null;
    const heading = section.heading_text ?? '';
    const anchor = section.anchor;
    const canonicalUrl = safeCanonicalUrl(article.canonical_url);
    const url = canonicalUrl ? (anchor ? `${canonicalUrl}#${encodeURIComponent(anchor)}` : canonicalUrl) : null;
    docs.push({kind:'section', id:section.section_id, title:heading,
      snippet:escapeHtml(section.summary ?? section.content_text ?? ''), url, topicId, topicIds,
      contentType:article.content_type, difficulty:article.audience_level, locale:article.locale,
      date:article.modified_at ?? article.published_at,
      // The catalog carries section content excerpts for display metadata, but
      // keyword retrieval stays on headings, concise summaries, and article
      // titles to reduce broad matches from long body-like text.
      searchable:[heading, section.summary].filter(Boolean).join(' ')});
  }
  return docs;
}

// Small, transparent bilingual aliases help Thai/English queries meet the
// same concepts without introducing embeddings or claiming semantic search.
const ALIAS_GROUPS = [
  ['code', 'programming', 'โค้ด', 'โปรแกรม'],
  ['test', 'tests', 'testing', 'ทดสอบ', 'เทสต์'],
  ['permission', 'permissions', 'authorization', 'authorized', 'สิทธิ์', 'อนุญาต'],
  ['private', 'confidential', 'ส่วนตัว', 'ลับ'],
  ['document', 'documents', 'เอกสาร'],
  ['hydrate', 'hydration', 'โหลด'],
  ['citation', 'citations', 'cite', 'cited', 'reference', 'อ้างอิง'],
  ['revision', 'revisions', 'version', 'รุ่น'],
  ['stale', 'outdated', 'old', 'เก่า', 'ล้าสมัย'],
  ['hash', 'sha256', 'แฮช'],
];
const aliasByTerm = new Map(ALIAS_GROUPS.flatMap(group => group.map(term => [term, group])));
function queryConcepts(queryTerms) {
  const concepts = [];
  const assigned = new Set();
  for (const term of queryTerms) {
    if (assigned.has(term)) continue;
    const aliases = aliasByTerm.get(term) ?? [term];
    for (const alias of aliases) assigned.add(alias);
    concepts.push({term, aliases});
  }
  return concepts;
}

function scoreDocument(doc, concepts, termWeights, requiredMatches) {
  const titleTerms = new Set(tokens(doc.title));
  const bodyTerms = new Set(tokens(doc.searchable));
  const matched = concepts.filter(concept => concept.aliases.some(alias => bodyTerms.has(alias)));
  if (matched.length < requiredMatches) return 0;
  return matched.reduce((score, concept) => score + termWeights.get(concept.term) * (concept.aliases.some(alias => titleTerms.has(alias)) ? 3 : 1), 0)
    + matched.length / concepts.length;
}

/** Returns {query, mode, total, results}; filters: topicId, contentType, difficulty, locale, sort. */
export function searchCatalog(catalog, query, filters = {}) {
  const q=String(query ?? '').trim();
  if (privateSnippetRequest(q)) return {query:q, mode:'keyword', total:0, results:[], notice:'unpublished-content'};
  const queryTerms = tokens(q);
  const concepts = queryConcepts(queryTerms);
  if (q && !concepts.length) return {query:q, mode:'keyword', total:0, results:[]};
  const docs = documents(catalog);
  const documentTerms = docs.map(doc => new Set(tokens(doc.searchable)));
  const termWeights = new Map(concepts.map(concept => {
    const frequency = documentTerms.filter(termsForDoc => concept.aliases.some(alias => termsForDoc.has(alias))).length;
    return [concept.term, Math.log(1 + (docs.length - frequency + 0.5) / (frequency + 0.5))];
  }));
  // Require two distinct lexical concepts for multi-concept queries; this
  // filters generic one-word overlaps while keeping long questions usable.
  const rawQueryTermCount = segmenter
    ? [...segmenter.segment(norm(q))].filter(segment => segment.isWordLike).length
    : (norm(q).match(fallbackTokenPattern) ?? []).length;
  const requiredMatches = rawQueryTermCount <= 1 && concepts.length <= 1 ? 1 : 2;
  let results=docs.map(doc=>({...doc, score:concepts.length ? scoreDocument(doc,concepts,termWeights,requiredMatches) : 0}));
  if (q) results=results.filter(item=>item.score>0);
  for (const [filter,key] of [['topicId','topicId'],['contentType','contentType'],['difficulty','difficulty'],['locale','locale']]) {
    if (filters[filter]) results=results.filter(item=>filter==='topicId' ? (item.topicIds ?? [item[key]]).includes(filters[filter]) : item[key]===filters[filter]);
  }
  if (filters.topicId) results=results.map(item=>({...item,topicId:filters.topicId}));
  if (filters.sort === 'date') results.sort((a,b)=>String(b.date??'').localeCompare(String(a.date??'')) || b.score-a.score);
  else results.sort((a,b)=>b.score-a.score || a.title.localeCompare(b.title));
  results=results.map(({date,searchable,locale,topicIds,...result})=>result);
  return {query:q, mode:'keyword', total:results.length, results};
}
