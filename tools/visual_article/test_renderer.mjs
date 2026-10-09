/**
 * Hybrid Mind — Visual Article v0.1 contract smoke tests.
 * Run locally: node --test tools/visual_article/test_renderer.mjs
 * No API credentials or remote calls required.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderGutenberg, validateManifest, escapeHTML } from "./render_gutenberg.mjs";

const fixture = JSON.parse(readFileSync(
  new URL("../../examples/ai-game-tools.visual-article.json", import.meta.url), "utf8"
));

test("validates typed A2A manifest as Draft", () => {
  assert.equal(validateManifest(fixture), true);
  assert.equal(fixture.status, "draft");
  assert.equal(fixture.gates.editorial, "PENDING");
  assert.equal(fixture.source_post_id, 52);
});

test("renders visual modules and keeps original narrative", () => {
  const html = renderGutenberg(fixture);
  assert.match(html, /<!-- wp:group/);
  for (const marker of [
    "hm-visual-article", "hm-va-full-image", "hm-va-summary",
    "hm-va-compare-card", "hm-va-process-card", "hm-va-decision-card",
    "hm-va-checklist", "hm-va-pullquote"
  ]) assert.ok(html.includes(marker), marker);
  assert.ok(html.includes("wp-image-51"));
  assert.ok(html.includes("หลังจากที่ผมทดลองสร้างเกมด้วย AI"));
  assert.ok(html.includes("Tool Selection และ System Architecture"));
  assert.equal((html.match(/<!-- wp:paragraph/g) || []).length >= 63, true);
  assert.equal(html.includes("<script"), false);
});

test("escapes untrusted article text instead of rendering HTML", () => {
  const copy = structuredClone(fixture);
  const chapter = copy.modules.find(m => m.type === "narrative");
  chapter.paragraphs[0] = '<img src=x onerror="alert(1)"> & fine';
  const html = renderGutenberg(copy);
  assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
  assert.equal(html.includes('<img src=x onerror="alert(1)">'), false);
  assert.equal(escapeHTML("<script>"), "&lt;script&gt;");
});

test("does not render a publish-status manifest", () => {
  const copy = structuredClone(fixture);
  copy.status = "publish";
  assert.throws(() => renderGutenberg(copy), /only DRAFT/);
});

test("rejects duplicate or unknown A2A modules", () => {
  const copy = structuredClone(fixture);
  copy.modules.push(structuredClone(copy.modules[0]));
  assert.throws(() => validateManifest(copy), /duplicate module/);
  copy.modules.pop();
  copy.modules[0].type = "unsafe-raw-html";
  assert.throws(() => renderGutenberg(copy), /unsupported visual module/);
});

test("rejects unsafe/offsite image URLs", () => {
  const copy = structuredClone(fixture);
  const image = copy.modules.find(m => m.type === "image");
  image.src = "https://example.org/image.png";
  assert.throws(() => validateManifest(copy), /image must come from Hybrid Mind/);
  image.src = "javascript:alert(1)";
  assert.throws(() => renderGutenberg(copy), /HTTPS URL required/);
});

test("rejects fabricated verified claims with no sources", () => {
  const copy = structuredClone(fixture);
  copy.claims[0].status = "verified";
  copy.claims[0].source_ids = [];
  assert.throws(() => validateManifest(copy), /verified claim missing source/);
});

test("produces deterministic Gutenberg for the same manifest", () => {
  const a = renderGutenberg(fixture);
  const b = renderGutenberg(structuredClone(fixture));
  assert.equal(a, b);
});
