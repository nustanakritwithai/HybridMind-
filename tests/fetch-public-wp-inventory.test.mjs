import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { capturePublicWpInventory, RateLimitPause } from '../scripts/fetch-public-wp-inventory.mjs';

test('public capture checkpoints after each page, pauses on 429, and excludes unknown/protected bodies', async () => {
  let pageTwoLimited = true;
  const requests = [];
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    requests.push({ method: req.method, url: url.pathname, authorization: req.headers.authorization });
    res.setHeader('Content-Type', 'application/json');
    if (url.pathname === '/wp-json/wp/v2/posts/1') {
      res.end(JSON.stringify({ id: 1, status: 'publish', password_protected: false,
        excerpt: { rendered: '<p>Verified excerpt</p>' }, content: { rendered: '<h2>First &amp; checked</h2><h3>Second <em>heading</em></h3><script><h2>Do not index</h2></script>' } }));
      return;
    }
    if (url.pathname === '/wp-json/wp/v2/posts') {
      const page = Number(url.searchParams.get('page'));
      if (page === 1) {
        res.setHeader('X-WP-Total', '3'); res.setHeader('X-WP-TotalPages', '2');
        res.end(JSON.stringify([
          { id: 1, status: 'publish', password_protected: false, link: 'https://example.test/1', title: { rendered: 'Public One' }, excerpt: { rendered: 'must defer' }, categories: [10] },
          { id: 2, status: 'publish', password_protected: null, link: 'https://example.test/2', title: { rendered: 'Unknown Two' }, excerpt: { rendered: 'must not persist' }, categories: [10] },
        ]));
        return;
      }
      if (pageTwoLimited) { pageTwoLimited = false; res.statusCode = 429; res.setHeader('Retry-After', '0'); res.end('{}'); return; }
      res.end(JSON.stringify([{ id: 3, status: 'publish', password_protected: true, link: 'https://example.test/3', title: { rendered: 'Protected Three' }, excerpt: { rendered: 'do not persist' }, categories: [10] }]));
      return;
    }
    if (url.pathname === '/wp-json/wp/v2/categories') {
      res.setHeader('X-WP-TotalPages', '1');
      res.end(JSON.stringify([{ id: 10, name: 'AI &amp; Knowledge', slug: 'ai-knowledge', count: 3 }]));
      return;
    }
    res.statusCode = 404; res.end('{}');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/wp-json/wp/v2`;
  const temp = await mkdtemp(join(tmpdir(), 'hm-wp-inventory-test-'));
  const checkpointPath = join(temp, 'checkpoint.json'), outputPath = join(temp, 'inventory.json');
  try {
    await assert.rejects(capturePublicWpInventory({ baseUrl, checkpointPath, outputPath, delayMs: 0 }), RateLimitPause);
    const checkpoint = JSON.parse(await readFile(checkpointPath, 'utf8'));
    assert.equal(checkpoint.next_post_page, 2);
    assert.equal(Object.keys(checkpoint.post_pages).length, 1);

    const { inventory } = await capturePublicWpInventory({ baseUrl, checkpointPath, outputPath, delayMs: 0 });
    assert.equal(inventory.snapshot.coverage_complete, true);
    assert.equal(inventory.articles.length, 3);
    const verified = inventory.articles.find(article => article.id === 1);
    assert.equal(verified.visibility, 'public');
    assert.equal(verified.excerpt, 'Verified excerpt');
    assert.deepEqual(verified.headings, [{ level: 2, text: 'First & checked' }, { level: 3, text: 'Second heading' }]);
    assert.match(verified.source_hash, /^[a-f0-9]{64}$/);
    for (const article of inventory.articles.filter(item => item.id !== 1)) {
      assert.equal(article.excerpt, null);
      assert.deepEqual(article.headings, []);
      assert.equal(article.source_hash, null);
      assert.equal(article.visibility, 'unknown');
    }
    assert.ok(!requests.some(request => request.url.endsWith('/posts/2') || request.url.endsWith('/posts/3')));
    assert.ok(requests.every(request => request.method === 'GET' && !request.authorization));
    assert.equal(inventory.articles[0].categories[0], 'AI & Knowledge');
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(temp, { recursive: true, force: true });
  }
});
