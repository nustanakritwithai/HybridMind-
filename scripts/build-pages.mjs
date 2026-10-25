import { cp, copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const target = resolve(root, 'dist/pages');
if (!target.startsWith(`${resolve(root, 'dist')}${sep}`)) throw new Error('Unsafe Pages build target');
const build = spawnSync(process.execPath, ['scripts/build-pilot.mjs'], { cwd: root, stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);
const source = resolve(root, 'dist/hybridmind-knowledge-phase1');
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
// Preserve the pre-existing design preview byte for byte at the site root.
await copyFile(resolve(root, 'index.html'), resolve(target, 'index.html'));
const files = [
  'knowledge-textbook/index.html', 'knowledge-textbook/app.js',
  'knowledge-textbook/content-renderer.mjs', 'knowledge-textbook/styles.css',
  'search/local-search.mjs', 'search/safe-url.mjs',
  'data/pilot-catalog.json', 'data/pilot-content-bundle.json',
];
for (const file of files) {
  await mkdir(resolve(target, file, '..'), { recursive: true });
  await copyFile(resolve(source, file), resolve(target, file));
}
await cp(resolve(source, 'assets/media'), resolve(target, 'assets/media'), { recursive: true });
for (const name of await readdir(resolve(target, 'assets/media'))) files.push(`assets/media/${name}`);
files.push('index.html');
const hashes = {};
for (const file of files.sort()) hashes[file] = createHash('sha256').update(await readFile(resolve(target, file))).digest('hex');
const git = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
const commit = git.stdout?.trim();
if (git.status !== 0 || !/^[a-f0-9]{40}$/.test(commit)) throw new Error('A Git checkout is required to stamp the deployment version');
if (process.env.HM_RELEASE_SHA && process.env.HM_RELEASE_SHA !== commit) throw new Error('Release SHA differs from checked-out source');
await writeFile(resolve(target, 'release.json'), JSON.stringify({
  schema_version: 1, source_commit: commit, reader_path: 'knowledge-textbook/',
  source_capture: 'public-rest-2026-10-25', articles: 5, sections: 138,
  unique_media: 20, interactive_parity: false, sha256: hashes,
}, null, 2) + '\n');
await writeFile(resolve(target, '.nojekyll'), '');
console.log(`Pages artifact: ${target}; source commit ${commit}; ${files.length} public runtime files.`);
