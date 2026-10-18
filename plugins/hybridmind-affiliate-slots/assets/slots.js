/* Only image fallback. No slot insertion, requests, storage, cookies or tracking. */
(function(){
 'use strict';
 function failed(img){
   const box=img.closest('.hm-aff-media');
   if(!box)return;
   const fallback=box.querySelector('.hm-aff-image-fallback');
   img.hidden=true;
   if(fallback)fallback.hidden=false;
 }
 function init(){
   document.querySelectorAll('.hm-aff-unit img[data-hm-aff-image]').forEach(function(img){
     img.addEventListener('error',function(){failed(img);},{once:true});
     if(img.complete&&img.naturalWidth===0)failed(img);
   });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
