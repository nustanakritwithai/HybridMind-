const ORIGIN = 'https://hybridmind.online';

export function safeContentUrl(value, { image = false } = {}) {
  try {
    const url = new URL(String(value ?? ''));
    if (url.protocol !== 'https:' || url.origin !== ORIGIN || url.username || url.password || url.port) return null;
    if (image && !url.pathname.startsWith('/wp-content/uploads/')) return null;
    return url.href;
  } catch { return null; }
}

// Source articles may cite other sites. Preserve ordinary HTTPS links while
// rejecting script/data schemes, credential tricks and custom ports. Media
// stays pinned to the site's uploads path through safeContentUrl above.
export function safeContentLinkUrl(value) {
  try {
    const url = new URL(String(value ?? ''));
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    return url.href;
  } catch { return null; }
}

function assert(ok, message) { if (!ok) throw new TypeError(`Invalid structured content: ${message}`); }
function allowedKeys(object, keys, label) { assert(Object.keys(object).every(key => keys.includes(key)), `${label} contains unsupported fields`); }
function validBlock(block) {
  assert(block && typeof block === 'object' && !Array.isArray(block), 'block must be an object');
  const str = x => typeof x === 'string';
  switch (block.type) {
    case 'heading': allowedKeys(block, ['type','level','text','anchor'], 'heading'); assert([2,3,4,5,6].includes(block.level) && str(block.text), 'invalid heading'); break;
    case 'paragraph': allowedKeys(block, ['type','text','links'], 'paragraph'); assert(str(block.text), 'invalid paragraph'); for (const l of block.links ?? []) { allowedKeys(l, ['text','url'], 'link'); assert(str(l.text) && safeContentLinkUrl(l.url), 'unsafe or invalid link'); } break;
    case 'list': allowedKeys(block, ['type','ordered','items'], 'list'); assert(typeof block.ordered === 'boolean' && Array.isArray(block.items) && block.items.every(str), 'invalid list'); break;
    case 'quote': allowedKeys(block, ['type','text','attribution'], 'quote'); assert(str(block.text) && (block.attribution === undefined || str(block.attribution)), 'invalid quote'); break;
    case 'code': allowedKeys(block, ['type','code','language'], 'code'); assert(str(block.code) && (block.language === undefined || str(block.language)), 'invalid code'); break;
    case 'image': allowedKeys(block, ['type','src','alt','caption'], 'image'); assert(str(block.alt) && safeContentUrl(block.src, { image: true }), 'unsafe or invalid image'); break;
    case 'interactive_fallback': allowedKeys(block, ['type','label','summary','source_block_type'], 'fallback'); assert(str(block.label) && str(block.summary) && str(block.source_block_type), 'invalid static fallback'); break;
    default: throw new TypeError('Invalid structured content: block type is not allowlisted');
  }
}

export function validateStructuredContent(entry, { catalog, allowFixture = false } = {}) {
  assert(entry && entry.schema_version === '1.0.0', 'unsupported schema_version');
  allowedKeys(entry, ['schema_version','article_id','canonical_url','source_revision','source_hash','imported_at','provenance','fixture_notice','blocks'], 'envelope');
  assert(/^hm:article:\d+$/.test(entry.article_id ?? ''), 'invalid article_id');
  assert(entry.provenance === 'wordpress_export' || entry.provenance === 'test_fixture', 'invalid provenance');
  assert(allowFixture || entry.provenance !== 'test_fixture', 'test_fixture provenance is not permitted');
  if (entry.provenance === 'test_fixture') assert(typeof entry.fixture_notice === 'string' && /synthetic/i.test(entry.fixture_notice) && /not.*(export|article content)/i.test(entry.fixture_notice), 'fixture must be clearly labeled synthetic and non-source');
  else assert(entry.fixture_notice === undefined, 'wordpress export cannot carry fixture metadata');
  assert(typeof entry.source_revision === 'string' && entry.source_revision.length > 0, 'missing source_revision');
  assert(/^sha256:[a-f0-9]{64}$/.test(entry.source_hash ?? ''), 'invalid source_hash');
  assert(typeof entry.imported_at === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(entry.imported_at) && !Number.isNaN(Date.parse(entry.imported_at)), 'invalid imported_at');
  const canonical = safeContentUrl(entry.canonical_url);
  assert(canonical === entry.canonical_url, 'canonical_url must use the approved origin');
  if (catalog) {
    const article = catalog.articles?.find(a => a.article_id === entry.article_id);
    assert(article && article.status === 'published' && article.visibility === 'public' && article.password_protected === false, 'article is not in the public catalog');
    assert(article.canonical_url === canonical, 'canonical_url does not match public catalog');
    assert(article.article_revision === entry.source_revision, 'source_revision does not match public catalog');
  }
  assert(Array.isArray(entry.blocks), 'blocks must be an array');
  entry.blocks.forEach(validBlock);
  return entry;
}

export function validateContentBundle(bundle, options = {}) {
  assert(bundle && bundle.schema_version === '1.0.0' && Array.isArray(bundle.articles), 'invalid bundle');
  const seen = new Set();
  for (const entry of bundle.articles) {
    validateStructuredContent(entry, options);
    assert(!seen.has(entry.article_id), 'duplicate article_id');
    seen.add(entry.article_id);
  }
  return bundle;
}

export function renderStructuredContent(entry, { document, sourceArticle } = {}) {
  assert(document?.createElement, 'DOM document is required');
  validateStructuredContent(entry, { catalog: sourceArticle ? { articles: [sourceArticle] } : undefined, allowFixture: true });
  const root = document.createElement('article');
  root.className = 'structured-article-content';
  root.dataset.articleId = entry.article_id;
  for (const block of entry.blocks) {
    let node;
    if (block.type === 'heading') { node = document.createElement(`h${block.level}`); node.textContent = block.text; if (block.anchor) node.id = block.anchor; }
    else if (block.type === 'paragraph') {
      node = document.createElement('p'); node.append(document.createTextNode(block.text));
      for (const link of block.links ?? []) { node.append(document.createTextNode(' ')); const a = document.createElement('a'); a.textContent = link.text; a.href = safeContentLinkUrl(link.url); a.target = '_blank'; a.rel = 'noopener noreferrer'; node.append(a); }
    } else if (block.type === 'list') { node = document.createElement(block.ordered ? 'ol' : 'ul'); for (const text of block.items) { const li = document.createElement('li'); li.textContent = text; node.append(li); } }
    else if (block.type === 'quote') { node = document.createElement('blockquote'); const p = document.createElement('p'); p.textContent = block.text; node.append(p); if (block.attribution) { const cite = document.createElement('cite'); cite.textContent = block.attribution; node.append(cite); } }
    else if (block.type === 'code') { node = document.createElement('pre'); const code = document.createElement('code'); code.textContent = block.code; if (block.language) code.className = `language-${block.language.replace(/[^a-z0-9_-]/gi, '')}`; node.append(code); }
    else if (block.type === 'image') { node = document.createElement('figure'); const img = document.createElement('img'); img.src = safeContentUrl(block.src, { image: true }); img.alt = block.alt; img.loading = 'lazy'; node.append(img); if (block.caption) { const cap = document.createElement('figcaption'); cap.textContent = block.caption; node.append(cap); } }
    else { node = document.createElement('aside'); node.className = 'interactive-static-fallback'; node.setAttribute('role', 'note'); const title = document.createElement('strong'); title.textContent = block.label; const summary = document.createElement('p'); summary.textContent = block.summary; node.append(title, summary); }
    root.append(node);
  }
  return root;
}
