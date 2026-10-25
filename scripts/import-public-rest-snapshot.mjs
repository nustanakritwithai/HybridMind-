import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectPublicCatalog } from './public-projection.mjs';
import { attachContentDigest, sha256Hex } from './content-integrity.mjs';
import { applyContentRevisionOverlay } from './content-revision-overlay.mjs';
import { validateContentBundle } from '../knowledge-textbook/content-renderer.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const snapshotDir = resolve(root, 'reference/source-exports/public-rest-2026-10-25');
const captureIds = [1077, 1073, 2241, 2310, 2494];

function revisionUtc(value) {
  const normalized = new Date(`${value}Z`).toISOString();
  if (!normalized || normalized === 'Invalid Date') throw new TypeError(`Invalid WordPress modified_gmt value: ${value}`);
  return normalized;
}

function decodeHtml(value) {
  return String(value ?? '').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#0*39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function plainText(html) { return decodeHtml(String(html ?? '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim(); }

function attr(tag, name) {
  const found = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return decodeHtml(found?.[1] ?? found?.[2] ?? found?.[3] ?? '');
}

function idsFromHtml(html) {
  const ids = [];
  for (const match of html.matchAll(/\bdata-attachment-id\s*=\s*["']?(\d+)/gi)) ids.push(Number(match[1]));
  return [...new Set(ids)];
}

function count(html, pattern) { return [...html.matchAll(pattern)].length; }

async function main() {
  const catalogPath = existsSync(resolve(root,'offline/pilot-catalog-full.json')) ? 'offline/pilot-catalog-full.json' : 'data/pilot-catalog.json';
  const catalog = JSON.parse(await readFile(resolve(root, catalogPath), 'utf8'));
  const mediaReport = JSON.parse(await readFile(resolve(snapshotDir, 'media-coverage-report.json'), 'utf8'));
  const mediaById = new Map(mediaReport.assets.filter(item => item.status === 'downloaded').map(item => [item.attachment_id, item]));
  const mediaJsonById = new Map();
  for (const captureId of captureIds) {
    const post = JSON.parse(await readFile(resolve(snapshotDir, `post-${captureId}.json`), 'utf8'));
    if (post.status !== 'publish' || post.content?.protected !== false || typeof post.content?.rendered !== 'string') {
      throw new TypeError(`Refusing non-public or incomplete WordPress body ${captureId}`);
    }
    const articleId = `hm:article:${captureId}`;
    const sourceArticle = catalog.articles.find(article => article.article_id === articleId);
    if (!sourceArticle || sourceArticle.status !== 'published' || sourceArticle.visibility !== 'public' || sourceArticle.password_protected !== false) {
      throw new TypeError(`Article ${articleId} is not explicitly public in the inventory`);
    }
    if (post.link !== sourceArticle.canonical_url) throw new TypeError(`Canonical URL mismatch for ${articleId}`);
    const sourceRevision = revisionUtc(post.modified_gmt);
    const body = post.content.rendered;
    const sourceBytes = Buffer.from(body, 'utf8');
    const sourceHash = `sha256:${sha256Hex(sourceBytes)}`;
    const imageIds = idsFromHtml(body);
    const requiredMediaIds = [...new Set([...imageIds, ...(post.featured_media ? [post.featured_media] : [])])].sort((a,b) => a-b);
    const media = [];

    for (const id of requiredMediaIds) {
      const report = mediaById.get(id);
      if (!report) throw new TypeError(`Required attachment ${id} was not downloaded`);
      const item = JSON.parse(await readFile(resolve(snapshotDir, `media-${id}.json`), 'utf8'));
      const bytes = await readFile(resolve(root, 'assets/media', report.filename));
      if (bytes.length !== report.byte_length || `sha256:${sha256Hex(bytes)}` !== `sha256:${report.sha256}`) throw new TypeError(`Local attachment integrity check failed: ${id}`);
      mediaJsonById.set(id, item);
      const imgTag = [...body.matchAll(/<img\b[^>]*>/gi)].map(match => match[0]).find(tag => Number(attr(tag, 'data-attachment-id')) === id);
      media.push({
        attachment_id: id, source_url: item.source_url, local_src: `../assets/media/${report.filename}`,
        mime_type: item.mime_type, byte_length: report.byte_length, sha256: `sha256:${report.sha256}`,
        modified_gmt: item.modified_gmt, author_id: item.author,
        alt_text: imgTag ? attr(imgTag, 'alt') : (item.alt_text ?? ''),
        title: item.title?.rendered ?? '', caption: plainText(item.caption?.rendered ?? ''),
        source_description: imgTag ? plainText(attr(imgTag, 'data-image-description')) : '',
        source_title: imgTag ? plainText(attr(imgTag, 'data-image-title')) : '',
        source_caption: imgTag ? plainText(attr(imgTag, 'data-image-caption')) : '',
      });
    }

    const entry = attachContentDigest({
      schema_version: '1.1.0', article_id: articleId, canonical_url: post.link,
      source_revision: sourceRevision, source_hash: sourceHash, source_hash_status: 'source_bytes_verified',
      source_hash_scope: 'wordpress_rest_content_rendered_utf8', content_derivation_status: 'unverified',
      imported_at: new Date().toISOString(), provenance: 'wordpress_export',
      blocks: [{ type: 'html_fragment', html: body }], media, featured_media_id: post.featured_media || null,
    });
    const visibleBody = body.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
    const headings = [...visibleBody.matchAll(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1\s*>/gi)].map(match=>({text:plainText(match[3]).normalize('NFKC'),anchor:attr(match[2],'id')||null}));
    const used = new Set();
    for (const section of catalog.sections.filter(item=>item.article_id===articleId)) {
      const index = headings.findIndex((heading,i)=>!used.has(i) && heading.text===plainText(section.heading_text).normalize('NFKC'));
      if(index<0) throw new Error(`Source heading mapping needs editorial review: ${section.section_id}`);
      used.add(index);
      sectionRevisions.push({section_id:section.section_id,article_id:articleId,source_revision:sourceRevision,anchor:headings[index].anchor});
    }
    const duplicateAnchors = [...visibleBody.matchAll(/\bid="([^"]+)"/gi)].map(match => match[1]).filter((id, index, all) => all.indexOf(id) !== index);
    const sourceAnchors = new Set([...body.matchAll(/\bid="([^"]+)"/gi)].map(match => match[1]));
    const internalLinks = [...body.matchAll(/\bhref="#([^" ]+)"/gi)].map(match => decodeHtml(match[1]));
    const missingAnchors = [...new Set(internalLinks.filter(anchor => !sourceAnchors.has(anchor)))];
    const unresolvedMedia = imageIds.filter(id => !mediaById.has(id));
    const stats = {
      article_id: articleId, canonical_url: post.link, source_revision: sourceRevision,
      source_hash: sourceHash, source_hash_scope: 'WordPress REST content.rendered UTF-8 string; this is not the inaccessible Library ZIP or raw database payload',
      response_sha256: sha256Hex(await readFile(resolve(snapshotDir, `post-${captureId}.json`))),
      body_bytes: sourceBytes.length, heading_count: headings.length, matched_catalog_sections: used.size,
      inline_image_count: imageIds.length, inline_attachment_ids: imageIds,
      featured_media_id: post.featured_media || null, media_ids: requiredMediaIds,
      script_tag_count: count(body, /<script\b/gi), iframe_count: count(body, /<iframe\b/gi),
      form_or_control_count: count(body, /<(?:form|input|button|select|textarea|video|audio|canvas)\b/gi),
      duplicate_anchors: [...new Set(duplicateAnchors)], missing_internal_anchors: missingAnchors,
      unresolved_media: unresolvedMedia,
    };
    if (stats.duplicate_anchors.length || missingAnchors.length || unresolvedMedia.length) throw new TypeError(`Source integrity check failed for ${articleId}: ${JSON.stringify(stats)}`);
    entries.push(entry);
    revisions.push({ article_id: articleId, canonical_url: post.link, source_revision: sourceRevision, source_hash: sourceHash });
    coverage.push(stats);
  }

  const overlay = { schema_version: '1.0.0', source: 'public_wordpress_rest_read_only', captured_at: new Date().toISOString(), articles: revisions, sections: sectionRevisions };
  const revisedCatalog = applyContentRevisionOverlay(catalog, overlay);
  const publicCatalog = projectPublicCatalog(revisedCatalog);
  const bundle = { schema_version: '1.0.0', articles: entries };
  validateContentBundle(bundle, { catalog: publicCatalog });
  const overlayPath = resolve(root, 'offline/public-rest-revision-overlay.json');
  const bundlePath = resolve(root, 'offline/pilot-content-bundle.json');
  const reportPath = resolve(snapshotDir, 'body-content-coverage-report.json');
  await mkdir(resolve(root,'offline'),{recursive:true});
  await writeFile(overlayPath, `${JSON.stringify(overlay, null, 2)}\n`, 'utf8');
  await writeFile(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');
  const report = {
    captured_at: overlay.captured_at, source: 'anonymous public WordPress REST GET',
    original_library_archive: { id: 'libfile_fb252f7af73c81919d1a22d98d2c2f9b', expected_sha256: '95fddb90552378bb6494441a85cf8af5c3134a5eb133e24d83db7857b0237b62', materialized: false, blocker: 'Bundled Library helper retried once and returned hosted apps tools/list request failed: network.' },
    actual_source_scope: 'Five public published articles confirmed by REST status=publish and content.protected=false; rendered content field and public media downloaded.',
    overall: { articles: entries.length, full_bodies: entries.length, images_local: mediaById.size, original_revisions_reconciled: true, editorial_mappings_remain_proposed: true },
    articles: coverage,
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({ bundle: bundlePath, overlay: overlayPath, report: reportPath, articles: entries.length, inlineImages: coverage.reduce((sum, item) => sum + item.inline_image_count, 0), featuredAndInlineMedia: mediaById.size }, null, 2)}\n`);
}

const entries = [];
const revisions = [];
const coverage = [];
const sectionRevisions = [];

main().catch(error => { console.error(error.message); process.exitCode = 1; });
