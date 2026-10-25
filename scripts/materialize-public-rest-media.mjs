import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = process.cwd();
const snapshotDir = resolve(root, 'reference/source-exports/public-rest-2026-10-25');
const metadataDir = snapshotDir;
const mediaDir = resolve(root, 'assets/media');
const postIds = [1073, 1077, 2241, 2310, 2494];
const mimeExtensions = new Map([
  ['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp'], ['image/gif', 'gif'],
]);
const sleep = ms => new Promise(resolveSleep => setTimeout(resolveSleep, ms));

function extractIds(posts) {
  const ids = new Set();
  const inline = new Map();
  for (const post of posts) {
    for (const match of post.content.rendered.matchAll(/<img\b[^>]*\bdata-attachment-id=["']?(\d+)/gi)) {
      const id = Number(match[1]);
      ids.add(id);
      const record = inline.get(id) ?? { article_ids: [], alt_texts: [] };
      if (!record.article_ids.includes(post.id)) record.article_ids.push(post.id);
      const alt = match[0].match(/\balt="([^"]*)"/i)?.[1] ?? '';
      if (alt && !record.alt_texts.includes(alt)) record.alt_texts.push(alt);
      inline.set(id, record);
    }
    if (post.featured_media) ids.add(post.featured_media);
  }
  return { ids: [...ids].sort((a, b) => a - b), inline };
}

async function getJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`GET ${url} returned HTTP ${response.status}`);
  return { body: await response.json(), etag: response.headers.get('etag'), lastModified: response.headers.get('last-modified') };
}

async function main() {
  const posts = await Promise.all(postIds.map(async id => JSON.parse(await readFile(resolve(snapshotDir, `post-${id}.json`), 'utf8'))));
  for (const post of posts) {
    if (post.status !== 'publish' || post.content?.protected !== false || typeof post.content?.rendered !== 'string') {
      throw new Error(`Post ${post.id} is not a verified public body snapshot`);
    }
  }
  const { ids, inline } = extractIds(posts);
  await mkdir(mediaDir, { recursive: true });
  const include = ids.join(',');
  const metadataUrl = `https://hybridmind.online/wp-json/wp/v2/media?include=${encodeURIComponent(include)}&per_page=100&_fields=id,date_gmt,modified_gmt,link,title,author,caption,alt_text,media_type,mime_type,source_url,media_details`;
  const metadataResponse = await getJson(metadataUrl);
  if (!Array.isArray(metadataResponse.body)) throw new Error('WordPress media endpoint did not return a collection');
  const byId = new Map(metadataResponse.body.map(item => [item.id, item]));
  const report = { source: metadataUrl, fetched_at: new Date().toISOString(), expected_ids: ids, assets: [] };

  for (const id of ids) {
    const item = byId.get(id);
    if (!item) {
      report.assets.push({ attachment_id: id, status: 'missing_public_metadata', inline: inline.has(id) });
      continue;
    }
    const extension = mimeExtensions.get(item.mime_type);
    const source = new URL(item.source_url);
    const allowedHost = source.hostname === 'hybridmind.online' || source.hostname === 'i0.wp.com';
    const allowedPath = source.pathname.includes('/wp-content/uploads/');
    if (!extension || source.protocol !== 'https:' || !allowedHost || !allowedPath || source.username || source.password || source.port) {
      report.assets.push({ attachment_id: id, status: 'rejected_media_source', mime_type: item.mime_type, source_url: item.source_url, inline: inline.has(id) });
      await writeFile(resolve(metadataDir, `media-${id}.json`), `${JSON.stringify({ ...item, _capture: { fetched_at: report.fetched_at, etag: metadataResponse.etag, last_modified: metadataResponse.lastModified } }, null, 2)}\n`, 'utf8');
      continue;
    }
    await writeFile(resolve(metadataDir, `media-${id}.json`), `${JSON.stringify({ ...item, _capture: { fetched_at: report.fetched_at, etag: metadataResponse.etag, last_modified: metadataResponse.lastModified } }, null, 2)}\n`, 'utf8');
    try {
      await sleep(1000);
      const response = await fetch(item.source_url, { headers: { accept: item.mime_type }, signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = (response.headers.get('content-type') ?? '').split(';')[0].toLowerCase();
      if (contentType !== item.mime_type) throw new Error(`unexpected content-type ${contentType}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length || bytes.length > 25 * 1024 * 1024) throw new Error(`invalid asset size ${bytes.length}`);
      const filename = `${id}.${extension}`;
      await writeFile(resolve(mediaDir, filename), bytes);
      report.assets.push({
        attachment_id: id, status: 'downloaded', filename, source_url: item.source_url,
        mime_type: item.mime_type, byte_length: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        modified_gmt: item.modified_gmt, author_id: item.author,
        alt_text: item.alt_text ?? '', title: item.title?.rendered ?? '', caption_html: item.caption?.rendered ?? '',
        inline_article_ids: inline.get(id)?.article_ids ?? [],
        inline_alt_texts: inline.get(id)?.alt_texts ?? [],
      });
    } catch (error) {
      report.assets.push({ attachment_id: id, status: 'download_failed', source_url: item.source_url, error: String(error.message), inline: inline.has(id) });
    }
  }
  await writeFile(resolve(snapshotDir, 'media-coverage-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  const failed = report.assets.filter(item => item.status !== 'downloaded');
  process.stdout.write(`${JSON.stringify({ requested: ids.length, downloaded: ids.length - failed.length, failed }, null, 2)}\n`);
  if (failed.length) process.exitCode = 2;
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
