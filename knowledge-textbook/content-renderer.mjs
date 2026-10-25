import {approvedLabRoots,registerLabMarkup} from './labs/registry.mjs';
const ORIGIN = 'https://hybridmind.online';

export function safeContentUrl(value, { image = false } = {}) {
  try {
    const url = new URL(String(value ?? ''));
    if (url.protocol !== 'https:' || url.origin !== ORIGIN || url.username || url.password || url.port) return null;
    if (image && !url.pathname.startsWith('/wp-content/uploads/')) return null;
    return url.href;
  } catch { return null; }
}

export function safeLocalMediaPath(value) {
  return typeof value === 'string' && /^\.\.\/assets\/media\/[0-9]+\.(?:jpe?g|png|webp|gif)$/i.test(value) ? value : null;
}

function safeMediaSourceUrl(value) {
  try {
    const url = new URL(String(value ?? ''));
    return url.protocol === 'https:' && ['hybridmind.online', 'i0.wp.com'].includes(url.hostname)
      && url.pathname.includes('/wp-content/uploads/') && !url.username && !url.password && !url.port ? url.href : null;
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
    case 'paragraph': {
      allowedKeys(block, ['type','text','links'], 'paragraph'); assert(str(block.text), 'invalid paragraph');
      let lastEnd = 0;
      for (const l of block.links ?? []) {
        allowedKeys(l, ['text','url','start','end'], 'link');
        assert(str(l.text) && safeContentLinkUrl(l.url), 'unsafe or invalid link');
        assert(Number.isInteger(l.start) && Number.isInteger(l.end) && l.start >= lastEnd && l.end > l.start && l.end <= block.text.length && block.text.slice(l.start,l.end) === l.text, 'link text offsets do not match paragraph');
        lastEnd = l.end;
      }
      break;
    }
    case 'list': allowedKeys(block, ['type','ordered','items'], 'list'); assert(typeof block.ordered === 'boolean' && Array.isArray(block.items) && block.items.every(str), 'invalid list'); break;
    case 'quote': allowedKeys(block, ['type','text','attribution'], 'quote'); assert(str(block.text) && (block.attribution === undefined || str(block.attribution)), 'invalid quote'); break;
    case 'code': allowedKeys(block, ['type','code','language'], 'code'); assert(str(block.code) && (block.language === undefined || str(block.language)), 'invalid code'); break;
    case 'image': allowedKeys(block, ['type','src','alt','caption'], 'image'); assert(str(block.alt) && safeContentUrl(block.src, { image: true }), 'unsafe or invalid image'); break;
    case 'html_fragment': allowedKeys(block, ['type','html'], 'HTML fragment'); assert(str(block.html) && block.html.length > 0 && block.html.length <= 600000, 'invalid HTML fragment'); break;
    case 'interactive_fallback': allowedKeys(block, ['type','label','summary','source_block_type'], 'fallback'); assert(str(block.label) && str(block.summary) && str(block.source_block_type), 'invalid static fallback'); break;
    default: throw new TypeError('Invalid structured content: block type is not allowlisted');
  }
}

export function validateStructuredContent(entry, { catalog, allowFixture = false } = {}) {
  assert(entry && ['1.0.0', '1.1.0'].includes(entry.schema_version), 'unsupported schema_version');
  allowedKeys(entry, ['schema_version','article_id','canonical_url','source_revision','source_hash','source_hash_status','source_hash_scope','content_derivation_status','content_digest','imported_at','provenance','fixture_notice','blocks','media','featured_media_id'], 'envelope');
  assert(/^hm:article:\d+$/.test(entry.article_id ?? ''), 'invalid article_id');
  assert(entry.provenance === 'wordpress_export' || entry.provenance === 'test_fixture', 'invalid provenance');
  assert(allowFixture || entry.provenance !== 'test_fixture', 'test_fixture provenance is not permitted');
  if (entry.provenance === 'test_fixture') assert(typeof entry.fixture_notice === 'string' && /synthetic/i.test(entry.fixture_notice) && /not.*(export|article content)/i.test(entry.fixture_notice), 'fixture must be clearly labeled synthetic and non-source');
  else assert(entry.fixture_notice === undefined, 'wordpress export cannot carry fixture metadata');
  assert(typeof entry.source_revision === 'string' && entry.source_revision.length > 0, 'missing source_revision');
  assert(entry.source_hash_status === 'source_bytes_verified' || entry.source_hash_status === 'unverified', 'invalid source_hash_status');
  if (entry.source_hash_status === 'source_bytes_verified') assert(/^sha256:[a-f0-9]{64}$/.test(entry.source_hash ?? ''), 'source-bytes-verified source_hash is missing or invalid');
  else assert(entry.source_hash === null, 'unverified source_hash must be null');
  if (entry.schema_version === '1.1.0') {
    assert(entry.source_hash_scope === 'wordpress_rest_content_rendered_utf8', 'missing or unsupported source_hash_scope');
    assert(Array.isArray(entry.media), 'media manifest is required for REST content');
    const mediaIds = new Set();
    for (const media of entry.media) {
      allowedKeys(media, ['attachment_id','source_url','local_src','mime_type','byte_length','sha256','modified_gmt','author_id','alt_text','title','caption','source_description','source_title','source_caption'], 'media');
      assert(Number.isSafeInteger(media.attachment_id) && media.attachment_id > 0 && !mediaIds.has(media.attachment_id), 'invalid or duplicate media attachment_id');
      mediaIds.add(media.attachment_id);
      assert(safeMediaSourceUrl(media.source_url), 'unsafe media source URL');
      assert(safeLocalMediaPath(media.local_src), 'unsafe local media path');
      assert(['image/jpeg','image/png','image/webp','image/gif'].includes(media.mime_type), 'unsupported media MIME type');
      assert(Number.isSafeInteger(media.byte_length) && media.byte_length > 0 && /^sha256:[a-f0-9]{64}$/.test(media.sha256 ?? ''), 'invalid media integrity metadata');
      assert(typeof media.modified_gmt === 'string' && typeof media.alt_text === 'string' && typeof media.title === 'string' && typeof media.caption === 'string'
        && typeof media.source_description === 'string' && typeof media.source_title === 'string' && typeof media.source_caption === 'string', 'invalid media provenance');
    }
    if (entry.featured_media_id !== null) assert(mediaIds.has(entry.featured_media_id), 'featured media is absent from the manifest');
  }
  assert(entry.content_derivation_status === 'unverified', 'normalized content derivation must remain explicitly unverified');
  assert(/^sha256:[a-f0-9]{64}$/.test(entry.content_digest ?? ''), 'invalid content_digest');
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
  if (entry.schema_version === '1.1.0') assert(entry.source_hash_status === 'source_bytes_verified' && entry.blocks.length === 1 && entry.blocks[0].type === 'html_fragment', 'REST content requires one verified rendered source fragment');
  else assert(!entry.blocks.some(block => block.type === 'html_fragment'), 'HTML fragments require schema 1.1.0');
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

export function renderStructuredContent(entry, { document, sourceArticle, sections = [] } = {}) {
  assert(document?.createElement, 'DOM document is required');
  validateStructuredContent(entry, { catalog: sourceArticle ? { articles: [sourceArticle] } : undefined, allowFixture: true });
  const root = document.createElement('article');
  root.className = 'structured-article-content';
  root.dataset.articleId = entry.article_id;
  if (entry.featured_media_id && entry.media) {
    const featured = entry.media.find(media => media.attachment_id === entry.featured_media_id);
    if (featured) root.append(renderMediaFigure(featured, document, true));
  }
  for (const block of entry.blocks) {
    let node;
    if (block.type === 'heading') { node = document.createElement(`h${block.level}`); node.textContent = block.text; if (block.anchor) node.id = block.anchor; }
    else if (block.type === 'paragraph') {
      node = document.createElement('p'); let cursor = 0;
      for (const link of block.links ?? []) {
        if (link.start > cursor) node.append(document.createTextNode(block.text.slice(cursor, link.start)));
        const a = document.createElement('a'); a.textContent = link.text; a.href = safeContentLinkUrl(link.url); a.target = '_blank'; a.rel = 'noopener noreferrer'; node.append(a); cursor = link.end;
      }
      if (cursor < block.text.length || !block.links?.length) node.append(document.createTextNode(block.text.slice(cursor)));
    } else if (block.type === 'list') { node = document.createElement(block.ordered ? 'ol' : 'ul'); for (const text of block.items) { const li = document.createElement('li'); li.textContent = text; node.append(li); } }
    else if (block.type === 'quote') { node = document.createElement('blockquote'); const p = document.createElement('p'); p.textContent = block.text; node.append(p); if (block.attribution) { const cite = document.createElement('cite'); cite.textContent = block.attribution; node.append(cite); } }
    else if (block.type === 'code') { node = document.createElement('pre'); const code = document.createElement('code'); code.textContent = block.code; if (block.language) code.className = `language-${block.language.replace(/[^a-z0-9_-]/gi, '')}`; node.append(code); }
    else if (block.type === 'image') { node = document.createElement('figure'); const img = document.createElement('img'); img.src = safeContentUrl(block.src, { image: true }); img.alt = block.alt; img.loading = 'lazy'; node.append(img); if (block.caption) { const cap = document.createElement('figcaption'); cap.textContent = block.caption; node.append(cap); } }
    else if (block.type === 'html_fragment') node = renderSafeHtml(block.html, entry, document, sourceArticle, sections);
    else { node = document.createElement('aside'); node.className = 'interactive-static-fallback'; node.setAttribute('role', 'note'); const title = document.createElement('strong'); title.textContent = block.label; const summary = document.createElement('p'); summary.textContent = block.summary; node.append(title, summary); }
    root.append(node);
  }
  return root;
}

const HTML_TAGS = new Set(['h1','h2','h3','h4','h5','h6','p','div','span','strong','b','em','i','del','ins','small','sup','sub','mark','ul','ol','li','blockquote','cite','dl','dt','dd','figure','figcaption','img','a','table','caption','thead','tbody','tfoot','tr','th','td','pre','code','br','hr','details','summary']);
const EXECUTABLE_TAGS = new Set(['script','style','svg','math']);
const INTERACTIVE_TAGS = new Set(['iframe','object','embed','form','input','button','select','textarea','video','audio','canvas']);
const SAFE_ID = /^[A-Za-z][A-Za-z0-9_.:-]{0,119}$/;

function renderMediaFigure(media, document, featured = false, alt = media.alt_text) {
  const figure = document.createElement('figure');
  figure.className = featured ? 'source-featured-media' : 'source-inline-media';
  const img = document.createElement('img');
  img.src = safeLocalMediaPath(media.local_src) ?? '';
  img.alt = alt || media.alt_text || '';
  img.loading = 'lazy'; img.decoding = 'async';
  img.addEventListener?.('error', () => {
    const fallback = document.createElement('span');
    fallback.className = 'media-fallback';
    fallback.textContent = `Image unavailable in the local pilot (attachment ${media.attachment_id}): ${alt || media.alt_text}`;
    img.replaceWith(fallback);
  }, { once: true });
  figure.append(img);
  const captionText = [media.caption, media.title].filter(Boolean).join(' — ');
  if (captionText || featured) {
    const caption = document.createElement('figcaption');
    caption.textContent = captionText || 'Featured image from the original WordPress article.';
    figure.append(caption);
  }
  return figure;
}

function renderSafeImage(media, document, alt = media.alt_text) {
  const image = document.createElement('img');
  image.src = safeLocalMediaPath(media.local_src) ?? '';
  image.alt = alt || media.alt_text || '';
  image.loading = 'lazy'; image.decoding = 'async';
  image.addEventListener?.('error', () => {
    const fallback = document.createElement('span');
    fallback.className = 'media-fallback';
    fallback.textContent = `Image unavailable in the local pilot (attachment ${media.attachment_id}): ${alt || media.alt_text}`;
    image.replaceWith(fallback);
  }, { once: true });
  return image;
}

function renderInteractiveFallback(document, sourceArticle, description = '') {
  const note = document.createElement('aside');
  note.className = 'interactive-static-fallback'; note.setAttribute('role', 'note');
  const label = document.createElement('strong'); label.textContent = 'Interactive example';
  const summary = document.createElement('p'); summary.textContent = 'This embedded example is shown as a static note in the local pilot.';
  note.append(label, summary);
  if (description) { const text = document.createElement('p'); text.textContent = description; note.append(text); }
  const source = safeContentUrl(sourceArticle?.canonical_url);
  if (source) {
    const link = document.createElement('a'); link.href = source; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = 'Open the original WordPress article'; note.append(link);
  }
  return note;
}

function renderSafeHtml(html, entry, document, sourceArticle, sections) {
  const Parser = document.defaultView?.DOMParser ?? globalThis.DOMParser;
  assert(typeof Parser === 'function', 'a DOMParser is required to render imported WordPress HTML safely');
  const parsed = new Parser().parseFromString(html, 'text/html');
  const reviewedRoots = approvedLabRoots(entry);
  const labNodes = new Map();
  for (const [id,kind] of Object.entries(reviewedRoots ?? {})) {
    const sourceNode = parsed.getElementById(id);
    if (sourceNode) labNodes.set(sourceNode,kind);
  }
  const labFor = node => { for(let p=node;p && p!==parsed.body;p=p.parentElement) if(labNodes.has(p))return p; return null; };
  const sourceIdMap = new Map();
  const prefix = entry.article_id.replace(/[^a-z0-9-]/gi, '-');
  for (const sourceNode of parsed.body.querySelectorAll('[id]')) {
    if (SAFE_ID.test(sourceNode.id) && !sourceIdMap.has(sourceNode.id)) sourceIdMap.set(sourceNode.id, `${prefix}--${sourceNode.id}`);
  }
  const headingIds = new Map(), assignedSections = new Set();
  const normalizedHeading = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  for (const heading of parsed.body.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
    const section = sections.find(item => !assignedSections.has(item.section_id) && item.anchor && [item.anchor,...(item.anchor_aliases??[])].includes(heading.id))
      ?? sections.find(item => !assignedSections.has(item.section_id) && normalizedHeading(item.heading_text) === normalizedHeading(heading.textContent));
    if (!section) continue;
    const targetId = `sec-${section.section_id}`;
    headingIds.set(heading, targetId); assignedSections.add(section.section_id);
    if (heading.id && sourceIdMap.has(heading.id)) sourceIdMap.set(heading.id, targetId);
  }
  const emittedIds = new Set();
  const mediaById = new Map((entry.media ?? []).map(media => [String(media.attachment_id), media]));
  const base = sourceArticle?.canonical_url ?? entry.canonical_url;

  const appendChildren = (sourceNode, target) => {
    for (const child of [...sourceNode.childNodes]) {
      const safeChild = copy(child);
      if (safeChild) target.append(safeChild);
    }
  };
  const unwrap = sourceNode => {
    const fragment = document.createDocumentFragment?.() ?? document.createElement('span');
    appendChildren(sourceNode, fragment);
    return fragment;
  };
  const copy = sourceNode => {
    if (sourceNode.nodeType === 3) return document.createTextNode(sourceNode.nodeValue ?? '');
    if (sourceNode.nodeType !== 1) return null;
    const tag = sourceNode.tagName.toLowerCase();
    const approvedLab = labFor(sourceNode);
    const reviewedControl = approvedLab && ['input','button','select','textarea','canvas'].includes(tag);
    if (EXECUTABLE_TAGS.has(tag)) return null;
    if (tag === 'form') return unwrap(sourceNode);
    if (!reviewedControl && ['input','button','select','textarea'].includes(tag)) {
      const control = document.createElement('span'); control.className = 'source-static-control'; control.setAttribute('aria-disabled','true');
      control.textContent = sourceNode.getAttribute('aria-label') || sourceNode.textContent.trim() || sourceNode.getAttribute('placeholder') || sourceNode.getAttribute('value') || 'Interactive input';
      return control;
    }
    if (!reviewedControl && INTERACTIVE_TAGS.has(tag)) return renderInteractiveFallback(document, sourceArticle, [sourceNode.getAttribute('aria-label'),sourceNode.textContent.trim()].filter(Boolean).join(' — '));
    if (tag === 'img') {
      const mediaId = sourceNode.getAttribute('data-attachment-id');
      const media = mediaById.get(mediaId);
      if (!media || !safeLocalMediaPath(media.local_src)) {
        const missing = document.createElement('span');
        missing.className = 'media-fallback';
        missing.textContent = `Image unavailable in the local pilot (attachment ${mediaId || 'unknown'})`;
        return missing;
      }
      return renderSafeImage(media, document, sourceNode.getAttribute('alt') || media.alt_text);
    }
    if (!HTML_TAGS.has(tag) && !(approvedLab && ['section','header','nav','footer','label','option','input','button','select','textarea','canvas'].includes(tag))) return unwrap(sourceNode);
    if (tag === 'a') {
      const rawHref = sourceNode.getAttribute('href') ?? '';
      let resolved = null;
      if (rawHref.startsWith('#')) resolved = sourceIdMap.has(rawHref.slice(1)) ? `#${sourceIdMap.get(rawHref.slice(1))}` : null;
      else {
        try { resolved = rawHref ? safeContentLinkUrl(new URL(rawHref, base).href) : null; } catch {}
      }
      if (!resolved) return unwrap(sourceNode);
      const anchor = document.createElement('a'); anchor.href = resolved;
      if (approvedLab) copyReviewedAttributes(sourceNode,anchor,sourceIdMap);
      if (!resolved.startsWith('#')) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
      appendChildren(sourceNode, anchor);
      return anchor;
    }
    const node = document.createElement(tag);
    const id = sourceNode.getAttribute('id');
    if (id && sourceIdMap.has(id) && !emittedIds.has(id)) { node.id = sourceIdMap.get(id); node.setAttribute('data-source-anchor', id); emittedIds.add(id); }
    if (headingIds.has(sourceNode)) node.id = headingIds.get(sourceNode);
    if (approvedLab) copyReviewedAttributes(sourceNode,node,sourceIdMap);
    if (labNodes.has(sourceNode)) {
      node.classList.add('hm-reviewed-lab');node.dataset.labKind=labNodes.get(sourceNode);node.dataset.labArticle=entry.article_id;
      registerLabMarkup(node,entry,sourceNode.id);
    }
    if (tag === 'code') {
      const language = [...sourceNode.classList].find(value => /^language-[a-z0-9_-]{1,40}$/i.test(value));
      if (language) node.className = language;
    }
    if (tag === 'td' || tag === 'th') {
      for (const key of ['colspan','rowspan']) {
        const value = Number(sourceNode.getAttribute(key));
        if (Number.isInteger(value) && value >= 1 && value <= 20) node.setAttribute(key, String(value));
      }
      const scope = sourceNode.getAttribute('scope');
      if (tag === 'th' && ['row','col','rowgroup','colgroup'].includes(scope)) node.setAttribute('scope', scope);
    }
    if (tag === 'ol') {
      const start = Number(sourceNode.getAttribute('start'));
      if (Number.isInteger(start) && start > 0 && start < 100000) node.setAttribute('start', String(start));
    }
    if (tag === 'details' && sourceNode.hasAttribute('open')) node.open = true;
    appendChildren(sourceNode, node);
    if (tag === 'figure') {
      const sourceImage = sourceNode.querySelector('img[data-attachment-id]');
      const media = sourceImage ? mediaById.get(sourceImage.getAttribute('data-attachment-id')) : null;
      const existingCaption = [...node.querySelectorAll('figcaption')].map(caption => caption.textContent).join(' ');
      for (const note of [media?.source_caption, media?.source_description]) {
        if (!note || existingCaption.includes(note)) continue;
        const caption = document.createElement('figcaption'); caption.className = 'source-media-note';
        caption.textContent = `WordPress media metadata: ${note}`; node.append(caption);
      }
    }
    return node;
  };

  const root = document.createElement('div'); root.className = 'source-html-fragment';
  if ([...parsed.body.querySelectorAll('form,input,button,select,textarea')].some(node=>!labFor(node))) root.append(renderInteractiveFallback(document, sourceArticle, 'Original control labels are retained below as disabled static text.'));
  appendChildren(parsed.body, root);
  return root;
}

// This path is reachable only after hashing the exact reviewed source snapshot.
// Active attributes, inline CSS, script, frame, URLs and form actions remain forbidden.
function copyReviewedAttributes(source,target,idMap) {
  const classes=[...source.classList].filter(c=>/^[a-zA-Z0-9_-]{1,80}$/.test(c)).slice(0,20);
  if(classes.length)target.className=classes.join(' ');
  for(const attr of ['role','title','lang','aria-label','aria-live','aria-atomic','aria-pressed','aria-expanded','aria-hidden']) {
    if(source.hasAttribute(attr))target.setAttribute(attr,source.getAttribute(attr).slice(0,500));
  }
  for(const attr of ['aria-labelledby','aria-describedby','aria-controls','for']) {
    if(!source.hasAttribute(attr))continue;
    const ids=source.getAttribute(attr).split(/\s+/).map(id=>idMap.get(id)).filter(Boolean);
    if(ids.length)target.setAttribute(attr,ids.join(' '));
  }
  for(const attr of ['data-camera','data-stage','data-platform','data-value','data-state','data-view','data-card']) {
    const value=source.getAttribute(attr);if(value!==null&&/^[a-zA-Z0-9_-]{1,60}$/.test(value))target.setAttribute(attr,value);
  }
  if(source.hasAttribute('hidden'))target.hidden=true;
  const tag=target.tagName.toLowerCase();
  if(tag==='button')target.type='button';
  if(tag==='input')target.type=['text','number','range','checkbox','radio'].includes(source.getAttribute('type'))?source.getAttribute('type'):'text';
  if(['input','option'].includes(tag)&&source.hasAttribute('value'))target.setAttribute('value',source.getAttribute('value').slice(0,1024));
  for(const attr of ['checked','selected','readonly','disabled'])if(['input','option','textarea','select','button'].includes(tag)&&source.hasAttribute(attr))target.setAttribute(attr,'');
  for(const attr of ['min','max','step','maxlength','rows']) {
    const raw=source.getAttribute(attr),value=Number(raw);
    if(raw!==null&&Number.isFinite(value)&&value>=-100000&&value<=1000000)target.setAttribute(attr,String(value));
  }
  if(source.hasAttribute('placeholder'))target.setAttribute('placeholder',source.getAttribute('placeholder').slice(0,200));
}
