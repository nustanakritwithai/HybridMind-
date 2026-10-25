import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));

function typeMatches(value, expected) {
  const types = Array.isArray(expected) ? expected : [expected];
  return types.some(type => type === 'null' ? value === null : type === 'array' ? Array.isArray(value) : type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value) : type === 'integer' ? Number.isInteger(value) : typeof value === type);
}

export function validateCatalog(catalog, schema) {
  const errors = [];
  function check(value, spec, path) {
    if (spec.$ref) {
      const ref = spec.$ref.replace(/^#\//, '').split('/').reduce((node, key) => node?.[key], schema);
      if (!ref) { errors.push(`${path}: unresolved schema ref ${spec.$ref}`); return; }
      return check(value, ref, path);
    }
    if (spec.type && !typeMatches(value, spec.type)) { errors.push(`${path}: expected ${Array.isArray(spec.type) ? spec.type.join('|') : spec.type}`); return; }
    if ('const' in spec && value !== spec.const) errors.push(`${path}: expected constant ${JSON.stringify(spec.const)}`);
    if (spec.enum && !spec.enum.includes(value)) errors.push(`${path}: value is outside the enum`);
    if (typeof value === 'string') {
      if (spec.minLength && value.length < spec.minLength) errors.push(`${path}: shorter than minLength`);
      if (spec.pattern && !new RegExp(spec.pattern).test(value)) errors.push(`${path}: does not match ${spec.pattern}`);
      if (spec.format === 'uri') { try { new URL(value); } catch { errors.push(`${path}: invalid URI`); } }
      if (spec.format === 'date-time' && Number.isNaN(Date.parse(value))) errors.push(`${path}: invalid date-time`);
    }
    if (typeof value === 'number') {
      if (spec.minimum !== undefined && value < spec.minimum) errors.push(`${path}: below minimum`);
    }
    if (Array.isArray(value)) {
      if (spec.uniqueItems && new Set(value.map(item => JSON.stringify(item))).size !== value.length) errors.push(`${path}: duplicate array items`);
      if (spec.items) value.forEach((item, index) => check(item, spec.items, `${path}[${index}]`));
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const key of spec.required ?? []) if (!(key in value)) errors.push(`${path}.${key}: required property is missing`);
      if (spec.additionalProperties === false && spec.properties) for (const key of Object.keys(value)) if (!(key in spec.properties)) errors.push(`${path}.${key}: unexpected property`);
      for (const [key, child] of Object.entries(spec.properties ?? {})) if (key in value) check(value[key], child, `${path}.${key}`);
    }
  }
  check(catalog, schema, '$');

  const articleIds = new Set(catalog.articles.map(x => x.article_id));
  const topicIds = new Set(catalog.topics.map(x => x.topic_id));
  const sectionIds = new Set();
  const relationshipIds = new Set();
  const unique = (rows, key, label) => {
    const values = rows.map(x => x[key]);
    if (new Set(values).size !== values.length) errors.push(`${label}: duplicate ${key}`);
  };
  unique(catalog.articles, 'article_id', 'articles');
  unique(catalog.articles, 'wp_post_id', 'articles');
  unique(catalog.topics, 'topic_id', 'topics');
  unique(catalog.relationships, 'relationship_id', 'relationships');
  for (const article of catalog.articles) {
    if (article.password_protected === false && article.visibility !== 'public') errors.push(`${article.article_id}: verified unprotected row is not public`);
    if (article.password_protected !== false && article.visibility === 'public') errors.push(`${article.article_id}: public row lacks explicit password=false`);
    for (const id of article.topic_ids) if (!topicIds.has(id)) errors.push(`${article.article_id}: unknown topic ${id}`);
    if (article.primary_topic_id && !topicIds.has(article.primary_topic_id)) errors.push(`${article.article_id}: unknown primary topic`);
  }
  for (const section of catalog.sections) {
    if (!articleIds.has(section.article_id)) errors.push(`${section.section_id}: unknown article ${section.article_id}`);
    if (sectionIds.has(section.section_id)) errors.push(`${section.section_id}: duplicate section id`);
    sectionIds.add(section.section_id);
    if (section.anchor_status === 'verified' && !section.anchor) errors.push(`${section.section_id}: verified anchor is empty`);
  }
  const entityIds = new Set([...articleIds, ...topicIds]);
  for (const relation of catalog.relationships) {
    relationshipIds.add(relation.relationship_id);
    if (!entityIds.has(relation.from_id) || !entityIds.has(relation.to_id)) errors.push(`${relation.relationship_id}: relationship endpoint is missing`);
  }
  for (const topic of catalog.topics) if (topic.parent_topic_id && !topicIds.has(topic.parent_topic_id)) errors.push(`${topic.topic_id}: unknown parent topic`);
  for (const path of catalog.learning_paths) for (const topicId of path.ordered_topic_ids) if (!topicIds.has(topicId)) errors.push(`${path.path_id}: unknown topic ${topicId}`);
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const offlinePath = resolve(root, 'offline/pilot-catalog-full.json');
  const catalogPath = existsSync(offlinePath) ? offlinePath : resolve(root, 'data/pilot-catalog.json');
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const schema = JSON.parse(await readFile(resolve(root, 'contracts/knowledge-textbook-v1.schema.json'), 'utf8'));
  const errors = validateCatalog(catalog, schema);
  if (errors.length) { process.stderr.write(`${errors.join('\n')}\n`); process.exitCode = 1; }
  else process.stdout.write(`Catalog valid: ${catalog.articles.length} articles, ${catalog.topics.length} topics, ${catalog.sections.length} sections, ${catalog.relationships.length} proposed relationships.\n`);
}
