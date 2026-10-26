import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const site = resolve(root, 'dist/pages');
test('Pages artifact preserves the existing root and contains only the public runtime', async () => {
  assert.deepEqual(await readFile(resolve(site, 'index.html')), await readFile(resolve(root, 'index.html')));
  assert.deepEqual((await readdir(site)).sort(), ['.nojekyll','assets','data','index.html','knowledge-textbook','release.json','search']);
  const release = JSON.parse(await readFile(resolve(site, 'release.json'), 'utf8'));
  assert.match(release.source_commit, /^[a-f0-9]{40}$/);
  assert.equal(release.interactive_parity, false);
  assert.equal(release.interactive_mode,'reviewed-local-modules');
  assert.equal(release.reviewed_lab_roots,12);
  assert.equal(Object.keys(release.sha256).length,59);
  for (const [name, hash] of Object.entries(release.sha256)) assert.equal(createHash('sha256').update(await readFile(resolve(site, name))).digest('hex'), hash, name);
  const catalog = JSON.parse(await readFile(resolve(site, 'data/pilot-catalog.json'), 'utf8'));
  assert.equal(catalog.articles.length, 8);
  assert.ok(catalog.articles.every(a => a.visibility === 'public' && a.password_protected === false));
  assert.equal((await readdir(resolve(site, 'assets/media'))).length, 35);
  const html = await readFile(resolve(site, 'knowledge-textbook/index.html'), 'utf8');
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /script-src 'self'/);
});
