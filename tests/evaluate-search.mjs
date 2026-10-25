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
console.log('The 20 original cases are diagnostic only; topic labels are not IDs. Held-out metrics below use explicit editorial metadata labels, not body-level gold judgments.');
for (const c of fixture.cases) {
  const result=searchCatalog(catalog,c.query);
  console.log(JSON.stringify({case_id:c.case_id,answerable:c.answerable,expected_topic:c.expected_topic,mode:result.mode,result_count:result.total,top:result.results.slice(0,5).map(({kind,id,title})=>({kind,id,title}))}));
}
const heldout = JSON.parse(await readFile(new URL('./fixtures/heldout-search.json', import.meta.url), 'utf8'));
let sourceHitAt1 = 0, sourceHitAt5 = 0, sectionHitAt1 = 0, sectionHitAt5 = 0, answerableCount = 0, noAnswerEmpty = 0;
console.log(`\n# ${heldout.fixture_name} — ${heldout.cases.length} cases`);
console.log(heldout.judgment_limit);
for (const c of heldout.cases) {
  const result = searchCatalog(catalog, c.query);
  const top = result.results.slice(0, 5);
  const idsAt1 = new Set(result.results.slice(0, 1).map(item => item.id));
  const idsAt5 = new Set(top.map(item => item.id));
  if (c.answerable) {
    answerableCount++;
    if (idsAt1.has(c.expected_article_id)) sourceHitAt1++;
    if (idsAt5.has(c.expected_article_id)) sourceHitAt5++;
    if (idsAt1.has(c.expected_section_id)) sectionHitAt1++;
    if (idsAt5.has(c.expected_section_id)) sectionHitAt5++;
  } else if (result.total === 0) noAnswerEmpty++;
  console.log(JSON.stringify({case_id:c.case_id,answerable:c.answerable,expected_article_id:c.expected_article_id,expected_section_id:c.expected_section_id,body_support_verified:c.body_support_verified,mode:result.mode,result_count:result.total,top:top.map(({kind,id,title})=>({kind,id,title}))}));
}
console.log(JSON.stringify({heldout_summary:{answerableCount,sourceHitAt1,sourceHitAt5,sectionHitAt1,sectionHitAt5,noAnswerCases:heldout.cases.length-answerableCount,noAnswerEmpty}}));
