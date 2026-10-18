import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {searchCatalog} from '../search/local-search.mjs';
import {projectPublicCatalog} from '../scripts/public-projection.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const offlinePath=resolve(root,'offline/pilot-catalog-full.json');
const [explicitCatalogPath]=process.argv.slice(2);
const catalogPath=explicitCatalogPath ? resolve(explicitCatalogPath) : existsSync(offlinePath) ? offlinePath : resolve(root,'data/pilot-catalog.json');
const [rawCatalog,fixture]=await Promise.all([
  readFile(catalogPath,'utf8').then(JSON.parse),
  readFile(new URL('./fixtures/queries.json',import.meta.url),'utf8').then(JSON.parse)
]);
const catalog=projectPublicCatalog(rawCatalog);
console.log(`# ${fixture.fixture_name} — ${fixture.cases.length} cases`);
console.log('Human labels are not gold IDs; results below are diagnostic only. No relevance metrics are calculated.');
for (const c of fixture.cases) {
  const result=searchCatalog(catalog,c.query);
  console.log(JSON.stringify({case_id:c.case_id,answerable:c.answerable,expected_topic:c.expected_topic,mode:result.mode,result_count:result.total,top:result.results.slice(0,5).map(({kind,id,title})=>({kind,id,title}))}));
}
