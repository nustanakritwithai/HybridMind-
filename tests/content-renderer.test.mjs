import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { renderStructuredContent, safeContentLinkUrl, safeContentUrl, validateContentBundle, validateStructuredContent } from '../knowledge-textbook/content-renderer.mjs';
import { importStructuredExport, normalizeExportBlock } from '../scripts/import-structured-content.mjs';
import { computeContentDigest, sha256Hex, verifyContentBundleDigests, verifyContentDigest } from '../scripts/content-integrity.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = JSON.parse(await readFile(resolve(root, 'tests/fixtures/structured-content-fixture.json'), 'utf8'));
const offlineCatalogPath = resolve(root, 'offline/pilot-catalog-full.json');
const catalogPath = (await import('node:fs')).existsSync(offlineCatalogPath) ? offlineCatalogPath : resolve(root, 'data/pilot-catalog.json');
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));

class NodeMock {
  constructor(tagName = '#text', text = '') { this.tagName = tagName; this.textContent = text; this.children = []; this.attrs = {}; this.dataset = {}; }
  append(...nodes) { this.children.push(...nodes); }
  setAttribute(name, value) { this.attrs[name] = value; }
}
const documentMock = { createElement: tag => new NodeMock(tag), createTextNode: text => new NodeMock('#text', text) };

test('fixture exercises every supported block and is explicitly synthetic', () => {
  assert.equal(fixture.provenance, 'test_fixture');
  assert.match(fixture.fixture_notice, /Synthetic.*not.*article content/i);
  assert.deepEqual(new Set(fixture.blocks.map(b => b.type)), new Set(['heading','paragraph','list','quote','code','image','interactive_fallback']));
  assert.equal(verifyContentDigest(fixture), fixture);
  assert.equal(fixture.source_hash, null);
  assert.equal(fixture.source_hash_status, 'unverified');
  assert.equal(validateStructuredContent(fixture, { catalog, allowFixture: true }), fixture);
  assert.throws(() => validateStructuredContent(fixture, { catalog }), /not permitted/);
  assert.throws(() => validateContentBundle({ schema_version: '1.0.0', articles: [fixture] }, { catalog }), /not permitted/);
});

test('renderer creates only text and allowlisted elements; untrusted text remains inert', () => {
  const tree = renderStructuredContent(fixture, { document: documentMock, sourceArticle: catalog.articles.find(a => a.article_id === fixture.article_id) });
  assert.deepEqual(tree.children.map(node => node.tagName), ['h2','p','ol','blockquote','pre','figure','aside']);
  const paragraph = tree.children[1];
  assert.equal(paragraph.children[0].textContent, fixture.blocks[1].text.slice(0,74));
  const link = paragraph.children[1];
  assert.equal(link.tagName, 'a');
  assert.equal(link.href, 'https://example.org/citation');
  assert.equal(link.target, '_blank');
  assert.equal(link.rel, 'noopener noreferrer');
  assert.equal(paragraph.children[2].textContent, fixture.blocks[1].text.slice(97));
  assert.equal(tree.children[4].children[0].textContent, fixture.blocks[4].code);
  assert.equal(tree.children[5].children[0].src, fixture.blocks[5].src);
  assert.equal(tree.children[6].children[0].textContent, fixture.blocks[6].label);
  assert.ok(!('innerHTML' in tree));
});

test('URL policy rejects unsafe links, hosts, credentials, ports and image paths', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,hi', 'http://hybridmind.online/a', '//hybridmind.online/a', 'https://evil.test/a', 'https://sub.hybridmind.online/a', 'https://user@hybridmind.online/a', 'https://hybridmind.online:444/a']) assert.equal(safeContentUrl(url), null, url);
  assert.equal(safeContentUrl('https://hybridmind.online/ordinary-image.png', { image: true }), null);
  assert.equal(safeContentUrl('https://hybridmind.online/wp-content/uploads/photo.png', { image: true }), 'https://hybridmind.online/wp-content/uploads/photo.png');
  assert.equal(safeContentLinkUrl('https://example.org/citation'), 'https://example.org/citation');
  for (const url of ['javascript:alert(1)', 'data:text/html,hi', 'http://example.org/a', 'https://user@example.org/a', 'https://example.org:444/a']) assert.equal(safeContentLinkUrl(url), null, url);
});

test('malicious block URLs are rejected and source metadata must match public projection', () => {
  for (const bad of [
    { ...fixture, blocks: [{ type: 'paragraph', text: 'x', links: [{ text: 'x', url: 'javascript:alert(1)' }] }] },
    { ...fixture, blocks: [{ type: 'paragraph', text: 'citation here', links: [{ text: 'citation', url: 'https://example.org/', start: 1, end: 4 }] }] },
    { ...fixture, blocks: [{ type: 'image', src: 'https://evil.test/wp-content/uploads/a.png', alt: 'x' }] },
    { ...fixture, blocks: [{ type: 'mystery', html: '<script/>' }] },
    { ...fixture, source_hash: 'not-a-hash' },
    { ...fixture, imported_at: 'yesterday' },
    { ...fixture, canonical_url: 'https://evil.test/article' },
    { ...fixture, source_revision: 'stale' },
  ]) assert.throws(() => validateStructuredContent(bad, { catalog, allowFixture: true }));
  assert.throws(() => verifyContentDigest({ ...fixture, blocks: [{ type: 'paragraph', text: 'tampered fixture content' }] }), /digest mismatch/i);
  assert.throws(() => validateContentBundle({ schema_version: '1.0.0', articles: [fixture, fixture] }, { catalog, allowFixture: true }), /duplicate/);
});

test('importer normalizes Gutenberg blocks and maps unknown block to static fallback without HTML', () => {
  const normalized = importStructuredExport({
    ...fixture, provenance: 'wordpress_export', fixture_notice: undefined, source_hash: `sha256:${'a'.repeat(64)}`,
    blocks: [{ blockName: 'core/heading', attrs: { level: 2, anchor: 'from-export' }, text: 'Heading' }, { blockName: 'hm/live-quiz', innerHTML: '<script>run()</script>' }],
  }, catalog);
  assert.deepEqual(normalized.blocks[0], { type: 'heading', level: 2, text: 'Heading', anchor: 'from-export' });
  assert.equal(normalized.blocks[1].type, 'interactive_fallback');
  assert.equal(JSON.stringify(normalized).includes('<script>'), false);
  assert.equal(normalized.source_hash, null);
  assert.equal(normalized.source_hash_status, 'unverified');
  assert.equal(verifyContentDigest(normalized), normalized);
  assert.equal(computeContentDigest(Object.fromEntries(Object.entries(normalized).reverse())), normalized.content_digest, 'top-level property ordering must not change the canonical digest');
  assert.throws(() => verifyContentBundleDigests({ schema_version: '1.0.0', articles: [{ ...normalized, blocks: [{ type: 'paragraph', text: 'tampered after import' }] }] }), /digest mismatch/i);

  const rawBytes = Buffer.from('exact original WordPress export bytes', 'utf8');
  const verified = importStructuredExport({
    ...fixture, provenance: 'wordpress_export', fixture_notice: undefined,
    source_payload_base64: rawBytes.toString('base64'), source_hash: `sha256:${sha256Hex(rawBytes)}`,
    blocks: [{ blockName: 'core/paragraph', text: 'Verified payload' }],
  }, catalog);
  assert.equal(verified.source_hash, `sha256:${sha256Hex(rawBytes)}`);
  assert.equal(verified.source_hash_status, 'verified');
  assert.throws(() => importStructuredExport({
    ...fixture, provenance: 'wordpress_export', fixture_notice: undefined,
    source_payload_base64: rawBytes.toString('base64'), source_hash: `sha256:${'0'.repeat(64)}`,
    blocks: [{ blockName: 'core/paragraph', text: 'Verified payload' }],
  }, catalog), /does not match source_payload_base64/);
  assert.throws(() => importStructuredExport({ ...fixture, provenance: 'test_fixture' }, catalog), /Only wordpress_export/);
  assert.throws(() => importStructuredExport({ ...fixture, provenance: 'wordpress_export', source_revision: 'stale', fixture_notice: undefined }, catalog), /source_revision/);
});

test('normalizer preserves only supported fields and defaults unknown Gutenberg types safely', () => {
  const output = normalizeExportBlock({ blockName: 'core/widget', innerHTML: '<img onerror=x>', html: '<script>x</script>' });
  assert.equal(output.type, 'interactive_fallback');
  assert.equal(JSON.stringify(output).includes('script'), false);
});
