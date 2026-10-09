/**
 * Hybrid Mind Visual-Article Renderer v0.1.
 * A2A agents submit strictly typed JSON manifests, never arbitrary Gutenberg HTML.
 * This module emits editable core Gutenberg blocks and always stays in Draft mode.
 * Usage: node tools/visual_article/render_gutenberg.mjs input.json output.html
 */
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const TYPES = new Set(["summary", "comparison", "process", "decision", "checklist", "quote", "narrative", "image"]);
const CATEGORIES = new Set(["ai-news", "explained", "future-lifestyle", "smart-buying"]);
const COLORS = Object.freeze({
  navy: ["theme-4", "theme-1"],
  light: ["theme-2", "theme-5"],
  white: ["theme-1", "theme-4"],
  cyan: ["vivid-cyan-blue", "theme-5"]
});

function requireCondition(condition, reason) {
  if (!condition) throw new Error("Visual Article rejected: " + reason);
}

const str = (value) => String(value ?? "");
export function escapeHTML(value) {
  return str(value).replace(/[&<>"']/g, (x) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[x]);
}
function httpsUrl(value, onsite = false) {
  const url = new URL(str(value));
  requireCondition(url.protocol === "https:", "HTTPS URL required");
  if (onsite) {
    requireCondition(url.origin === "https://hybridmind.online", "image must come from Hybrid Mind media library");
    requireCondition(url.pathname.startsWith("/wp-content/uploads/"), "image must be an uploaded WordPress asset");
  }
  return escapeHTML(url.toString());
}

function asArray(value, label) {
  requireCondition(Array.isArray(value), label + " must be an array");
  return value;
}
function shortText(value, label, min = 1, max = 18000) {
  requireCondition(typeof value === "string" && value.trim().length >= min && value.length <= max, label + " missing or too long");
  return value;
}

export function validateManifest(m) {
  requireCondition(m && typeof m === "object" && !Array.isArray(m), "root object required");
  requireCondition(m.schema_version === "hm-va/0.1", "unsupported schema version");
  requireCondition(m.status === "draft", "only DRAFT manifests may be rendered");
  requireCondition(m.language === "th", "expected Thai");
  requireCondition(CATEGORIES.has(m.category), "unknown category");
  requireCondition(/^hm-[a-z0-9-]{6,80}$/.test(str(m.article_id)), "invalid article id");
  requireCondition(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(str(m.slug)), "invalid URL slug");
  shortText(m.title, "title", 10, 220);
  shortText(m.dek, "dek", 25, 800);
  requireCondition(Number.isInteger(m.featured_media_id) && m.featured_media_id >= 0, "invalid featured media");
  requireCondition(Number.isInteger(m.source_post_id) && m.source_post_id >= 0, "invalid source post");
  const sources = asArray(m.sources, "sources");
  const sourceIds = new Set();
  for (const s of sources) {
    requireCondition(/^src-[a-z0-9-]{2,80}$/.test(str(s.id)) && !sourceIds.has(s.id), "invalid or duplicate source ID");
    shortText(s.title, "source title", 1, 400);
    httpsUrl(s.url);
    sourceIds.add(s.id);
  }
  for (const c of asArray(m.claims, "claims")) {
    shortText(c.text, "claim text", 1, 400);
    requireCondition(["verified", "vendor-claim", "unverified", "opinion", "owner-experience"].includes(c.status), "invalid claim status");
    for (const ref of asArray(c.source_ids, "claim source IDs")) requireCondition(sourceIds.has(ref), "claim references missing source");
    if (c.status === "verified") requireCondition(c.source_ids.length > 0, "verified claim missing source");
  }
  const modules = asArray(m.modules, "modules");
  requireCondition(modules.length >= 3 && modules.length <= 50, "module count out of bounds");
  const ids = new Set();
  for (const mod of modules) {
    requireCondition(TYPES.has(mod.type), "unsupported visual module: " + mod.type);
    requireCondition(/^[a-z][a-z0-9_-]{2,63}$/.test(str(mod.id)) && !ids.has(mod.id), "missing or duplicate module ID");
    ids.add(mod.id);
    shortText(mod.title, "module title", 1, 400);
    for (const source of mod.source_ids || []) requireCondition(sourceIds.has(source), "module references missing source");
    if (["summary", "checklist"].includes(mod.type)) {
      requireCondition(asArray(mod.type === "summary" ? mod.bullets : mod.items, "list items").length >= 1, "empty list");
    }
    if (["comparison", "decision"].includes(mod.type)) {
      requireCondition(asArray(mod.items, "module items").length >= 2, "too few options");
    }
    if (mod.type === "process") requireCondition(asArray(mod.steps, "process stages").length >= 2, "too few steps");
    if (mod.type === "narrative") requireCondition(asArray(mod.paragraphs, "narrative paragraphs").length >= 1, "empty narrative");
    if (mod.type === "quote") shortText(mod.text, "quotation", 1, 18000);
    if (mod.type === "image") {
      requireCondition(Number.isInteger(mod.media_id) && mod.media_id > 0, "image media id required");
      httpsUrl(mod.src, true);
      shortText(mod.alt, "accessible alt text", 10, 400);
      shortText(mod.caption, "image caption", 1, 1200);
    }
  }
  requireCondition(m.gates?.editorial === "PENDING", "prototype must remain pending editorial review");
  return true;
}

const openBlock = (type, attrs) => "<!-- wp:" + type + (attrs ? " " + JSON.stringify(attrs) : "") + " -->";
const closeBlock = (type) => "<!-- /wp:" + type + " -->";
function heading(level, value) {
  requireCondition(level >= 2 && level <= 4, "heading level out of range");
  return openBlock("heading", { level }) + '<h' + level + ' class="wp-block-heading">' +
    escapeHTML(value) + "</h" + level + ">" + closeBlock("heading");
}
function paragraph(value, extra = "") {
  const attr = extra ? { className: extra } : undefined;
  const cl = extra ? " " + extra : "";
  return openBlock("paragraph", attr) + '<p class="wp-block-paragraph' + cl + '">' +
    escapeHTML(value) + "</p>" + closeBlock("paragraph");
}
function bullets(values, className = "hm-va-list") {
  const li = values.map((v) => openBlock("list-item") + "<li>" + escapeHTML(v) + "</li>" + closeBlock("list-item")).join("\n");
  return openBlock("list", { className }) + '<ul class="wp-block-list ' + className + '">' + li + "</ul>" + closeBlock("list");
}
function group(className, content, variant = "light") {
  const [backgroundColor, textColor] = COLORS[variant] || COLORS.light;
  const pad = { top: "22px", right: "22px", bottom: "22px", left: "22px" };
  const attrs = {
    className, backgroundColor, textColor,
    style: { border: { radius: "18px" }, spacing: { padding: pad } },
    layout: { type: "constrained" }
  };
  const classes = "wp-block-group " + className + " has-" + textColor +
    "-color has-" + backgroundColor + "-background-color has-text-color has-background";
  const style = "border-radius:18px;padding-top:22px;padding-right:22px;padding-bottom:22px;padding-left:22px";
  return openBlock("group", attrs) + '<div class="' + classes + '" style="' + style + '">' +
    content + "</div>" + closeBlock("group");
}
function cols(cards, className) {
  const children = cards.map((c) =>
    openBlock("column") + '<div class="wp-block-column">' + c +
    "</div>" + closeBlock("column")).join("\n");
  return openBlock("columns", { className }) +
    '<div class="wp-block-columns ' + className + '">' + children +
    "</div>" + closeBlock("columns");
}
function cardGrid(items, makeCard) {
  const rows = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(cols(items.slice(i, i + 2).map((x, j) => makeCard(x, i + j)),
      "hm-va-card-grid"));
  }
  return rows.join("\n");
}
function renderModule(mod) {
  const title = heading(2, mod.title);
  switch (mod.type) {
    case "image": {
      const src = httpsUrl(mod.src, true);
      const markup = openBlock("image", { id: mod.media_id, sizeSlug: "full", linkDestination: "none", className: "hm-va-full-image" }) +
        '<figure class="wp-block-image size-full hm-va-full-image">' +
        '<img src="' + src + '" alt="' + escapeHTML(mod.alt) + '" class="wp-image-' + mod.media_id + '"/>' +
        '<figcaption class="wp-element-caption">' + escapeHTML(mod.caption) + "</figcaption>" +
        "</figure>" + closeBlock("image");
      return markup;
    }
    case "summary":
      return group("hm-va-panel hm-va-summary", title + bullets(mod.bullets), "navy");
    case "quote": {
      const q = openBlock("quote", { className: "hm-va-pullquote" }) +
        '<blockquote class="wp-block-quote hm-va-pullquote"><p>' +
        escapeHTML(mod.text) + '</p><cite>' + escapeHTML(mod.attribution) +
        "</cite></blockquote>" + closeBlock("quote");
      return title + q;
    }
    case "comparison":
      return title + cardGrid(mod.items, (it, i) =>
        group("hm-va-card hm-va-compare-card",
          heading(3, it.name) +
          paragraph("เหมาะกับ: " + it.use_case) +
          paragraph("จุดเด่น: " + it.strength) +
          paragraph("ข้อจำกัด: " + it.limitation),
          i % 3 === 0 ? "cyan" : "light"));
    case "decision":
      return title + cardGrid(mod.items, (it, i) =>
        group("hm-va-card hm-va-decision-card",
          heading(3, it.when) + paragraph("เลือก: " + it.choose) + paragraph(it.why),
          i % 3 === 1 ? "navy" : "light"));
    case "process":
      return title + cardGrid(mod.steps, (it, i) =>
        group("hm-va-card hm-va-process-card",
          heading(3, String(i + 1) + " — " + it.label) + paragraph(it.detail),
          i === 0 ? "cyan" : "light"));
    case "checklist":
      return group("hm-va-panel hm-va-checklist", title + bullets(mod.items), "light");
    case "narrative":
      return heading(2, mod.title) +
        mod.paragraphs.map((p) => paragraph(p, "hm-va-body")).join("\n");
    default:
      throw new Error("Unsupported type");
  }
}
export function renderGutenberg(manifest) {
  validateManifest(manifest);
  const kicker = paragraph("HYBRID MIND  /  " + manifest.category.toUpperCase(), "hm-va-kicker");
  const deck = paragraph(manifest.dek, "hm-va-dek");
  // WordPress single-post template already displays post title. Do not duplicate H1 in content.
  const content = [kicker, deck, ...manifest.modules.map(renderModule)].join("\n\n");
  return openBlock("group", { className: "hm-visual-article", layout: { type: "constrained" } }) +
    '<div class="wp-block-group hm-visual-article">' + content +
    "</div>" + closeBlock("group") + "\n";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const src = process.argv[2], target = process.argv[3];
  if (!src || !target) {
    process.stderr.write("Usage: node render_gutenberg.mjs input.json output.html\n");
    process.exitCode = 2;
  } else {
    const manifest = JSON.parse(readFileSync(src, "utf8"));
    const markup = renderGutenberg(manifest);
    writeFileSync(target, markup, "utf8");
    process.stdout.write("Rendered Gutenberg Draft: " + markup.length + " characters\n");
  }
}
