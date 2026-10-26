import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {attachContentDigest,sha256Hex,verifyContentBundleDigests,verifyContentMediaFiles} from './content-integrity.mjs';
import {validateContentBundle} from '../knowledge-textbook/content-renderer.mjs';
import {validateCatalog} from './validate-catalog.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),dir=resolve(root,'reference/source-exports/public-rest-2026-10-26');
const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8')),save=async(p,v)=>writeFile(resolve(root,p),JSON.stringify(v,null,2)+'\n');
const manifest=await read('reference/source-exports/public-rest-2026-10-26/capture-manifest.json');
if(!manifest.complete)throw Error('Capture is incomplete');
const catalog=await read('data/pilot-catalog.json'),bundle=await read('data/pilot-content-bundle.json');
const configs=[
 {id:1740,key:'retrieval-evaluation',title:'ค้นเจอแล้ว ทำไมยังตอบผิด?',en:'Retrieval Evaluation',level:'beginner',description:'เริ่มจากแยกจุดผิดพลาดของการค้นคืน บริบทที่เหลืออยู่ และคำตอบ ด้วยตัวอย่างจำลองที่ตรวจทีละขั้นได้',question:'คะแนนค้นคืนดีแล้ว ทำไมคำตอบหรือการอ้างอิงยังผิดได้?',slug:'ai-agent-retrieval-evaluation-evidence-answer-errors'},
 {id:1755,key:'evidence-sufficiency',title:'หลักฐานพอให้ตอบหรือยัง?',en:'Evidence Sufficiency',level:'intermediate',description:'ต่อจากการค้นคืน: ตรวจว่ามีชุดหลักฐานที่เชื่อมกันครบจริงหรือยัง แยกจำนวนเอกสารออกจากความพอเพียง และรู้จุดที่ควรงดตอบ',question:'ได้เอกสารหลายชิ้นแล้ว มีชุดหลักฐานรองรับข้อสรุปครบหรือยัง?',slug:'ai-agent-evidence-sufficiency-multi-hop-proof-sets'},
 {id:1770,key:'claim-decomposition',title:'แยกข้ออ้างโดยไม่ทำความหมายหาย',en:'Claim Decomposition',level:'advanced',description:'แยกคำตอบเป็นข้ออ้างที่รักษาหน่วย เงื่อนไข และความหมายเดิม ก่อนตรวจการรองรับจากเอกสาร แยกข้อที่ขัดแย้งหรือยังไม่มีหลักฐานออกจากข้อเท็จจริง',question:'แยกคำตอบแล้วรักษาข้ออ้างและเงื่อนไขครบ โดยไม่สร้างข้ออ้างใหม่ได้อย่างไร?',slug:'ai-agent-claim-decomposition-preservation-factual-support'},
];
const decode=s=>String(s??'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#0*39;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
const plain=s=>decode(String(s??'').replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim();
const attr=(tag,name)=>decode(tag.match(new RegExp('\\b'+name+'\\s*=\\s*(?:"([^"]*)"|\\x27([^\\x27]*)\\x27)','i'))?.slice(1).find(x=>x!==undefined)??'');
const report={captured_at:manifest.captured_at,source:'anonymous public WordPress REST GET',scope:'Three additional existing public articles; editorial topic order is proposed; original five bodies and all their revisions are unchanged.',articles:[]};
for(const cfg of configs){
 const articleId='hm:article:'+cfg.id,topicId='hm:topic:'+cfg.key,bytes=await readFile(resolve(dir,'post-'+cfg.id+'.json')),post=JSON.parse(bytes),proof=manifest.posts.find(p=>p.id===cfg.id);
 const canonical='https://hybridmind.online/2026/10/14/'+cfg.slug+'/';
 if(!proof||sha256Hex(bytes)!==proof.response_sha256||post.id!==cfg.id||post.status!=='publish'||post.content?.protected!==false||post.link!==canonical)throw Error('Source identity/publicity/hash mismatch '+cfg.id);
 const html=post.content.rendered,sourceHash='sha256:'+sha256Hex(Buffer.from(html)),revision=new Date(post.modified_gmt+'Z').toISOString();
 if(sourceHash!=='sha256:'+proof.body_sha256)throw Error('Body changed '+cfg.id);
 const visible=html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
 const images=[...visible.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]),required=[...new Set([post.featured_media,...images.map(t=>+attr(t,'data-attachment-id'))].filter(Boolean))];
 if(images.some(t=>!attr(t,'data-attachment-id')))throw Error('Unmapped source image '+cfg.id);
 const media=[];
 for(const id of required){
  const asset=manifest.media.find(m=>m.attachment_id===id),metaBytes=await readFile(resolve(dir,'media-'+id+'.json')),meta=JSON.parse(metaBytes);
  if(!asset||sha256Hex(metaBytes)!==asset.metadata_sha256)throw Error('Missing/changed media metadata '+id);
  const tag=images.find(t=>+attr(t,'data-attachment-id')===id);
  media.push({attachment_id:id,source_url:meta.source_url,local_src:'../assets/media/'+asset.filename,mime_type:meta.mime_type,byte_length:asset.byte_length,sha256:'sha256:'+asset.sha256,modified_gmt:meta.modified_gmt,author_id:meta.author,alt_text:tag?attr(tag,'alt'):meta.alt_text??'',title:meta.title?.rendered??'',caption:plain(meta.caption?.rendered),source_description:tag?plain(attr(tag,'data-image-description')):'',source_title:tag?plain(attr(tag,'data-image-title')):'',source_caption:tag?plain(attr(tag,'data-image-caption')):''});
 }
 const entry=attachContentDigest({schema_version:'1.1.0',article_id:articleId,canonical_url:canonical,source_revision:revision,source_hash:sourceHash,source_hash_status:'source_bytes_verified',source_hash_scope:'wordpress_rest_content_rendered_utf8',content_derivation_status:'unverified',imported_at:proof.captured_at,provenance:'wordpress_export',blocks:[{type:'html_fragment',html}],media,featured_media_id:post.featured_media||null});
 const article={article_id:articleId,wp_post_id:cfg.id,article_revision:revision,canonical_url:canonical,title:plain(post.title.rendered),summary:plain(post.excerpt?.rendered),locale:'th',status:'published',password_protected:false,visibility:'public',published_at:new Date(post.date_gmt+'Z').toISOString(),modified_at:revision,topic_ids:[],primary_topic_id:null,content_type:'explainer',audience_level:cfg.level,content_state:'review_needed',source_hash:sourceHash.slice(7),schema_version:'1.0.0'};
 const headings=[...visible.matchAll(/<h([23])\b([^>]*)>([\s\S]*?)<\/h\1\s*>/gi)];
 const oldSections=catalog.sections.filter(s=>s.article_id===articleId),used=new Set();
 const sections=headings.map((m,index)=>{
  const text=plain(m[3]),anchor=attr(m[2],'id')||null;
  const old=oldSections.find(s=>!used.has(s.section_id)&&((anchor&&s.anchor===anchor)||s.heading_text===text));
  const key=old?.section_id??'hm:section:'+cfg.id+':h-'+sha256Hex(Buffer.from(anchor??text)).slice(0,16);
  if(used.has(key))throw Error('Duplicate heading needs editorial key '+key);used.add(key);
  return {section_id:key,article_id:articleId,heading_text:text,heading_level:+m[1],anchor,anchor_aliases:old?.anchor_aliases??[],anchor_status:anchor?'verified':'missing',summary:null,content_text:null,display_order:index,article_revision:revision,schema_version:'1.0.0'};
 });
 const anchors=[...visible.matchAll(/\bid=["']([^"']+)["']/gi)].map(m=>m[1]),duplicate=[...new Set(anchors.filter((x,i)=>anchors.indexOf(x)!==i))];
 const missing=[...new Set([...visible.matchAll(/\bhref=["']#([^"']+)["']/gi)].map(m=>m[1]).filter(x=>!anchors.includes(x)))];
 if(duplicate.length||missing.length)throw Error('Source anchors need review '+cfg.id+' '+JSON.stringify({duplicate,missing}));
 catalog.articles=catalog.articles.filter(a=>a.article_id!==articleId).concat(article);
 catalog.sections=catalog.sections.filter(s=>s.article_id!==articleId).concat(sections);
 catalog.topics=catalog.topics.filter(t=>t.topic_id!==topicId).concat({topic_id:topicId,topic_revision:1,parent_topic_id:'hm:topic:ai-foundations-verification',label_th:cfg.title,label_en:cfg.en,definition:cfg.description,search_aliases:[{value:cfg.en,locale:'en'},{value:cfg.title,locale:'th'}],questions:[cfg.question],audience_level:cfg.level,intent:cfg.description,status:'proposed',editorial_status:'proposed'});
 const relId='rel:evidence-path:'+cfg.id;
 catalog.relationships=catalog.relationships.filter(r=>r.relationship_id!==relId).concat({relationship_id:relId,from_id:topicId,to_id:articleId,type:'explains',rationale:'ANALYSIS: proposed pedagogical mapping after reading the full public source; difficulty is editorial, not an author or user approval.',review_status:'proposed',reviewer_id:null,created_at:manifest.captured_at,updated_at:null});
 bundle.articles=bundle.articles.filter(e=>e.article_id!==articleId).concat(entry);
 report.articles.push({article_id:articleId,canonical_url:canonical,source_revision:revision,source_hash:sourceHash,response_sha256:proof.response_sha256,body_bytes:Buffer.byteLength(html),headings:sections.length,inline_images:images.length,media_ids:required,duplicate_ids:duplicate,missing_anchors:missing,editorial_level:cfg.level,editorial_status:'proposed'});
}
const pathId='hm:path:evidence-to-answer';
catalog.learning_paths=catalog.learning_paths.filter(p=>p.path_id!==pathId).concat({path_id:pathId,title:'จากการค้นคืนสู่คำตอบที่มีหลักฐาน',audience:'ผู้อ่านที่รู้จักการตรวจคำตอบ AI เบื้องต้น',goal:'แยกผลการค้นคืน ความพอเพียงของหลักฐาน และความครบถ้วนของข้ออ้าง ตามลำดับพื้นฐาน → กลาง → ขั้นสูง (ข้อเสนอการเรียน)',ordered_topic_ids:configs.map(c=>'hm:topic:'+c.key),estimated_minutes:null,prerequisites:['อ่านบทความ 1077: ตรวจสอบคำตอบ AI เช็กข้อเท็จจริง ตัวเลข และอ้างอิงปลอม'],status:'proposed'});
catalog.snapshot.published_total=catalog.articles.length;
catalog.snapshot.captured_at=manifest.captured_at;
catalog.snapshot.note='Eight explicitly public full-body snapshots: five retained from 2026-10-25 and three captured 2026-10-26. Not a complete inventory. New topic order and difficulty are editorial proposals.';
const errors=validateCatalog(catalog,await read('contracts/knowledge-textbook-v1.schema.json'));if(errors.length)throw Error(errors.join('\n'));
verifyContentBundleDigests(validateContentBundle(bundle,{catalog}));await verifyContentMediaFiles(bundle,root);
await save('data/pilot-catalog.json',catalog);await save('data/pilot-content-bundle.json',bundle);
report.total_articles=bundle.articles.length;report.total_sections=catalog.sections.length;report.total_media=new Set(bundle.articles.flatMap(a=>a.media.map(m=>m.attachment_id))).size;
await save('reference/source-exports/public-rest-2026-10-26/import-report.json',report);
console.log(JSON.stringify(report,null,2));
