import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectPublicCatalog } from './public-projection.mjs';
import { attachContentDigest, sha256Hex } from './content-integrity.mjs';
import { validateStructuredContent } from '../knowledge-textbook/content-renderer.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function normalizeExportBlock(block) {
  const name = String(block?.blockName ?? block?.type ?? 'unknown');
  const attrs = block?.attrs ?? {};
  const text = String(block?.text ?? block?.content ?? '');
  if (name === 'core/heading' || name === 'heading') return { type: 'heading', level: Number(attrs.level ?? block.level ?? 2), text, ...(attrs.anchor || block.anchor ? { anchor: String(attrs.anchor ?? block.anchor) } : {}) };
  if (name === 'core/paragraph' || name === 'paragraph') return { type: 'paragraph', text, links: (block.links ?? []).map(l => ({ text: String(l.text ?? ''), url: String(l.url ?? ''), start: Number(l.start), end: Number(l.end) })) };
  if (name === 'core/list' || name === 'list') return { type: 'list', ordered: Boolean(attrs.ordered ?? block.ordered), items: (block.items ?? []).map(x => String(typeof x === 'string' ? x : x?.text ?? '')) };
  if (name === 'core/quote' || name === 'quote') return { type: 'quote', text, ...(block.attribution ? { attribution: String(block.attribution) } : {}) };
  if (name === 'core/code' || name === 'core/preformatted' || name === 'code') return { type: 'code', code: String(block.code ?? text), ...(block.language ? { language: String(block.language) } : {}) };
  if (name === 'core/image' || name === 'image') return { type: 'image', src: String(block.src ?? attrs.url ?? ''), alt: String(block.alt ?? attrs.alt ?? ''), ...(block.caption ? { caption: String(block.caption) } : {}) };
  return { type: 'interactive_fallback', label: 'Interactive content shown as a static note', summary: 'This block is not supported by the pilot reader. Open the original article to use it.', source_block_type: name.slice(0, 120) };
}

function sourceIntegrity(raw) {
  if (raw.source_payload_base64 === undefined) return { source_hash: null, source_hash_status: 'unverified' };
  const encoded = raw.source_payload_base64;
  if (typeof encoded !== 'string' || encoded.length === 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
    throw new TypeError('source_payload_base64 must contain the exact source bytes in canonical base64');
  }
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.toString('base64') !== encoded) throw new TypeError('source_payload_base64 is not canonical base64');
  const source_hash = `sha256:${sha256Hex(bytes)}`;
  if (raw.source_hash !== undefined && raw.source_hash !== source_hash) throw new TypeError('Claimed source_hash does not match source_payload_base64');
  return { source_hash, source_hash_status: 'verified' };
}

export function importStructuredExport(raw, catalog) {
  if (!raw || raw.provenance !== 'wordpress_export') throw new TypeError('Only wordpress_export provenance is accepted by production import');
  const projected = projectPublicCatalog(catalog);
  const source = sourceIntegrity(raw);
  const entry = {
    schema_version: raw.schema_version,
    article_id: raw.article_id,
    canonical_url: raw.canonical_url,
    source_revision: raw.source_revision,
    ...source,
    imported_at: raw.imported_at,
    provenance: raw.provenance,
    blocks: (raw.blocks ?? []).map(normalizeExportBlock),
  };
  return validateStructuredContent(attachContentDigest(entry), { catalog: projected });
}

async function main() {
  const [inputArg, outputArg, catalogArg] = process.argv.slice(2);
  if (!inputArg || !outputArg) throw new Error('Usage: node scripts/import-structured-content.mjs <wordpress-export.json> <output.json> [public-catalog.json]');
  const input = resolve(inputArg);
  const output = resolve(outputArg);
  const catalogPath = catalogArg ? resolve(catalogArg) : resolve(root, 'offline/pilot-catalog-full.json');
  const [raw, catalog] = await Promise.all([
    readFile(input, 'utf8').then(JSON.parse),
    readFile(catalogPath, 'utf8').then(JSON.parse),
  ]);
  const normalized = importStructuredExport(raw, catalog);
  const bundle = { schema_version: '1.0.0', articles: [normalized] };
  await writeFile(output, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');
  process.stdout.write(`Imported ${normalized.article_id} (${normalized.blocks.length} safe blocks) to ${output}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
