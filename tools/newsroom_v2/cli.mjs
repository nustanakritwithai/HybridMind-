#!/usr/bin/env node
/** Hybrid Mind Newsroom V0.2 CLI integration test runner — OFFLINE ONLY.
 * Reuses upstream renderer, Python jsonschema/editorial check and R1 source citation
 * builder, with a strictly local SQLite mock adapter. NO HTTP / publish functions.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, renameSync, mkdtempSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CONFIG=Object.freeze({
  defaultInput:'examples/newsroom-agent-security.v2.json',
  defaultOut:'output/newsroom-v2',
  defaultDb:'output/newsroom-v2-jobs.sqlite',
  defaultNow:'2026-10-10T20:40:00+07:00'
});
function sha(text){return createHash('sha256').update(text).digest('hex')}
function parse(args){
  if(args[0]!=='run')throw new Error('Usage: node tools/newsroom_v2/cli.mjs run --input ... --out ... --db ... --now ... [--mock-timeout]');
  const o={input:CONFIG.defaultInput,out:CONFIG.defaultOut,db:CONFIG.defaultDb,now:CONFIG.defaultNow,mockTimeout:false};
  for(let i=1;i<args.length;i++){
    const a=args[i];
    if(a==='--mock-timeout'){o.mockTimeout=true;continue}
    if(!['--input','--out','--db','--now'].includes(a)||i+1>=args.length)throw new Error('Unknown or incomplete option: '+a);
    o[a.slice(2)]=args[++i];
  }
  return o;
}
function run(executable,args,stdin=''){
  const result=spawnSync(executable,args,{cwd:ROOT,encoding:'utf8',input:stdin,
      timeout:25000,maxBuffer:12*1024*1024,env:{...process.env,PYTHONPATH:ROOT,PYTHONDONTWRITEBYTECODE:'1'}});
  return {exit_code:result.status??(result.error?127:1),stdout:result.stdout||'',stderr:result.stderr||'',error:result.error?.message||null,
          command:[executable,...args.map(x=>x.startsWith(ROOT)?x.slice(ROOT.length+1):x)]};
}
function stepJson(s){if(s.exit_code!==0)throw new Error('Command failed: '+s.command[1]+': '+s.stderr.slice(0,160));return JSON.parse(s.stdout)}
function atomicWrite(path,text){mkdirSync(dirname(path),{recursive:true});const tmp=path+'.partial-'+process.pid;writeFileSync(tmp,text,'utf8');renameSync(tmp,path)}
function resultOut(out, data, logs){
  if(data.status==='HOLD') for(const file of ['visual-article.json','visual-article.gutenberg.html','evidence.json'])rmSync(join(out,file),{force:true});
  const rec={...data,technical_qa: data.technical_qa || 'HOLD',editorial_approved:false,auto_publish:false,
             ready_for_wordpress:false,production_wp_post_id:null,paid_api_calls:0,model_tokens:0,cost_usd:0,remote_writes:0};
  atomicWrite(join(out,'qa-report.json'),JSON.stringify(rec,null,2)+'\n');
  atomicWrite(join(out,'cli-evidence.json'),JSON.stringify({node_version:process.version,
    platform:process.platform,stages:logs.map(s=>({command:s.command,exit_code:s.exit_code,error:s.error,
    stdout_bytes:Buffer.byteLength(s.stdout),stderr_bytes:Buffer.byteLength(s.stderr),
    stdout_sha256:sha(s.stdout),stderr_sha256:sha(s.stderr),
    stdout:s.command.some(x=>x.endsWith('compose.py'))?'[article content omitted]':s.stdout.slice(0,300).replace(/sk-[A-Za-z0-9_-]{16,}/g,'[REDACTED]'),
    stderr:s.stderr.slice(0,300).replace(/sk-[A-Za-z0-9_-]{16,}/g,'[REDACTED]')}))},null,2)+'\n');
  return rec;
}
function main(){
  const opts=parse(process.argv.slice(2)); const out=resolve(ROOT,opts.out);const db=resolve(ROOT,opts.db);
  mkdirSync(out,{recursive:true});
  // Removed stale export files in the chosen test output folder only. Never touch WordPress.
  const sample=JSON.parse(readFileSync(resolve(ROOT,opts.input),'utf8'));const logs=[];
  const pre=run('python3',[join(ROOT,'tools/newsroom_v2/preflight.py')],JSON.stringify({sample,now:opts.now}));logs.push(pre);
  const preflight=stepJson(pre);
  if(preflight.status!=='ELIGIBLE_FOR_MOCK_ONLY'){
    return resultOut(out,{status:'HOLD',stage:'schema_editorial',reasons:preflight.reasons,technical_qa:'FAIL',artifact_created:false},logs);
  }
  const stageDir=mkdtempSync(join(tmpdir(),'hm-newsroom-v2-'));
  try{
    const manifestPath=join(stageDir,'manifest.json'),basePath=join(stageDir,'base.html');
    writeFileSync(manifestPath,JSON.stringify(sample.manifest,null,2),'utf8');
    const renderer=run(process.execPath,[join(ROOT,'tools/visual_article/render_gutenberg.mjs'),manifestPath,basePath]);logs.push(renderer);
    if(renderer.exit_code!==0)return resultOut(out,{status:'HOLD',stage:'renderer',reasons:['RENDERER_EXIT_NONZERO'],technical_qa:'FAIL',artifact_created:false},logs);
    const base=readFileSync(basePath,'utf8');
    const composed=run('python3',[join(ROOT,'tools/newsroom_v2/compose.py')],JSON.stringify({markup:base,packet:sample.evidence_packet,faqs:sample.faqs||[]}));logs.push(composed);
    if(composed.exit_code!==0)return resultOut(out,{status:'HOLD',stage:'source_composition',reasons:['COMPOSER_EXIT_NONZERO'],technical_qa:'FAIL',artifact_created:false},logs);
    const html=composed.stdout;
    const security=run('python3',[join(ROOT,'tools/newsroom_v2/guard_html.py')],JSON.stringify({markup:html,sources:sample.evidence_packet.sources}));logs.push(security);
    const check=stepJson(security);
    if(check.status!=='PASS')return resultOut(out,{status:'HOLD',stage:'html_guard',reasons:check.reasons,technical_qa:'FAIL',artifact_created:false},logs);
    const adapter=run('python3',[join(ROOT,'tools/newsroom_v2/mock_adapter.py')],JSON.stringify({db,item:sample.item,
               manifest:sample.manifest,html,now:opts.now,worker:'node-cli-'+process.pid,mock_timeout:opts.mockTimeout}));logs.push(adapter);
    const receipt=stepJson(adapter);
    if(!['MOCK_DRAFT_CREATED','MOCK_DRAFT_REPLAY','MOCK_DRAFT_RECONCILED'].includes(receipt.state)){
      return resultOut(out,{status:'HOLD',stage:'mock_adapter',reasons:[receipt.reason||receipt.state],mock:receipt,
        technical_qa:'FAIL',artifact_created:false},logs);
    }
    // All exported bytes have been validated and read back through the owned mock.
    const markupSha=sha(html);
    if(markupSha!==receipt.readback_hash)return resultOut(out,{status:'HOLD',stage:'readback',reasons:['MOCK_READBACK_SHA_MISMATCH'],technical_qa:'FAIL',artifact_created:false},logs);
    atomicWrite(join(out,'visual-article.json'),JSON.stringify(sample.manifest,null,2)+'\n');
    atomicWrite(join(out,'evidence.json'),JSON.stringify(sample.evidence_packet,null,2)+'\n');
    atomicWrite(join(out,'visual-article.gutenberg.html'),html);
    return resultOut(out,{status:receipt.state,stage:'mock_readback',mock_post_id:receipt.mock_post_id,job_id:receipt.job_id,
       mock_total_posts:receipt.mock_total_posts,html_sha256:markupSha,rendered_bytes:Buffer.byteLength(html),
       references:sample.evidence_packet.sources.map(s=>({id:s.id,url:s.url})),mock_adapter_verified:true,
       technical_qa:'PASS',artifact_created:true,editorial_status:'PENDING',human_preview:'NOT_ATTEMPTED'},logs);
  } finally {rmSync(stageDir,{recursive:true,force:true})}
}
try{
  const output=main();process.stdout.write(JSON.stringify(output,null,2)+'\n');
  if(output.status==='HOLD')process.exitCode=3;
}catch(err){
  process.stderr.write('CLI_FATAL '+(err?.message||'unknown error')+'\n');process.exitCode=2;
}
