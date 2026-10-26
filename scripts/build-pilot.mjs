import { cp, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { projectPublicCatalog } from './public-projection.mjs';
import { validateCatalog } from './validate-catalog.mjs';
import { verifyContentBundleDigests, verifyContentMediaFiles } from './content-integrity.mjs';
import { validateContentBundle } from '../knowledge-textbook/content-renderer.mjs';
import { applyContentRevisionOverlay } from './content-revision-overlay.mjs';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const distRoot = resolve(root, 'dist');
const target = resolve(distRoot, 'hybridmind-knowledge-phase1');
if (distRoot !== resolve(root, 'dist') || !target.startsWith(`${distRoot}${sep}`)) throw new Error('Refusing to build outside dist/');
const lint = spawnSync(process.execPath, ['scripts/lint-pilot.mjs'], { cwd: root, stdio: 'inherit' });
if (lint.status !== 0) process.exit(lint.status ?? 1);

const offlinePath = resolve(root, 'offline/pilot-catalog-full.json');
const sourceCatalogPath = existsSync(offlinePath) ? offlinePath : resolve(root, 'data/pilot-catalog.json');
const baseCatalog = JSON.parse(await readFile(sourceCatalogPath, 'utf8'));
const revisionOverlayPath = resolve(root, 'offline/public-rest-revision-overlay.json');
const revisionOverlay = existsSync(revisionOverlayPath) ? JSON.parse(await readFile(revisionOverlayPath, 'utf8')) : null;
const sourceCatalog = applyContentRevisionOverlay(baseCatalog, revisionOverlay);
const schema = JSON.parse(await readFile(resolve(root, 'contracts/knowledge-textbook-v1.schema.json'), 'utf8'));
const publicCatalog = projectPublicCatalog(sourceCatalog);
const errors = validateCatalog(publicCatalog, schema);
if (errors.length) throw new Error(`Public projection failed schema/reference validation:\n${errors.join('\n')}`);

// Source bodies are optional. Only validated WordPress exports are copied into
// the runnable package; synthetic test fixtures are never a build input.
const contentSourcePath = [resolve(root, 'offline/pilot-content-bundle.json'),resolve(root,'data/pilot-content-bundle.json')].find(existsSync);
let publicContentBundle = null;
if (contentSourcePath) {
  publicContentBundle = verifyContentBundleDigests(validateContentBundle(JSON.parse(await readFile(contentSourcePath, 'utf8')), { catalog: publicCatalog }));
  await verifyContentMediaFiles(publicContentBundle, root);
}

await mkdir(distRoot, { recursive: true });
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const path of ['package.json', 'contracts', 'docs', 'knowledge-textbook', 'scripts', 'search', 'tests', 'artifacts/screenshots', 'assets']) {
  await cp(resolve(root, path), resolve(target, path), { recursive: true, force: true });
}
await mkdir(resolve(target, 'data'), { recursive: true });
await writeFile(resolve(target, 'data/pilot-catalog.json'), `${JSON.stringify(publicCatalog, null, 2)}\n`, 'utf8');
if (publicContentBundle) await writeFile(resolve(target, 'data/pilot-content-bundle.json'), `${JSON.stringify(publicContentBundle, null, 2)}\n`, 'utf8');
await copyFile(resolve(root, 'knowledge-textbook/README.md'), resolve(target, 'README.md'));
await cp(resolve(root,'reference/source-exports/public-rest-2026-10-25'), resolve(target,'reference/source-exports/public-rest-2026-10-25'), {recursive:true});
for (const path of ['reference/source-exports/interactive-runtime-2026-10-25','artifacts/interactive','artifacts/reading-journey']) {
  if (existsSync(resolve(root,path))) await cp(resolve(root,path),resolve(target,path),{recursive:true});
}
for (const name of ['browser-content-evidence.json','interactive-browser-evidence.json','test-20261025.txt','search-evaluation-20261025.txt','interactive-validation-20261025.txt','reading-journey-validation.txt']) {
  const evidencePath = resolve(root,'artifacts',name);
  if (existsSync(evidencePath)) await copyFile(evidencePath,resolve(target,'artifacts',name));
}

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
