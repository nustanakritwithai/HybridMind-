import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateCatalog } from './validate-catalog.mjs';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const files = [
  'scripts/fetch-public-wp-inventory.mjs', 'scripts/ingest-public-wp.mjs', 'scripts/serve-pilot.mjs', 'scripts/validate-catalog.mjs', 'scripts/lint-pilot.mjs', 'scripts/build-pilot.mjs',
  'search/local-search.mjs', 'search/safe-url.mjs', 'search/meilisearch-adapter.mjs', 'search/typesense-adapter.mjs',
  'scripts/public-projection.mjs', 'scripts/content-integrity.mjs', 'scripts/import-structured-content.mjs', 'knowledge-textbook/content-renderer.mjs',
  'tests/fetch-public-wp-inventory.test.mjs', 'tests/search.test.mjs', 'tests/evaluate-search.mjs', 'tests/catalog.test.mjs', 'tests/reader-browser.test.mjs', 'tests/server.test.mjs', 'tests/content-renderer.test.mjs',
  'knowledge-textbook/app.js',
];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${file}: ${result.stderr || result.stdout}`);
}
const offlinePath = join(root, 'offline/pilot-catalog-full.json');
const catalogPath = existsSync(offlinePath) ? offlinePath : join(root, 'data/pilot-catalog.json');
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const schema = JSON.parse(await readFile(join(root, 'contracts/knowledge-textbook-v1.schema.json'), 'utf8'));
const errors = validateCatalog(catalog, schema);
if (errors.length) throw new Error(errors.join('\n'));
const verified = catalog.articles.filter(article => article.password_protected === false && article.visibility === 'public').length;
const unknown = catalog.articles.filter(article => article.password_protected === null && article.visibility === 'unknown').length;
if (catalog.articles.length > 5 && (verified !== 5 || unknown !== 243)) throw new Error(`Expected 5 verified and 243 unknown visibility rows, got ${verified} / ${unknown}`);
if (catalog.articles.length <= 5 && (verified !== catalog.articles.length || unknown !== 0)) throw new Error('Client catalog must contain only explicitly verified public rows.');
process.stdout.write(`Lint passed (${files.length} JavaScript files); schema and reference checks passed.\n`);
