import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectPublicCatalog } from './public-projection.mjs';
import { validateStructuredContent } from '../knowledge-textbook/content-renderer.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function normalizeExportBlock(block) {
  const name = String(block?.blockName ?? block?.type ?? 'unknown');
  const attrs = block?.attrs ?? {};
  const text = String(block?.text ?? block?.content ?? '');
  if (name === 'core/heading' || name === 'heading') return { type: 'heading', level: Number(attrs.level ?? block.level ?? 2), text, ...(attrs.anchor || block.anchor ? { anchor: String(attrs.anchor ?? block.anchor) } : {}) };
  if (name === 'core/paragraph' || name === 'paragraph') return { type: 'paragraph', text, links: (block.links ?? []).map(l => ({ text: String(l.text ?? ''), url: String(l.url ?? '') })) };
  if (name === 'core/list' || name === 'list') return { type: 'list', ordered: Boolean(attrs.ordered ?? block.ordered), items: (block.items ?? []).map(x => String(typeof x === 'string' ? x : x?.text ?? '')) };
  if (name === 'core/quote' || name === 'quote') return { type: 'quote', text, ...(block.attribution ? { attribution: String(block.attribution) } : {}) };
  if (name === 'core/code' || name === 'core/preformatted' || name === 'code') return { type: 'code', code: String(block.code ?? text), ...(block.language ? { language: String(block.language) } : {}) };
  if (name === 'core/image' || name === 'image') return { type: 'image', src: String(block.src ?? attrs.url ?? ''), alt: String(block.alt ?? attrs.alt ?? ''), ...(block.caption ? { caption: String(block.caption) } : {}) };
  return { type: 'interactive_fallback', label: 'Interactive content shown as a static note', summary: 'This block is not supported by the pilot reader. Open the original article to use it.', source_block_type: name.slice(0, 120) };
}

export function importStructuredExport(raw, catalog) {
  if (!raw || raw.provenance !== 'wordpress_export') throw new TypeError('Only wordpress_export provenance is accepted by production import');
  const projected = projectPublicCatalog(catalog);
  const entry = {
    schema_version: raw.schema_version,
    article_id: raw.article_id,
    canonical_url: raw.canonical_url,
    source_revision: raw.source_revision,
    source_hash: raw.source_hash,
    imported_at: raw.imported_at,
    provenance: raw.provenance,
    blocks: (raw.blocks ?? []).map(normalizeExportBlock),
  };
  return validateStructuredContent(entry, { catalog: projected });
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
