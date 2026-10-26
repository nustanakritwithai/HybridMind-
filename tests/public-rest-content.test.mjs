import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyContentBundleDigests, sha256Hex, verifyContentDigest } from '../scripts/content-integrity.mjs';
import { validateContentBundle } from '../knowledge-textbook/content-renderer.mjs';
import { searchCatalog } from '../search/local-search.mjs';
import { applyContentRevisionOverlay } from '../scripts/content-revision-overlay.mjs';
const root = fileURLToPath(new URL('..', import.meta.url));
const readJson = async path => JSON.parse(await readFile(resolve(root,path),'utf8'));
const bundle = await readJson(existsSync(resolve(root,'offline/pilot-content-bundle.json')) ? 'offline/pilot-content-bundle.json' : 'data/pilot-content-bundle.json');
const base = await readJson(existsSync(resolve(root,'offline/pilot-catalog-full.json')) ? 'offline/pilot-catalog-full.json' : 'data/pilot-catalog.json');
const overlayPath = resolve(root,'offline/public-rest-revision-overlay.json');
const catalog = applyContentRevisionOverlay(base, existsSync(overlayPath) ? await readJson('offline/public-rest-revision-overlay.json') : null);

test('eight full public bodies retain exact REST rendered bytes, canonical identity and UTC revision', async () => {
  validateContentBundle(bundle,{catalog}); verifyContentBundleDigests(bundle);
  assert.deepEqual(bundle.articles.map(entry=>entry.article_id).sort(),[1073,1077,1740,1755,1770,2241,2310,2494].map(id=>`hm:article:${id}`));
  for(const entry of bundle.articles) {
    const capture=[1740,1755,1770].some(id=>entry.article_id===`hm:article:${id}`) ? '2026-10-26' : '2026-10-25';
    const sourcePath=`reference/source-exports/public-rest-${capture}/post-${entry.article_id.split(':').at(-1)}.json`;
    if(existsSync(resolve(root,sourcePath))) {
      const source=await readJson(sourcePath);
      assert.equal(source.status,'publish'); assert.equal(source.content.protected,false);
      assert.equal(entry.blocks[0].html,source.content.rendered);
      assert.equal(entry.canonical_url,source.link);
      assert.equal(entry.source_revision,new Date(source.modified_gmt+'Z').toISOString());
    }
    assert.ok(Buffer.byteLength(entry.blocks[0].html,'utf8')>45000);
    assert.equal(entry.source_hash,'sha256:'+sha256Hex(Buffer.from(entry.blocks[0].html,'utf8')));
    const changed=structuredClone(entry); changed.blocks[0].html+=' altered';
    assert.throws(()=>verifyContentDigest(changed),/hash mismatch/);
  }
});

test('all 35 local image files match recorded hashes and every inline source image has metadata', async () => {
  const ids=new Set(); let inlineCount=0;
  for(const entry of bundle.articles) {
    const inline=[...entry.blocks[0].html.matchAll(/<img\b[^>]*data-attachment-id="(\d+)"/gi)].map(match=>Number(match[1]));
    inlineCount+=inline.length;
    for(const id of inline) assert.ok(entry.media.some(media=>media.attachment_id===id && media.alt_text));
    for(const media of entry.media) {
      ids.add(media.attachment_id);
      const bytes=await readFile(resolve(root,'knowledge-textbook',media.local_src));
      assert.equal(bytes.length,media.byte_length); assert.equal('sha256:'+sha256Hex(bytes),media.sha256);
    }
  }
  assert.equal(ids.size,35); assert.equal(inlineCount,33);
});

test('public body keyword search finds code details without indexing script or navigation content', () => {
  const found=searchCatalog(catalog,'shipping_fee',{},bundle.articles);
  assert.ok(found.results.some(result=>result.id==='hm:article:1073'));
  const entry=structuredClone(bundle.articles[0]);
  entry.blocks=[{type:'html_fragment',html:'<script>hiddenpayload secretmarker</script><nav>navigationpayload secretmarker</nav><p>visiblebody uniqueterm</p>'}];
  assert.ok(searchCatalog(catalog,'visiblebody uniqueterm',{},[entry]).results.some(result=>result.id===entry.article_id));
  assert.equal(searchCatalog(catalog,'hiddenpayload secretmarker',{},[entry]).total,0);
  assert.equal(searchCatalog(catalog,'navigationpayload secretmarker',{},[entry]).total,0);
});
