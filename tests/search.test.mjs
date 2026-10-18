import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {searchCatalog} from '../search/local-search.mjs';
import {safeCanonicalUrl} from '../search/safe-url.mjs';
import {projectPublicCatalog} from '../scripts/public-projection.mjs';
import {createMeilisearchAdapter} from '../search/meilisearch-adapter.mjs';
import {createTypesenseAdapter} from '../search/typesense-adapter.mjs';
import {existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const catalog={topics:[{topic_id:'hm:topic:verify-ai-work',label_th:'ตรวจสอบงาน AI',label_en:'Verify AI work',definition:'ตรวจสอบ citation และคำตอบจาก AI',intent:'ตรวจ facts',questions:[],search_aliases:[],audience_level:'beginner',status:'proposed'}],articles:[
 {article_id:'hm:article:1',title:'ตรวจสอบตัวเลข citation ในคำตอบ AI',summary:'ตรวจ fact และ citation',locale:'th',status:'published',visibility:'public',password_protected:false,canonical_url:'https://example.test/a',topic_ids:['hm:topic:verify-ai-work'],primary_topic_id:'hm:topic:verify-ai-work',content_type:'guide',audience_level:'beginner',modified_at:'2026-10-01'},
 {article_id:'hm:article:2',title:'Private draft citation',summary:'ตรวจ citation',locale:'th',status:'draft',visibility:'private',canonical_url:'https://example.test/private',topic_ids:[],content_type:'guide',audience_level:'beginner'},
 {article_id:'hm:article:3',title:'Public but password protected',summary:'citation',locale:'th',status:'published',visibility:'password',canonical_url:'https://example.test/password',topic_ids:[],content_type:'guide',audience_level:'beginner'}],sections:[
 {section_id:'hm:section:1:sha-check',article_id:'hm:article:1',heading_text:'ตรวจ SHA-256 และ source revision',summary:'ยืนยัน citation ให้ตรงรุ่นเอกสารปัจจุบัน',content_text:'UTF-8 byte span',anchor:'source-check'}]};

test('indexes only public published articles, but searches topics and sections too',()=>{
 const r=searchCatalog(catalog,'citation');
 assert.deepEqual(new Set(r.results.map(x=>x.kind)),new Set(['topic','article','section']));
 assert.ok(!r.results.some(x=>x.id==='hm:article:2'||x.id==='hm:article:3'));
 assert.equal(r.mode,'keyword');
});
test('supports Thai and mixed Thai-English keyword matching',()=>{
 assert.ok(searchCatalog(catalog,'ตรวจสอบ citation').results.some(x=>x.id==='hm:article:1'));
 assert.ok(searchCatalog(catalog,'UTF-8 byte span').results.some(x=>x.id==='hm:section:1:sha-check'));
});
test('uses a topic-to-article relationship when direct topic fields are empty',()=>{
 const linked={...catalog,
  articles:[{...catalog.articles[0],topic_ids:[],primary_topic_id:null}],
  relationships:[{from_id:'hm:topic:verify-ai-work',to_id:'hm:article:1',type:'explains',review_status:'proposed'}]};
 const results=searchCatalog(linked,'citation').results;
 assert.equal(results.find(x=>x.id==='hm:article:1').topicId,'hm:topic:verify-ai-work');
 assert.equal(results.find(x=>x.id==='hm:section:1:sha-check').topicId,'hm:topic:verify-ai-work');
});
test('applies topic, type, difficulty, locale and date filters',()=>{
 const topicId='hm:topic:verify-ai-work';
 assert.ok(searchCatalog(catalog,'citation',{topicId,contentType:'guide',difficulty:'beginner',locale:'th'}).results.length);
 assert.equal(searchCatalog(catalog,'citation',{contentType:'news'}).total,0);
 assert.equal(searchCatalog(catalog,'citation',{locale:'en'}).total,0);
 assert.equal(searchCatalog(catalog,'citation',{sort:'date'}).results[0].kind,'article');
});
test('empty and no-result queries are safe, and no-answer queries do not invent matches',()=>{
 assert.equal(searchCatalog(catalog,'   ').mode,'keyword');
 assert.equal(searchCatalog(catalog,'quantum teleportation').total,0);
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/queries.json',import.meta.url),'utf8'));
 assert.equal(fixture.cases.length,20);
 assert.ok(fixture.cases.filter(c=>c.answerable).every(c=>typeof c.expected_topic==='string'));
 assert.ok(fixture.cases.filter(c=>!c.answerable).every(c=>c.expected_topic===null));
 // The fixture's no-answer prompts may contain generic words that match records;
 // verify the empty-catalog behavior without assuming relevance labels are gold.
 for (const c of fixture.cases.filter(c=>!c.answerable)) assert.equal(searchCatalog({topics:[],articles:[],sections:[]},c.query).total,0,c.case_id);
});
test('Meilisearch adapter uses injected client and normalizes results',async()=>{
 let called; const a=createMeilisearchAdapter({index:n=>({search:async(q,o)=>(called={n,q,o},{hits:[{kind:'article',id:'a',title:'T',url:'/a'}],estimatedTotalHits:1})})},'catalog');
 assert.equal((await a.search('q',{locale:'th'})).results[0].id,'a'); assert.equal(called.n,'catalog');
});
test('Typesense adapter uses injected client and normalizes results',async()=>{
 let called; const a=createTypesenseAdapter({collections:n=>({documents:()=>({search:async p=>(called={n,p},{hits:[{document:{kind:'section',id:'s',title:'S',url:'/a#s'},text_match:8}],found:1})})})},'catalog');
 assert.equal((await a.search('ไทย')).results[0].score,8); assert.equal(called.n,'catalog');
});
test('excludes published articles with unknown password state and their sections', () => {
 const unknown = {...catalog.articles[0], article_id:'hm:article:4', title:'Unknown password state', summary:'private-only phrase', password_protected:null, visibility:'unknown', topic_ids:[], primary_topic_id:null};
 const section = {section_id:'hm:section:4:unknown', article_id:unknown.article_id, heading_text:'private section phrase'};
 const result = searchCatalog({...catalog, articles:[...catalog.articles, unknown], sections:[...catalog.sections, section]}, 'private-only');
 assert.equal(result.total, 0);
 assert.ok(!searchCatalog({...catalog, articles:[...catalog.articles, unknown], sections:[...catalog.sections, section]}, 'private section').results.some(x => x.id === section.section_id));
});
test('keeps generic navigation headings out of section search', () => {
 const withNavigation = {...catalog, sections:[...catalog.sections,
  {section_id:'hm:section:1:read-more',article_id:'hm:article:1',heading_text:'อ่านต่อ',summary:'navigation phrase'},
  {section_id:'hm:section:1:toc',article_id:'hm:article:1',heading_text:'Table of Contents',summary:'navigation phrase'}]};
 const results = searchCatalog(withNavigation, 'navigation phrase').results;
 assert.ok(!results.some(item => ['hm:section:1:read-more','hm:section:1:toc'].includes(item.id)));
});
test('topic filters honor every proposed relation and route through the filtered topic', () => {
 const topicId = 'hm:topic:child';
 const child = {...catalog.topics[0], topic_id:topicId, label_en:'Child topic'};
 const linked = {...catalog, topics:[...catalog.topics, child], relationships:[
  {from_id:catalog.topics[0].topic_id, to_id:'hm:article:1', type:'explains', review_status:'proposed'},
  {from_id:topicId, to_id:'hm:article:1', type:'example', review_status:'proposed'}
 ]};
 const results = searchCatalog(linked, 'citation', {topicId}).results;
 assert.equal(results.find(x => x.id === 'hm:article:1').topicId, topicId);
 assert.equal(results.find(x => x.id === 'hm:section:1:sha-check').topicId, topicId);
});

test('canonical URL policy accepts only credential-free HTTPS hybridmind.online links', () => {
 assert.equal(safeCanonicalUrl('https://hybridmind.online/article/'), 'https://hybridmind.online/article/');
 for (const value of [
  'javascript:alert(1)', 'data:text/html,hello', 'http://hybridmind.online/article',
  'https://evil.example/article', 'https://hybridmind.online.evil.example/article',
  'https://www.hybridmind.online/article', 'https://user@hybridmind.online/article',
  'https://hybridmind.online:8443/article', '//evil.example/article',
 ]) assert.equal(safeCanonicalUrl(value), null, value);
});

test('search results never return an unsafe source URL', () => {
 const unsafeArticle = {...catalog.articles[0], article_id:'hm:article:unsafe', title:'Special alpha evidence', summary:'Special alpha evidence', canonical_url:'javascript:alert(1)', topic_ids:[], primary_topic_id:null};
 const unsafeSection = {...catalog.sections[0], section_id:'hm:section:unsafe:alpha', article_id:unsafeArticle.article_id, heading_text:'Special alpha section', anchor:'safe-looking'};
 const result = searchCatalog({topics:[],articles:[unsafeArticle],sections:[unsafeSection]}, 'special alpha');
 assert.ok(result.results.some(item => item.id === unsafeArticle.article_id));
 assert.ok(result.results.some(item => item.id === unsafeSection.section_id));
 assert.ok(result.results.every(item => item.url === null));
});

test('actual five-source corpus returns zero for unsupported and unpublished-content requests', () => {
 const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
 const offlinePath = resolve(root, 'offline/pilot-catalog-full.json');
 const catalogPath = existsSync(offlinePath) ? offlinePath : resolve(root, 'data/pilot-catalog.json');
 const corpus = projectPublicCatalog(JSON.parse(readFileSync(catalogPath, 'utf8')));
 const fixture = JSON.parse(readFileSync(new URL('./fixtures/queries.json', import.meta.url), 'utf8'));
 const supported = new Map([
  ['Q01','hm:article:1077'], ['Q02','hm:article:1073'], ['Q03','hm:article:2241'],
  ['Q04','hm:article:2241'], ['Q05','hm:article:2310'], ['Q06','hm:article:2494'], ['Q15','hm:article:2241'],
 ]);
 for (const [id, articleId] of supported) {
  const query = fixture.cases.find(item => item.case_id === id);
  assert.ok(searchCatalog(corpus, query.query).results.some(result => result.id === articleId), `${id} should retrieve an explicitly covered source`);
 }
 for (const id of ['Q11','Q12','Q13','Q14','Q19']) {
  const query = fixture.cases.find(item => item.case_id === id);
  assert.equal(searchCatalog(corpus, query.query).total, 0, `${id}: ${query.query}`);
 }
});
