#!/usr/bin/env node
/**
 * Resumable, anonymous, public-only WordPress inventory capture.
 * Uses GET only, throttles every request, and checkpoints each completed page.
 * A 429 is checkpointed and stops the run; it is never retried immediately.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_BASE = 'https://hybridmind.online/wp-json/wp/v2';
const PER_PAGE = 100;
const FIELDS = 'id,status,password_protected,date,date_gmt,modified,modified_gmt,link,title,excerpt,categories';
const CONTENT_FIELDS = 'id,status,password_protected,excerpt,content';
const USER_AGENT = 'HybridMindPublicKnowledgeInventory/1.0 (anonymous read-only; resumable GET)';

export class RateLimitPause extends Error {
  constructor(message, retryAt) { super(message); this.name = 'RateLimitPause'; this.retryAt = retryAt; }
}

const sleep = ms => new Promise(resolveSleep => setTimeout(resolveSleep, ms));
const rendered = value => value && typeof value === 'object' ? String(value.rendered ?? '') : '';
const decodeHtml = value => String(value ?? '')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'");
const textOnly = value => decodeHtml(String(value ?? '').replace(/<\/?(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)\s*>/gi, ' ')
  .replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

function extractHeadings(html) {
  const clean = String(html ?? '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ');
  const output = [];
  for (const match of clean.matchAll(/<h([23])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi)) {
    const value = textOnly(match[2]);
    if (value) output.push({ level: Number(match[1]), text: value });
  }
  return output;
}

function retryAt(response, now = Date.now()) {
  const raw = response.headers.get('retry-after');
  if (raw && /^\d+(?:\.\d+)?$/.test(raw.trim())) return now + Number(raw) * 1000;
  if (raw) { const parsed = Date.parse(raw); if (!Number.isNaN(parsed)) return Math.max(now, parsed); }
  return now + 60_000;
}

async function saveJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temp, path);
}

function firstHeader(response, title, lower) {
  const value = response.headers.get(title) ?? response.headers.get(lower);
  return value === null ? null : Number(value);
}

export async function capturePublicWpInventory({
  baseUrl = DEFAULT_BASE,
  checkpointPath = 'data/wp-public-inventory-checkpoint.json',
  outputPath = 'data/wp-public-inventory.json',
  delayMs = 1500,
  fetchImpl = fetch,
  wait = sleep,
  now = () => Date.now(),
} = {}) {
  const base = baseUrl.replace(/\/$/, '');
  const checkpoint = resolve(checkpointPath), output = resolve(outputPath);
  let state;
  try { state = JSON.parse(await readFile(checkpoint, 'utf8')); }
  catch (error) { if (error?.code !== 'ENOENT') throw error; }
  if (state && (state.base_url !== base || state.query_status !== 'publish' || state.per_page !== PER_PAGE)) {
    throw new Error('Checkpoint belongs to a different source or query; choose a new checkpoint path.');
  }
  state ??= {
    schema_version: 1, base_url: base, query_status: 'publish', per_page: PER_PAGE,
    captured_at_utc: new Date(now()).toISOString(), post_pages: {}, category_pages: {}, content: {},
    next_post_page: 1, next_category_page: 1, next_content_index: 0, last_request_at: null,
    page_statuses: [], stop_reason: null, rate_limited_until: null,
  };
  if (state.rate_limited_until && now() < state.rate_limited_until) {
    throw new RateLimitPause(`WordPress asked the capture to pause until ${new Date(state.rate_limited_until).toISOString()}; rerun after that time.`, state.rate_limited_until);
  }
  state.rate_limited_until = null;
  const persist = () => saveJson(checkpoint, state);

  async function getJson(path, params) {
    const elapsed = state.last_request_at === null ? delayMs : now() - state.last_request_at;
    if (elapsed < delayMs) await wait(delayMs - elapsed);
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
    let response;
    try {
      state.last_request_at = now();
      response = await fetchImpl(url, {
        method: 'GET', credentials: 'omit', redirect: 'error',
        headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(30_000),
      });
    } catch (error) {
      state.stop_reason = `Transport error for ${path}: ${error.message}`;
      await persist();
      throw error;
    }
    if (response.status === 429) {
      const until = retryAt(response, now()); state.rate_limited_until = until;
      state.stop_reason = `HTTP 429; paused until ${new Date(until).toISOString()}`;
      await persist();
      throw new RateLimitPause(state.stop_reason, until);
    }
    if (!response.ok) {
      state.stop_reason = `HTTP ${response.status} for ${path}; checkpoint preserved for resume.`;
      await persist();
      throw new Error(state.stop_reason);
    }
    let data;
    try { data = await response.json(); }
    catch (error) { state.stop_reason = `Invalid JSON from ${path}`; await persist(); throw error; }
    return { data, response };
  }

  // Capture published post metadata page by page. Content is fetched separately
  // only for rows whose public and non-password state is explicitly false.
  while (state.next_post_page <= (state.reported_total_pages ?? 1)) {
    const page = state.next_post_page;
    const { data, response } = await getJson('/posts', {
      status: 'publish', per_page: PER_PAGE, page, _fields: FIELDS,
    });
    if (!Array.isArray(data)) throw new Error(`Posts page ${page} did not return an array.`);
    if (page === 1) {
      state.reported_total_posts = firstHeader(response, 'X-WP-Total', 'x-wp-total');
      state.reported_total_pages = firstHeader(response, 'X-WP-TotalPages', 'x-wp-totalpages') ?? 1;
      if (state.reported_total_pages < 0) throw new Error('Invalid X-WP-TotalPages header.');
    }
    const posts = data.filter(post => post.status === 'publish').map(post => ({
      id: Number(post.id), status: post.status,
      password_protected: typeof post.password_protected === 'boolean' ? post.password_protected : null,
      title: textOnly(rendered(post.title)), url: String(post.link ?? ''),
      date: post.date ?? null, date_gmt: post.date_gmt ?? null,
      modified: post.modified ?? null, modified_gmt: post.modified_gmt ?? null,
      category_ids: Array.isArray(post.categories) ? post.categories.map(Number) : [],
      // Do not preserve excerpts or source content until password state is known false.
      excerpt: null, headings: [], source_hash: null,
    }));
    state.post_pages[String(page)] = posts;
    state.page_statuses.push({ kind: 'posts', page, http_status: response.status, items: posts.length });
    state.next_post_page = page + 1;
    state.stop_reason = null;
    await persist();
    if (page >= state.reported_total_pages) break;
  }

  // Public category names are fetched with the same throttle/checkpoint rules.
  while (state.next_category_page <= (state.reported_category_pages ?? 1)) {
    const page = state.next_category_page;
    const { data, response } = await getJson('/categories', {
      per_page: PER_PAGE, page, _fields: 'id,name,slug,count',
    });
    if (!Array.isArray(data)) throw new Error(`Category page ${page} did not return an array.`);
    if (page === 1) state.reported_category_pages = firstHeader(response, 'X-WP-TotalPages', 'x-wp-totalpages') ?? 1;
    state.category_pages[String(page)] = data.map(term => ({ id: Number(term.id), name: textOnly(term.name), slug: String(term.slug ?? ''), count: Number(term.count ?? 0) }));
    state.page_statuses.push({ kind: 'categories', page, http_status: response.status, items: data.length });
    state.next_category_page = page + 1;
    await persist();
    if (page >= state.reported_category_pages) break;
  }

  const rawPosts = Object.keys(state.post_pages).sort((a, b) => Number(a) - Number(b)).flatMap(page => state.post_pages[page]);
  const safePosts = rawPosts.filter(post => post.status === 'publish' && post.password_protected === false);
  while (state.next_content_index < safePosts.length) {
    const post = safePosts[state.next_content_index];
    if (!state.content[String(post.id)]) {
      const { data, response } = await getJson(`/posts/${post.id}`, { _fields: CONTENT_FIELDS });
      if (Array.isArray(data) || !data || Number(data.id) !== post.id) throw new Error(`Unexpected body response for public post ${post.id}.`);
      const password = typeof data.password_protected === 'boolean' ? data.password_protected : post.password_protected;
      if (data.status !== 'publish' || password !== false) {
        state.content[String(post.id)] = { status: data.status ?? 'unknown', password_protected: password, excerpt: null, headings: [], source_hash: null };
      } else {
        const body = rendered(data.content);
        state.content[String(post.id)] = {
          status: 'publish', password_protected: false,
          excerpt: textOnly(rendered(data.excerpt)) || null,
          headings: extractHeadings(body),
          source_hash: body ? createHash('sha256').update(body, 'utf8').digest('hex') : null,
        };
      }
    }
    state.next_content_index++;
    await persist();
  }

  const categoryTerms = Object.keys(state.category_pages).sort((a, b) => Number(a) - Number(b)).flatMap(page => state.category_pages[page]);
  const categoryById = new Map(categoryTerms.map(term => [term.id, term]));
  const articles = rawPosts.map(post => {
    const content = post.password_protected === false ? state.content[String(post.id)] : null;
    const password = content?.password_protected ?? post.password_protected;
    const publicVisible = post.status === 'publish' && password === false && content?.status === 'publish';
    return {
      id: post.id, title: post.title, url: post.url, date: post.date, date_gmt: post.date_gmt,
      modified: post.modified, modified_gmt: post.modified_gmt,
      categories: post.category_ids.map(id => categoryById.get(id)?.name ?? `[unresolved category ${id}]`),
      category_ids: post.category_ids,
      password_protected: password,
      visibility: publicVisible ? 'public' : 'unknown',
      excerpt: publicVisible ? content.excerpt : null,
      headings: publicVisible ? content.headings : [],
      source_hash: publicVisible ? content.source_hash : null,
    };
  });
  const ids = articles.map(article => article.id);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))].sort((a, b) => a - b);
  const complete = state.next_post_page > state.reported_total_pages
    && state.next_category_page > state.reported_category_pages
    && state.next_content_index >= safePosts.length
    && state.reported_total_posts === articles.length
    && duplicateIds.length === 0;
  const snapshot = {
    captured_at_utc: state.captured_at_utc, site: new URL(base).origin,
    endpoint: '/wp-json/wp/v2/posts', query_status: 'publish', per_page: PER_PAGE,
    reported_total_posts: state.reported_total_posts, reported_total_pages: state.reported_total_pages,
    unique_records_collected: new Set(ids).size, rows_collected_including_duplicates: articles.length,
    duplicate_ids: duplicateIds, category_terms_collected: categoryTerms.length,
    category_pages_reported: state.reported_category_pages, page_statuses: state.page_statuses,
    coverage_complete: complete, stop_reason: complete ? null : 'capture incomplete; resume with the same checkpoint',
    first_page_total_headers: { X_WP_Total: state.reported_total_posts, X_WP_TotalPages: state.reported_total_pages },
    notes: ['Anonymous public GET only; no authentication or private content.', 'Only status=publish posts are retained.', 'Unknown/password-protected posts keep metadata only and are excluded from body/excerpt/heading capture.', 'All pages, category terms and verified-public body reads are checkpointed; HTTP 429 pauses without an immediate retry.'],
  };
  const inventory = { snapshot, articles };
  await saveJson(output, inventory);
  state.stop_reason = null; state.rate_limited_until = null; state.completed = complete;
  await persist();
  return { inventory, checkpointPath: checkpoint, outputPath: output };
}

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) result[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') || !argv[i + 1] ? true : argv[++i];
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const args = parseArgs(process.argv.slice(2));
  const delayMs = Math.max(1000, Number(args['delay-ms'] ?? 1500));
  try {
    const result = await capturePublicWpInventory({
      delayMs,
      checkpointPath: args.checkpoint ?? 'data/wp-public-inventory-checkpoint.json',
      outputPath: args.out ?? 'data/wp-public-inventory.json',
    });
    process.stdout.write(JSON.stringify({ snapshot: result.inventory.snapshot, output: result.outputPath, checkpoint: result.checkpointPath }, null, 2) + '\n');
    if (!result.inventory.snapshot.coverage_complete) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = error instanceof RateLimitPause ? 75 : 1;
  }
}
