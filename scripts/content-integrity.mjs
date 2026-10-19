import { createHash } from 'node:crypto';

const CONTENT_FIELDS = ['article_id', 'canonical_url', 'source_revision', 'blocks'];

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
  const payload = Object.fromEntries(CONTENT_FIELDS.filter(key => entry[key] !== undefined).map(key => [key, entry[key]]));
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
