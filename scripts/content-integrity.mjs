import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const LEGACY_CONTENT_FIELDS = ['article_id', 'canonical_url', 'source_revision', 'blocks'];
const REST_CONTENT_FIELDS = ['article_id', 'canonical_url', 'source_revision', 'source_hash', 'source_hash_status', 'source_hash_scope', 'content_derivation_status', 'blocks', 'media', 'featured_media_id'];

function canonicalize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(item => canonicalize(item) ?? 'null').join(',')}]`;
  const entries = Object.keys(value).sort().filter(key => value[key] !== undefined);
  return `{${entries.map(key => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
}

// The digest is SHA-256 over UTF-8 canonical JSON for stable source identity
// and normalized content. Object keys are sorted recursively; array order is
// preserved; there is no BOM or whitespace. Import timestamps and provenance
// are intentionally excluded so re-importing unchanged source keeps its digest.
export function canonicalContentSerialization(entry) {
  const fields = entry?.schema_version === '1.1.0' ? REST_CONTENT_FIELDS : LEGACY_CONTENT_FIELDS;
  const payload = Object.fromEntries(fields.filter(key => entry[key] !== undefined).map(key => [key, entry[key]]));
  return canonicalize(payload);
}

export function sha256Hex(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function computeContentDigest(entry) {
  return `sha256:${sha256Hex(Buffer.from(canonicalContentSerialization(entry), 'utf8'))}`;
}

export function attachContentDigest(entry) {
  return { ...entry, content_digest: computeContentDigest(entry) };
}

export function verifyContentDigest(entry) {
  if (entry?.schema_version === '1.1.0') {
    const source = entry.blocks?.find(block => block.type === 'html_fragment');
    if (!source || entry.source_hash_status !== 'source_bytes_verified' || entry.source_hash_scope !== 'wordpress_rest_content_rendered_utf8') {
      throw new TypeError(`REST source verification metadata is incomplete for ${entry?.article_id ?? 'unknown article'}`);
    }
    const actualSourceHash = `sha256:${sha256Hex(Buffer.from(source.html, 'utf8'))}`;
    if (actualSourceHash !== entry.source_hash) throw new TypeError(`Source byte hash mismatch for ${entry.article_id}`);
  }
  const expected = computeContentDigest(entry);
  if (entry?.content_digest !== expected) {
    throw new TypeError(`Content digest mismatch for ${entry?.article_id ?? 'unknown article'}: expected ${expected}`);
  }
  return entry;
}

export function verifyContentBundleDigests(bundle) {
  if (!bundle || !Array.isArray(bundle.articles)) throw new TypeError('Invalid content bundle for digest verification');
  bundle.articles.forEach(verifyContentDigest);
  return bundle;
}

export async function verifyContentMediaFiles(bundle, root) {
  const checked = new Set();
  for (const entry of bundle.articles) for (const media of entry.media ?? []) {
    if (checked.has(media.local_src)) continue;
    if (!/^\.\.\/assets\/media\/\d+\.(?:png|jpg|jpeg|webp|gif)$/.test(media.local_src)) throw new TypeError('Unsafe local media path');
    const bytes = await readFile(resolve(root, 'knowledge-textbook', media.local_src));
    if (bytes.length!==media.byte_length || `sha256:${sha256Hex(bytes)}`!==media.sha256) throw new TypeError(`Media integrity mismatch: ${media.attachment_id}`);
    checked.add(media.local_src);
  }
}
