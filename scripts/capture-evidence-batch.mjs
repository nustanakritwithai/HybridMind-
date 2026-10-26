import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {sha256Hex} from './content-integrity.mjs';
function safeMediaSourceUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['hybridmind.online','i0.wp.com'].includes(u.hostname)&&u.pathname.includes('/wp-content/uploads/');}catch{return false;}}
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dir=resolve(root,'reference/source-exports/public-rest-2026-10-26');
const ids=[1740,1755,1770], extensions={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};
const pause=()=>new Promise(r=>setTimeout(r,1600));
const save=async(path,value)=>writeFile(path,JSON.stringify(value,null,2)+'\n');
async function get(url,type){
 await pause();
 const response=await fetch(url,{redirect:'error',headers:{accept:type},signal:AbortSignal.timeout(40000)});
 if(!response.ok)throw Error('Public GET '+response.status+' '+url+(response.status===429?' Retry-After: '+response.headers.get('retry-after'):''));
 return response;
}
await mkdir(dir,{recursive:true});
const manifestPath=resolve(dir,'capture-manifest.json');
const manifest=existsSync(manifestPath)?JSON.parse(await readFile(manifestPath,'utf8')):{source:'anonymous public WordPress REST GET',captured_at:new Date().toISOString(),posts:[],media:[],complete:false};
manifest.complete=false;await save(manifestPath,manifest);
for(const id of ids){
 const url='https://hybridmind.online/wp-json/wp/v2/posts/'+id,path=resolve(dir,'post-'+id+'.json');
 if(!existsSync(path)){const res=await get(url,'application/json');await writeFile(path,Buffer.from(await res.arrayBuffer()));}
 const bytes=await readFile(path),post=JSON.parse(bytes);
 const priorPost=manifest.posts.find(p=>p.id===id);
 if(priorPost&&priorPost.response_sha256!==sha256Hex(bytes))throw Error('Checkpoint post changed; review a new source revision explicitly: '+id);
 if(post.id!==id||post.status!=='publish'||post.content?.protected!==false||!post.content?.rendered)throw Error('Not a complete public article: '+id);
 const canonical=new URL(post.link);if(canonical.protocol!=='https:'||canonical.hostname!=='hybridmind.online')throw Error('Unexpected canonical URL');
 manifest.posts=manifest.posts.filter(p=>p.id!==id);
 manifest.posts.push({id,url,canonical_url:post.link,source_revision:post.modified_gmt+'Z',response_sha256:sha256Hex(bytes),body_sha256:sha256Hex(Buffer.from(post.content.rendered)),body_bytes:Buffer.byteLength(post.content.rendered),captured_at:(await stat(path)).mtime.toISOString()});
 await save(manifestPath,manifest);
 const mediaIds=[...new Set([post.featured_media,...[...post.content.rendered.matchAll(/data-attachment-id=["'](\d+)["']/g)].map(m=>+m[1])].filter(Boolean))];
 for(const mid of mediaIds){
  const metaPath=resolve(dir,'media-'+mid+'.json');
  if(!existsSync(metaPath)){const res=await get('https://hybridmind.online/wp-json/wp/v2/media/'+mid,'application/json');await writeFile(metaPath,Buffer.from(await res.arrayBuffer()));}
  const meta=JSON.parse(await readFile(metaPath,'utf8')),extension=extensions[meta.mime_type];
  if(meta.id!==mid||!extension||!safeMediaSourceUrl(meta.source_url))throw Error('Unsafe media '+mid);
  const filename=mid+'.'+extension,assetPath=resolve(root,'assets/media',filename);
  if(!existsSync(assetPath)){
   const res=await get(meta.source_url,meta.mime_type);
   if(res.headers.get('content-type')?.split(';')[0]!==meta.mime_type)throw Error('MIME mismatch '+mid);
   const bytes=Buffer.from(await res.arrayBuffer());if(!bytes.length||bytes.length>25*1024*1024)throw Error('Media size '+mid);
   await writeFile(assetPath,bytes);
  }
  const asset=await readFile(assetPath);
  const prior=manifest.media.find(x=>x.attachment_id===mid);
  if(prior&&(prior.sha256!==sha256Hex(asset)||prior.byte_length!==asset.length))throw Error('Checkpoint media changed '+mid);
  manifest.media=manifest.media.filter(x=>x.attachment_id!==mid);
  manifest.media.push({attachment_id:mid,filename,source_url:meta.source_url,mime_type:meta.mime_type,byte_length:asset.length,sha256:sha256Hex(asset),metadata_sha256:sha256Hex(await readFile(metaPath))});
  await save(manifestPath,manifest);console.log('Checkpoint media '+mid);
 }
}
manifest.complete=true;await save(manifestPath,manifest);
console.log(JSON.stringify({posts:manifest.posts.length,media:manifest.media.length,complete:true}));
