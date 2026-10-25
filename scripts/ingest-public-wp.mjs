#!/usr/bin/env node
/**
 * Deterministically materialize the verified public WordPress snapshot into
 * the reader catalog. The input snapshot was captured by anonymous REST GETs;
 * this script is offline and never writes to WordPress.
 *
 * Usage (repository root): node scripts/ingest-public-wp.mjs
 * Optional: --inventory <file> --mapping <file> --pilot <file> --cross-list <csv> --out <file>
 *
 * First run creates random persistent editorial section keys in the catalog.
 * Later runs reuse prior section IDs by article, heading level and heading text,
 * so reordering does not change deep-link IDs. If an editor renames a heading,
 * re-associate its saved section ID in the catalog before regenerating.
 */
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { mkdir } from 'node:fs/promises';

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) =>
  value.startsWith('--') ? [...pairs, [value.slice(2), all[index + 1] && !all[index + 1].startsWith('--') ? all[index + 1] : true]] : pairs, []));
const inputDir = 'reference/inventory/knowledge-inventory';
const inventoryFile = resolve(args.inventory ?? `${inputDir}/inventory.json`);
const mappingFile = resolve(args.mapping ?? `${inputDir}/canonical_topic_mapping.json`);
const pilotFile = resolve(args.pilot ?? `${inputDir}/verification_pilot_mapping.json`);
const crossListFile = resolve(args['cross-list'] ?? `${inputDir}/cross_listed_articles.csv`);
const outputFile = resolve(args.out ?? 'offline/pilot-catalog-full.json');
const version = '1.0.0';

const chapters = [
  { id: 'ai-foundations-verification', en: 'AI Foundations & Verification', th: 'พื้นฐาน AI และการตรวจสอบ' },
  { id: 'ai-agents-automation', en: 'AI Agents & Automation', th: 'AI Agent และระบบอัตโนมัติ' },
  { id: 'ai-tools-development', en: 'AI Tools & Development', th: 'เครื่องมือ AI และการพัฒนา' },
  { id: 'ai-research-safety', en: 'AI Research & Safety', th: 'งานวิจัย AI และความปลอดภัย' },
  { id: 'ai-news-industry', en: 'AI News & Industry', th: 'ข่าว AI และอุตสาหกรรม' },
  { id: 'technology-daily-life', en: 'Technology in Daily Life', th: 'เทคโนโลยีในชีวิตประจำวัน' },
  { id: 'smart-buying', en: 'Smart Buying & Product Evaluation', th: 'คู่มือเลือกซื้อและประเมินสินค้า' },
  { id: 'ai-technology-history', en: 'AI & Technology History', th: 'ประวัติศาสตร์ AI และเทคโนโลยี' },
];
const childTopicId = 'hm:topic:verify-ai-work';
// Individually resolved in the connected read-only WordPress flow for the
// five user-specified pilot URLs. Other snapshot rows have no such observation.
const verifiedPublicIds = new Set([1077, 1073, 2241, 2310, 2494]);
const chapterId = slug => `hm:topic:${slug}`;
const chapterByName = new Map(chapters.map(c => [c.en, chapterId(c.id)]));
const thaiAliases = {
  'AI Foundations & Verification': ['พื้นฐาน AI', 'การตรวจสอบงาน AI'],
  'AI Agents & Automation': ['AI Agent', 'ระบบอัตโนมัติ'],
  'AI Tools & Development': ['เครื่องมือ AI', 'การพัฒนา AI'],
  'AI Research & Safety': ['งานวิจัย AI', 'ความปลอดภัย AI'],
  'AI News & Industry': ['ข่าว AI', 'อุตสาหกรรม AI'],
  'Technology in Daily Life': ['เทคโนโลยีในชีวิตประจำวัน'],
  'Smart Buying & Product Evaluation': ['คู่มือเลือกซื้อ', 'ประเมินสินค้า'],
  'AI & Technology History': ['ประวัติศาสตร์ AI', 'ประวัติศาสตร์เทคโนโลยี'],
};

const inventory = JSON.parse(await readFile(inventoryFile, 'utf8'));
const mapping = JSON.parse(await readFile(mappingFile, 'utf8'));
const pilot = JSON.parse(await readFile(pilotFile, 'utf8'));
const crossRows = (await readFile(crossListFile, 'utf8')).trim().split(/\r?\n/).slice(1);
const crossListedIds = new Set(crossRows.map(row => Number(row.split(',', 1)[0])).filter(Number.isInteger));
let oldCatalog = null;
try { oldCatalog = JSON.parse(await readFile(outputFile, 'utf8')); } catch {}

if (inventory.snapshot?.query_status !== 'publish' || inventory.snapshot?.coverage_complete !== true) {
  throw new Error('Input snapshot is not a complete published-only public inventory.');
}
const mappingByName = new Map(mapping.category_crosswalk.map(x => [x.current_category, x.proposed_chapter]));
const pilotById = new Map(pilot.articles.map(x => [x.article_id, x]));
const oldSections = new Map();
for (const section of oldCatalog?.sections ?? []) {
  const signature = `${section.article_id}|h${section.heading_level}|${section.heading_text}`;
  const bucket = oldSections.get(signature) ?? [];
  bucket.push(section.section_id);
  oldSections.set(signature, bucket);
}

const articles = inventory.articles.map(post => {
  const modified = post.modified_gmt ? new Date(post.modified_gmt + 'Z').toISOString() : null;
  const published = post.date_gmt ? new Date(post.date_gmt + 'Z').toISOString() : null;
  const passwordProtected = typeof post.password_protected === 'boolean' ? post.password_protected : verifiedPublicIds.has(post.id) ? false : null;
  const publishedSnapshot = post.status === 'publish' || (post.status == null && inventory.snapshot.query_status === 'publish');
  const article = {
    article_id: `hm:article:${post.id}`, wp_post_id: post.id,
    article_revision: modified ?? published ?? 'snapshot-unknown',
    canonical_url: post.url, title: post.title, summary: post.excerpt || null,
    locale: /[\u0E00-\u0E7F]/.test(post.title) ? 'th' : 'en',
    status: 'published',
    password_protected: passwordProtected,
    visibility: publishedSnapshot && passwordProtected === false ? 'public' : 'unknown',
    published_at: published, modified_at: modified,
    topic_ids: [], primary_topic_id: null,
    ...(crossListedIds.has(post.id) ? { inventory_flags: ['cross_listed_for_editorial_review'] } : {}),
    content_type: 'unknown', audience_level: 'unknown', content_state: 'review_needed',
    source_hash: /^[a-f0-9]{64}$/.test(post.source_hash ?? '') ? post.source_hash : null, schema_version: version,
  };
  return article;
});

const relationships = [];
for (const post of inventory.articles) {
  const articleId = `hm:article:${post.id}`;
  for (const category of [...new Set(post.categories ?? [])]) {
    const chapter = mappingByName.get(category);
    if (!chapter || chapter.includes('UNMAPPED')) continue;
    const target = chapterByName.get(chapter);
    if (!target) continue;
    relationships.push({
      relationship_id: `rel:category:${post.id}:${target.split(':').at(-1)}`,
      from_id: target, to_id: articleId, type: 'explains',
      rationale: `Proposed category crosswalk from source category ${category}; editorial review required.`,
      review_status: 'proposed', reviewer_id: null, created_at: inventory.snapshot.captured_at_utc, updated_at: null,
    });
  }
}
const pilotTypes = new Map([[1077, 'explains'], [1053, 'explains'], [1073, 'example'], [2241, 'example'], [2310, 'example'], [2494, 'example']]);
for (const [postId, item] of pilotById) {
  const post = inventory.articles.find(p => p.id === postId);
  if (!post) throw new Error(`Pilot mapping refers to missing public post ${postId}`);
  const relationType = pilotTypes.get(postId) ?? 'example';
  relationships.push({
    relationship_id: `rel:pilot:verify-ai-work:${postId}`,
    from_id: childTopicId, to_id: `hm:article:${postId}`, type: relationType,
    rationale: `Proposed full-read mapping for ${item.intent}: ${item.mapping} Limitations: ${item.limitations}`,
    review_status: 'proposed', reviewer_id: null, created_at: inventory.snapshot.captured_at_utc, updated_at: null,
  });
}

const sections = [];
for (const post of inventory.articles) {
  const articleId = `hm:article:${post.id}`;
  const rev = post.modified_gmt ? new Date(post.modified_gmt + 'Z').toISOString() : 'snapshot-unknown';
  let displayOrder = 0;
  for (const heading of post.headings ?? []) {
    if (![2, 3].includes(heading.level) || !heading.text?.trim()) continue;
    const signature = `${articleId}|h${heading.level}|${heading.text}`;
    const prior = oldSections.get(signature);
    const key = prior?.shift()?.split(':').at(-1) ?? `h-${randomUUID().replaceAll('-', '').slice(0, 16)}`;
    sections.push({
      section_id: `hm:section:${post.id}:${key}`, article_id: articleId,
      heading_text: heading.text, heading_level: heading.level,
      anchor: null, anchor_aliases: [], anchor_status: 'missing',
      summary: null, content_text: null, display_order: displayOrder++,
      article_revision: rev, schema_version: version,
    });
  }
}

const topics = [
  ...chapters.map(c => ({
    topic_id: chapterId(c.id), topic_revision: 1, parent_topic_id: null,
    label_th: c.th, label_en: c.en,
    definition: `Proposed textbook chapter crosswalk. Source WordPress categories are retained; chapter associations remain proposed until editorial review.`,
    search_aliases: (thaiAliases[c.en] ?? []).map(value => ({ value, locale: 'th' })),
    questions: [], audience_level: 'unknown',
    intent: `Proposed reader-facing chapter hub: ${c.en}.`,
    status: 'proposed', editorial_status: 'proposed',
  })),
  {
    topic_id: childTopicId, topic_revision: 1,
    parent_topic_id: chapterId('ai-foundations-verification'),
    label_th: 'ตรวจสอบงาน AI', label_en: 'Verifying AI Work',
    definition: 'Proposed pilot topic covering checks of AI answers, generated code, citations, document authorization and agent action approvals.',
    search_aliases: [{ value: 'ตรวจคำตอบ AI', locale: 'th' }, { value: 'ตรวจโค้ด AI', locale: 'th' }, { value: 'verify AI output', locale: 'en' }],
    questions: ['How can I check AI answers, numbers and citations?', 'How should AI-generated code be tested?', 'How can RAG citation freshness and access be checked?', 'How should agent approvals be bound to a specific action?'],
    audience_level: 'unknown', intent: 'Help readers evaluate AI outputs and gated actions using evidence and tests.',
    status: 'proposed', editorial_status: 'proposed',
  },
];
const catalog = {
  schema_version: version,
  snapshot: {
    source: 'wordpress_public_rest_api',
    source_url: `${inventory.snapshot.site}${inventory.snapshot.endpoint}`,
    captured_at: new Date(inventory.snapshot.captured_at_utc).toISOString(),
    coverage_complete: inventory.snapshot.coverage_complete,
    page_count: inventory.snapshot.reported_total_pages,
    published_total: inventory.snapshot.unique_records_collected,
    note: `Materialized offline from the attached anonymous public REST snapshot: ${articles.length} unique published posts across ${inventory.snapshot.reported_total_pages} pages. Runtime indexing must include only rows with visibility=public and password_protected=false. WordPress remains canonical for body HTML, Gutenberg media and interactives. Six full-read pilot edges are proposed, with each source limitation carried in rationale. Hashes are retained only when the source snapshot provides a raw-content hash.`,
  },
  articles, sections, topics, relationships,
  learning_paths: [{
    path_id: 'hm:path:verify-ai-work-basics', title: 'พื้นฐานการตรวจสอบงาน AI',
    audience: 'General readers and developers',
    goal: 'Learn evidence-based checks for AI outputs from proposed source candidates.',
    ordered_topic_ids: [childTopicId], estimated_minutes: null, prerequisites: [], status: 'proposed',
  }],
};
await mkdir(dirname(outputFile), { recursive: true });
const temp = `${outputFile}.tmp`;
await writeFile(temp, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
await rename(temp, outputFile);
console.log(JSON.stringify({
  output: outputFile, sourcePosts: inventory.snapshot.unique_records_collected,
  crossListedFlags: crossListedIds.size, articles: articles.length, sections: sections.length,
  topics: topics.length, relationships: relationships.length,
  coverageComplete: catalog.snapshot.coverage_complete,
}, null, 2));
