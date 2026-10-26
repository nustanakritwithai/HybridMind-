import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {searchCatalog} from '../search/local-search.mjs';
import {prepareInteractiveEntries,approvedLabRoots} from '../knowledge-textbook/labs/registry.mjs';
import {verifyContentBundleDigests,verifyContentMediaFiles} from '../scripts/content-integrity.mjs';
const root=new URL('../',import.meta.url);
const read=async name=>JSON.parse(await readFile(new URL(name,root),'utf8'));
const catalog=await read('data/pilot-catalog.json'),bundle=await read('data/pilot-content-bundle.json');
const hash=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const added=[1740,1755,1770].map(id=>'hm:article:'+id);
test('new three article capture is public, complete and byte-for-byte attributable',async()=>{
 const manifest=await read('reference/source-exports/public-rest-2026-10-26/capture-manifest.json');
 assert.equal(manifest.complete,true);assert.equal(manifest.posts.length,3);assert.equal(manifest.media.length,15);
 for(const id of added){
  const entry=bundle.articles.find(a=>a.article_id===id),wp=+id.split(':').at(-1),proof=manifest.posts.find(p=>p.id===wp);
  const raw=await readFile(new URL('reference/source-exports/public-rest-2026-10-26/post-'+wp+'.json',root),'utf8'),source=JSON.parse(raw);
  assert.equal(hash(raw),proof.response_sha256);assert.equal(source.status,'publish');assert.equal(source.content.protected,false);
  assert.equal(entry.blocks[0].html,source.content.rendered);assert.equal(entry.canonical_url,source.link);assert.equal(entry.source_revision,new Date(source.modified_gmt+'Z').toISOString());
  assert.equal(entry.source_hash,'sha256:'+proof.body_sha256);
  assert.ok(entry.blocks[0].html.includes('SIMULATION'),id+' preserves simulation notice');
  for(const label of ['FACT','CLAIM','ANALYSIS','SIMULATION'])assert.equal(entry.blocks[0].html.split(label).length,source.content.rendered.split(label).length,id+' preserves original '+label+' labels without inventing source labels');
 }
 verifyContentBundleDigests(bundle);
 await verifyContentMediaFiles(bundle,fileURLToPath(root));
});
test('original five article metadata, sections, topics, path and bodies retain their revisions',async()=>{
 const baseline=await read('tests/fixtures/pre-evidence-contract.json');
 const oldArticleIds=new Set(baseline.article_ids),oldTopicIds=new Set(baseline.topic_ids),oldPathIds=new Set(baseline.path_ids);
 assert.equal(hash(catalog.articles.filter(a=>oldArticleIds.has(a.article_id))),baseline.articles_sha256);
 assert.equal(hash(catalog.sections.filter(s=>oldArticleIds.has(s.article_id))),baseline.sections_sha256);
 assert.equal(hash(catalog.topics.filter(t=>oldTopicIds.has(t.topic_id))),baseline.topics_sha256);
 assert.equal(hash(catalog.learning_paths.filter(p=>oldPathIds.has(p.path_id))),baseline.paths_sha256);
 assert.equal(hash(bundle.articles.filter(a=>oldArticleIds.has(a.article_id))),baseline.bodies_sha256);
 assert.equal(catalog.topics.find(t=>t.topic_id==='hm:topic:verify-ai-work').topic_revision,1);
});
test('proposed three-step sequence and difficulty remain explicit and separate from source approval',()=>{
 const topics=['retrieval-evaluation','evidence-sufficiency','claim-decomposition'].map(k=>'hm:topic:'+k);
 const path=catalog.learning_paths.find(p=>p.path_id==='hm:path:evidence-to-answer');
 assert.deepEqual(path.ordered_topic_ids,topics);assert.equal(path.status,'proposed');
 assert.deepEqual(topics.map(id=>catalog.topics.find(t=>t.topic_id===id).audience_level),['beginner','intermediate','advanced']);
 for(const id of added){const a=catalog.articles.find(x=>x.article_id===id);assert.deepEqual(a.topic_ids,[]);assert.equal(a.primary_topic_id,null);assert.equal(a.content_state,'review_needed');assert.ok(catalog.relationships.filter(r=>r.to_id===id).every(r=>r.review_status==='proposed'));assert.equal(a.content_type,'explainer');}
 assert.equal(new Set(catalog.sections.map(s=>s.section_id)).size,233);
});
test('new title/body keyword queries, topic and level filters resolve real source entries',()=>{
 for(const [id,query,level]of [[1740,'Retrieval Evaluation','beginner'],[1755,'Evidence Sufficiency','intermediate'],[1770,'Claim Decomposition','advanced']]){
  const result=searchCatalog(catalog,query,{difficulty:level},bundle.articles);assert.ok(result.results.slice(0,5).some(r=>r.id==='hm:article:'+id),query);
  const topic=catalog.relationships.find(r=>r.to_id==='hm:article:'+id).from_id;
  const filtered=searchCatalog(catalog,'',{topicId:topic},bundle.articles);
  assert.equal(filtered.results.filter(r=>r.kind==='article').length,1);assert.ok(filtered.results.every(r=>r.topicId===topic));
 }
 assert.equal(searchCatalog(catalog,'zzqvnonexistentphrase977',{},bundle.articles).total,0);
});
test('expanded corpus keeps all seven historical expected sections in top five',async()=>{
 const fixture=await read('tests/fixtures/heldout-search.json');
 for(const c of fixture.cases.filter(c=>c.answerable))assert.ok(searchCatalog(catalog,c.query).results.slice(0,5).some(r=>r.id===c.expected_section_id),c.case_id);
});
test('new source mutations cannot enable reviewed local runtime and no imported script is evaluated',async()=>{
 for(const id of added){
  const entry=bundle.articles.find(e=>e.article_id===id);
  await prepareInteractiveEntries([entry]);assert.equal(Object.keys(approvedLabRoots(entry)).length,2);
  for(const mutate of [e=>e.blocks[0].html+='<script>globalThis.untrustedExecuted=true</script>',e=>e.source_revision='changed',e=>e.canonical_url='https://example.com/',e=>e.source_hash_status='unverified']){
   const changed=structuredClone(entry);mutate(changed);assert.deepEqual(await prepareInteractiveEntries([changed]),[]);assert.equal(approvedLabRoots(changed),null);
  }
 }
 assert.equal(globalThis.untrustedExecuted,undefined);
});
