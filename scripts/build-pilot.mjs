import { cp, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { projectPublicCatalog } from './public-projection.mjs';
import { validateCatalog } from './validate-catalog.mjs';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const distRoot = resolve(root, 'dist');
const target = resolve(distRoot, 'hybridmind-knowledge-phase1');
if (distRoot !== resolve(root, 'dist') || !target.startsWith(`${distRoot}${sep}`)) throw new Error('Refusing to build outside dist/');
const lint = spawnSync(process.execPath, ['scripts/lint-pilot.mjs'], { cwd: root, stdio: 'inherit' });
if (lint.status !== 0) process.exit(lint.status ?? 1);

const offlinePath = resolve(root, 'offline/pilot-catalog-full.json');
const sourceCatalogPath = existsSync(offlinePath) ? offlinePath : resolve(root, 'data/pilot-catalog.json');
const sourceCatalog = JSON.parse(await readFile(sourceCatalogPath, 'utf8'));
const schema = JSON.parse(await readFile(resolve(root, 'contracts/knowledge-textbook-v1.schema.json'), 'utf8'));
const publicCatalog = projectPublicCatalog(sourceCatalog);
const errors = validateCatalog(publicCatalog, schema);
if (errors.length) throw new Error(`Public projection failed schema/reference validation:\n${errors.join('\n')}`);

await mkdir(distRoot, { recursive: true });
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const path of ['package.json', 'contracts', 'docs', 'knowledge-textbook', 'scripts', 'search', 'tests', 'artifacts/screenshots']) {
  await cp(resolve(root, path), resolve(target, path), { recursive: true, force: true });
}
await mkdir(resolve(target, 'data'), { recursive: true });
await writeFile(resolve(target, 'data/pilot-catalog.json'), `${JSON.stringify(publicCatalog, null, 2)}\n`, 'utf8');
await copyFile(resolve(root, 'knowledge-textbook/README.md'), resolve(target, 'README.md'));

// Ship planning references, but keep the full normalized and raw inventories
// in the source worktree's offline/ and reference/inventory/ directories.
const selectedReferences = [
  'reference/hybridmind-knowledge-phase1-plan.md', 'reference/acceptance.md', 'reference/queries.json',
];
for (const path of selectedReferences) {
  const destination = resolve(target, path);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(resolve(root, path), destination);
}
process.stdout.write(`Runnable public-only build written to ${target} (${publicCatalog.articles.length} articles, ${publicCatalog.sections.length} sections).\n`);
