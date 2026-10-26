import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('server exposes only fixed assets and an explicitly public catalog projection', async t => {
  const child = spawn(process.execPath, ['scripts/serve-pilot.mjs'], {
    cwd: root, env: { ...process.env, HM_PILOT_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  child.stdout.on('data', chunk => { stdout += chunk.toString(); });
  child.stderr.on('data', chunk => { stdout += chunk.toString(); });
  t.after(() => { if (child.exitCode === null) child.kill(); });
  const started = Date.now();
  let address;
  while (!address && Date.now() - started < 5000) {
    if (child.exitCode !== null) throw new Error(`Server exited early: ${stdout}`);
    address = stdout.match(/http:\/\/127\.0\.0\.1:(\d+)\/knowledge-textbook\//)?.[0]?.replace('/knowledge-textbook/', '');
    if (!address) await delay(40);
  }
  assert.ok(address, `Server did not announce its loopback address: ${stdout}`);

  const response = await fetch(`${address}/data/pilot-catalog.json`);
  assert.equal(response.status, 200);
  const catalog = await response.json();
  assert.equal(catalog.articles.length, 8);
  assert.ok(catalog.articles.every(a => a.status === 'published' && a.visibility === 'public' && a.password_protected === false));
  assert.ok(!JSON.stringify(catalog).includes('hm:article:1053'));
  assert.ok(catalog.sections.every(section => catalog.articles.some(article => article.article_id === section.article_id)));
  const allowedEntities = new Set([...catalog.articles.map(a => a.article_id), ...catalog.topics.map(t => t.topic_id)]);
  assert.ok(catalog.relationships.every(r => allowedEntities.has(r.from_id) && allowedEntities.has(r.to_id)));

  for (const path of [
    '/offline/pilot-catalog-full.json',
    '/data/pilot-catalog-full.json',
    '/data/wp-public-inventory-checkpoint.json',
    '/reference/inventory/knowledge-inventory/inventory.json',
    '/scripts/ingest-public-wp.mjs',
    '/%2e%2e/offline/pilot-catalog-full.json',
  ]) assert.equal((await fetch(`${address}${path}`)).status, 404, path);
  assert.equal((await fetch(`${address}/search/safe-url.mjs`)).status, 200);
  assert.equal((await fetch(`${address}/knowledge-textbook/content-renderer.mjs`)).status, 200);
  const contentResponse = await fetch(`${address}/data/pilot-content-bundle.json`);
  assert.equal(contentResponse.status, 200);
  const bundle = await contentResponse.json();
  assert.equal(bundle.articles.length, 8);
  assert.ok(bundle.articles.every(entry => entry.blocks[0].html.length > 20000));
  const asset = bundle.articles[0].media[0];
  const image = await fetch(new URL(asset.local_src, `${address}/knowledge-textbook/`));
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), asset.mime_type);
  assert.equal((await image.arrayBuffer()).byteLength, asset.byte_length);
  for (const path of ['/assets/media/../../offline/pilot-catalog-full.json','/assets/media/1075.svg','/assets/media/media-1075.json']) assert.equal((await fetch(`${address}${path}`)).status, 404);
  assert.equal((await fetch(`${address}/data/pilot-catalog.json`, { method: 'POST' })).status, 405);
});
