import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareInteractiveEntries,approvedLabRoots,labMarkupIdentity} from '../knowledge-textbook/labs/registry.mjs';

const load=async()=>JSON.parse(await readFile(new URL('../data/pilot-content-bundle.json',import.meta.url),'utf8')).articles;
test('only the three exact reviewed article HTML hashes activate known local labs',async()=>{
 const entries=await load();
 assert.deepEqual(await prepareInteractiveEntries(entries),['hm:article:2241','hm:article:2310','hm:article:2494']);
 for(const entry of entries)assert.equal(Object.keys(approvedLabRoots(entry)??{}).length,entry.article_id.endsWith('1077')||entry.article_id.endsWith('1073')?0:2);
});
test('copied source metadata cannot authorize altered HTML or a different source identity',async()=>{
 const original=(await load()).find(a=>a.article_id==='hm:article:2241');
 for(const edit of [e=>{e.blocks[0].html+='<script>globalThis.pwned=true</script>';},e=>{e.canonical_url='https://hybridmind.online/fake/';},e=>{e.source_revision='new';},e=>{e.article_id='hm:article:999';},e=>{e.provenance='test_fixture';}]) {
  const entry=structuredClone(original);edit(entry);
  assert.deepEqual(await prepareInteractiveEntries([entry]),[]);assert.equal(approvedLabRoots(entry),null);
 }
 assert.equal(globalThis.pwned,undefined);
});
test('approval is bound to the checked object and immutable HTML value, not a transferable flag',async()=>{
 const entry=(await load()).find(a=>a.article_id==='hm:article:2310');
 await prepareInteractiveEntries([entry]);
 assert.ok(approvedLabRoots(entry));
 assert.equal(approvedLabRoots(structuredClone(entry)),null);
 entry.blocks[0].html=entry.blocks[0].html.replace('hm-video-lab','fake-video-lab');
 assert.equal(approvedLabRoots(entry),null);
 assert.equal(labMarkupIdentity({dataset:{labKind:'video',labReady:'true'}}),null);
});
test('mutating verification status or block type revokes a previously approved entry',async()=>{
 const original=(await load()).find(a=>a.article_id==='hm:article:2241');
 for(const edit of [e=>{e.source_hash_status='unverified';},e=>{e.blocks[0].type='text';}]) {
  const entry=structuredClone(original);await prepareInteractiveEntries([entry]);assert.ok(approvedLabRoots(entry));
  edit(entry);assert.equal(approvedLabRoots(entry),null);
 }
});
test('reviewed runtime does not contain imported script execution, networking or persistence',async()=>{
 for(const name of ['manager','helpers','video','citation','authorization','approval']){
  const code=await readFile(new URL('../knowledge-textbook/labs/'+name+'.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(code,/\b(?:eval|fetch|XMLHttpRequest|WebSocket|Function)\s*\(|\b(?:localStorage|sessionStorage)\b|\.innerHTML\s*=/,name);
 }
 const css=await readFile(new URL('../knowledge-textbook/labs/labs.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/@import|url\(/i);
});
