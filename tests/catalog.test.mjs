import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { validateCatalog } from '../scripts/validate-catalog.mjs';
import { projectPublicCatalog } from '../scripts/public-projection.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const offlinePath = resolve(root, 'offline/pilot-catalog-full.json');
const catalogPath = existsSync(offlinePath) ? offlinePath : resolve(root, 'data/pilot-catalog.json');
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const schema = JSON.parse(await readFile(resolve(root, 'contracts/knowledge-textbook-v1.schema.json'), 'utf8'));

test('catalog conforms to schema and all stable references resolve', () => {
  assert.deepEqual(validateCatalog(catalog, schema), []);
});

test('snapshot unknown visibility is retained for coverage but cannot enter the public index', () => {
  let expectedUnverifiedRows;
  if (catalog.articles.length > 5) {
    assert.equal(catalog.articles.length, 248);
    assert.equal(catalog.articles.filter(a => a.password_protected === false && a.visibility === 'public').length, 5);
    assert.equal(catalog.articles.filter(a => a.password_protected === null && a.visibility === 'unknown').length, 243);
    expectedUnverifiedRows = 243;
  } else {
    assert.equal(catalog.articles.length, 5);
    assert.ok(catalog.articles.every(a => a.status === 'published' && a.visibility === 'public' && a.password_protected === false));
    expectedUnverifiedRows = 0;
  }
  assert.equal(catalog.articles.filter(a => a.password_protected !== false || a.visibility !== 'public').length, expectedUnverifiedRows);
});

test('public projection removes unknown records, their sections, and their relationship edges', () => {
  const projected = projectPublicCatalog(catalog);
  assert.equal(projected.articles.length, 5);
  assert.ok(projected.articles.every(a => a.visibility === 'public' && a.password_protected === false));
  const articleIds = new Set(projected.articles.map(a => a.article_id));
  const topicIds = new Set(projected.topics.map(t => t.topic_id));
  assert.ok(projected.sections.every(s => articleIds.has(s.article_id)));
  assert.ok(projected.relationships.every(r => (articleIds.has(r.from_id) || topicIds.has(r.from_id)) && (articleIds.has(r.to_id) || topicIds.has(r.to_id))));
  assert.deepEqual(validateCatalog(projected, schema), []);
});
