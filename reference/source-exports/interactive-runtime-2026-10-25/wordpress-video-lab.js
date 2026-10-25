/* Hybrid Mind 3D Visual Interactive — dependency-free progressive enhancement */
(function () {
  'use strict';
  var root = document.getElementById('hm-video-lab');
  if (!root || root.dataset.hmReady === 'true') return;
  root.dataset.hmReady = 'true';
  function q(s) { return root.querySelector(s); }
  function qa(s) { return Array.prototype.slice.call(root.querySelectorAll(s)); }
  function str(id, value) { var el = q('#' + id); if (el) el.textContent = value; }
  var fmt = new Intl.NumberFormat('th-TH', {maximumFractionDigits:0});

  /* 3D perspective point projection and interactive orbit camera */
  var canvas = q('#hm-3d-canvas'), ctx = canvas && canvas.getContext && canvas.getContext('2d');
  var stages = [
    {name:'FOOTAGE',th:'นำเข้าคลิปดิบ',desc:'จัดระเบียบไฟล์ ตรวจคุณภาพภาพและเสียง และกำหนดสิทธิ์เข้าถึงให้ AI Agent',tag:'● SOURCE',color:'#58e4f3',p:[-290,36,-34]},
    {name:'STORY',th:'วางโครงเรื่องและ Hook',desc:'วิเคราะห์คลิป เลือกช่วงสำคัญ และเสนอ Script หรือ Hook ให้มนุษย์ตรวจรับ',tag:'● PLAN',color:'#91a6ff',p:[-174,-84,-44]},
    {name:'EDIT',th:'ตัดภาพและเสียง',desc:'ส่งงานให้ซอฟต์แวร์ตัดต่อ ตัดส่วนเงียบ จัดลำดับช็อต และปรับจังหวะ',tag:'● EDIT',color:'#ad8dff',p:[-10,-113,-8]},
    {name:'CAPTIONS',th:'สร้างและตรวจซับ',desc:'ถอดเสียงเป็นข้อความ วางซับตามเวลา และตรวจชื่อเฉพาะกับคำผิดภาษาไทย',tag:'● TEXT',color:'#f7b879',p:[165,-68,62]},
    {name:'GRAPHICS',th:'เพิ่มกราฟิกและเสียง',desc:'ใส่ Title, Lower Third, Motion Graphic และเสียงประกอบตามสิทธิ์ที่มี',tag:'● STYLE',color:'#d7f686',p:[274,69,55]},
    {name:'RENDER',th:'ส่งออกและตรวจไฟล์ MP4',desc:'เรนเดอร์ผ่านเครื่องมือที่พร้อม ตรวจความละเอียด เสียง Subtitle และไฟล์ก่อนส่งมอบ',tag:'● OUTPUT',color:'#5ce8c0',p:[78,153,91]}
  ];
  var selected=0, activePreset='orbit', yaw=-0.37, pitch=.24, playing=true, pointerDown=null, frameRequest=0, inView=true, lastT=0, phase=0, projectionHits=[];
  var topViewPositions=[[-310,18,-164],[-178,-24,-92],[-14,-56,-12],[170,-22,90],[332,30,198],[118,88,302]];
  var cssSize={w:960,h:545,dpr:1}, reducedMotion=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reducedMotion) playing=false;
  function chooseStage(i){
    selected=Math.max(0,Math.min(stages.length-1,Number(i)||0));
    var s=stages[selected];str('hm-stage-number',String(selected+1).padStart(2,'0')+' / 06');str('hm-stage-title',s.th);str('hm-stage-desc',s.desc);str('hm-stage-indicator',s.tag);
    qa('.hm-node-btn').forEach(function(b){var on=Number(b.dataset.stage)===selected;b.classList.toggle('is-current',on);b.setAttribute('aria-pressed',String(on));});
    if(ctx) paint();
  }
  qa('.hm-node-btn').forEach(function(b){b.addEventListener('click',function(){chooseStage(b.dataset.stage);});});
  function pickCamera(view){
    activePreset=view;
    if(view==='front'){yaw=0;pitch=0.1;}
    if(view==='top'){yaw=-.28;pitch=1.16;}
    if(view==='orbit'){yaw=-.37;pitch=.24;}
    qa('.hm-view-btn').forEach(function(b){var on=b.dataset.camera===view;b.classList.toggle('is-current',on);b.setAttribute('aria-pressed',String(on));});
    str('hm-view-label',view.toUpperCase()+' 3D');if(ctx)paint();
  }
  qa('.hm-view-btn').forEach(function(b){b.addEventListener('click',function(){pickCamera(b.dataset.camera);});});
  function togglePlay(){playing=!playing;var b=q('#hm-pause-scene');if(b){b.textContent=playing?'Ⅱ':'▶';b.setAttribute('aria-pressed',String(!playing));b.setAttribute('aria-label',playing?'หยุดภาพเคลื่อนไหว':'เล่นภาพเคลื่อนไหว');}if(playing){lastT=0;requestFrame();} else if(ctx)paint();}
  q('#hm-pause-scene').addEventListener('click',togglePlay);
  function resize(){if(!canvas||!ctx)return;var r=canvas.getBoundingClientRect();cssSize.w=Math.max(250,r.width);cssSize.h=Math.max(320,r.height);cssSize.dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(cssSize.w*cssSize.dpr);canvas.height=Math.round(cssSize.h*cssSize.dpr);ctx.setTransform(cssSize.dpr,0,0,cssSize.dpr,0,0);paint();}
  function worldPoint(input, index){
    if(activePreset==='top' && typeof index==='number' && topViewPositions[index]){
      return topViewPositions[index];
    }
    return input;
  }
  function project(pt, index){
    var src=worldPoint(pt,index),x=src[0],y=src[1],z=src[2];var c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    var x1=x*c-z*s,z1=x*s+z*c,y1=y*cp-z1*sp,z2=y*sp+z1*cp;
    var focal=700,persp=focal/(focal+z2+55),scale=Math.min(cssSize.w/950,cssSize.h/590)*1.03;
    if(activePreset==='top'){persp*=0.92;scale*=0.96;}
    return {x:cssSize.w*.5+x1*scale*persp,y:cssSize.h*.47+y1*scale*persp,z:z2,scale:scale*persp};
  }
  function line3d(a,b,color,width){var pa=project(a),pb=project(b);ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.strokeStyle=color;ctx.lineWidth=width||1;ctx.stroke();}
  function roundRect(x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
  function bgStars(){var w=cssSize.w,h=cssSize.h;for(var i=0;i<75;i++){var xx=((i*97.27+31)%100)/100*w,yy=((i*63.2+19)%100)/100*h*.78;ctx.globalAlpha=.15+(i%6)*.08;ctx.fillStyle='#97d9ff';ctx.fillRect(xx,yy,i%8===0?2:1,i%8===0?2:1);}ctx.globalAlpha=1;}
  function floorGrid(){for(var x=-450;x<=450;x+=75)line3d([x,177,-330],[x,177,330],'rgba(87,173,226,.075)',.9);for(var z=-330;z<=330;z+=66)line3d([-450,177,z],[450,177,z],'rgba(87,173,226,.085)',.9);}
  function orbitRings(){var n=76;for(var ring=0;ring<3;ring++){ctx.beginPath();for(var k=0;k<=n;k++){var a=k/n*Math.PI*2;var r=345+ring*23;var v=project([r*Math.cos(a),Math.sin(a*3+ring)*17,r*Math.sin(a)*.56]);if(k===0)ctx.moveTo(v.x,v.y);else ctx.lineTo(v.x,v.y);}ctx.strokeStyle=ring===0?'rgba(76,228,245,.20)':ring===1?'rgba(137,142,255,.12)':'rgba(76,228,245,.08)';ctx.lineWidth=1;ctx.stroke();}}
  function connections(){for(var i=0;i<stages.length-1;i++){var a=project(stages[i].p,i),b=project(stages[i+1].p,i+1);var lift=activePreset==='top'?18:26;var midX=(a.x+b.x)/2,midY=(a.y+b.y)/2-lift*Math.min(1,a.scale);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(midX,midY,b.x,b.y);ctx.lineWidth=6;ctx.strokeStyle='rgba(64,222,241,.045)';ctx.stroke();ctx.lineWidth=1.6;ctx.strokeStyle=i===selected?'rgba(86,244,242,.9)':'rgba(99,171,213,.42)';ctx.stroke();var p=(phase*.24+i*.15)%1;var xx=(1-p)*(1-p)*a.x+2*(1-p)*p*midX+p*p*b.x,yy=(1-p)*(1-p)*a.y+2*(1-p)*p*midY+p*p*b.y;ctx.beginPath();ctx.arc(xx,yy,2.7,0,Math.PI*2);ctx.fillStyle='#adf6f4';ctx.shadowColor='#60e6ef';ctx.shadowBlur=13;ctx.fill();ctx.shadowBlur=0;}}
  function renderNodes(){projectionHits=[];var nodes=stages.map(function(n,i){return {n:n,i:i,pt:project(n.p,i)}}).sort(function(a,b){return b.pt.z-a.pt.z;});nodes.forEach(function(o){var i=o.i,n=o.n,pt=o.pt,sel=i===selected,f=Math.max(.63,Math.min(1.15,pt.scale));if(activePreset==='top')f*=0.9;var w=128*f,h=63*f,x=pt.x-w/2,y=pt.y-h/2;ctx.save();ctx.shadowColor=sel?n.color:'rgba(50,129,190,.23)';ctx.shadowBlur=sel?32:12;roundRect(x,y,w,h,11*f);ctx.fillStyle=sel?'rgba(22,51,71,.97)':'rgba(15,28,48,.94)';ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=sel?n.color:'rgba(117,174,220,.35)';ctx.lineWidth=sel?2:1;ctx.stroke();ctx.fillStyle=n.color;roundRect(x+10*f,y+11*f,5*f,5*f,2.5*f);ctx.fill();ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillStyle=sel?'#fff':'#d6e5f5';ctx.font='bold '+Math.round(12*f)+'px ui-monospace, monospace';ctx.fillText(n.name,x+21*f,y+16*f,w-25*f);ctx.fillStyle='#91abc4';ctx.font=Math.round(9*f)+'px ui-monospace, monospace';ctx.fillText('STAGE '+String(i+1).padStart(2,'0'),x+11*f,y+41*f,w-19*f);ctx.restore();projectionHits.push({i:i,x:x,y:y,w:w,h:h});});}
  function paint(){if(!ctx)return;var w=cssSize.w,h=cssSize.h;ctx.clearRect(0,0,w,h);bgStars();floorGrid();orbitRings();connections();renderNodes();ctx.textAlign='center';ctx.fillStyle='rgba(103,185,217,.5)';ctx.font='10px ui-monospace, monospace';ctx.fillText('AI ORCHESTRATION // 3D PIPELINE VIEW',w/2,h*.17);}
  function step(t){frameRequest=0;if(!ctx||!inView||!playing)return;var delta=Math.min(60,t-(lastT||t));lastT=t;phase+=delta/1000;if(activePreset==='orbit'&&!pointerDown&&!reducedMotion)yaw+=delta*.00010;paint();requestFrame();}
  function requestFrame(){if(!frameRequest&&ctx&&inView&&playing)frameRequest=requestAnimationFrame(step);}
  if(ctx){if('ResizeObserver'in window){new ResizeObserver(resize).observe(canvas);}else{window.addEventListener('resize',resize);}resize();if('IntersectionObserver'in window){new IntersectionObserver(function(entries){inView=entries[0].isIntersecting;if(inView)requestFrame();}, {rootMargin:'80px'}).observe(canvas);}requestFrame();
    canvas.addEventListener('pointerdown',function(e){pointerDown={x:e.clientX,y:e.clientY,yaw:yaw,pitch:pitch,moved:false};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',function(e){if(!pointerDown)return;var dx=e.clientX-pointerDown.x,dy=e.clientY-pointerDown.y;if(Math.abs(dx)+Math.abs(dy)>7)pointerDown.moved=true;if(pointerDown.moved){activePreset='custom';yaw=pointerDown.yaw+dx*.007;pitch=Math.max(-1.3,Math.min(1.48,pointerDown.pitch+dy*.005));qa('.hm-view-btn').forEach(function(b){b.classList.remove('is-current');b.setAttribute('aria-pressed','false');});str('hm-view-label','CUSTOM 3D');paint();}});
    canvas.addEventListener('pointerup',function(e){if(!pointerDown)return;var moved=pointerDown.moved;pointerDown=null;if(!moved){var rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;var h=projectionHits.slice().reverse().find(function(r){return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;});if(h)chooseStage(h.i);}requestFrame();});
    canvas.addEventListener('pointercancel',function(){pointerDown=null;});
    canvas.tabIndex=0;canvas.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){yaw+=(e.key==='ArrowLeft'?-0.13:0.13);e.preventDefault();paint();}if(e.key==='ArrowUp'||e.key==='ArrowDown'){pitch=Math.min(1.48,Math.max(-1.3,pitch+(e.key==='ArrowUp'?-.13:.13)));e.preventDefault();paint();}});
    chooseStage(0);
  }

  /* Prompt Studio: platform settings are editorial suggestions, not platform limits */
  var platforms={
    tiktok:{name:'TikTok',ratio:'9:16',kind:'VERTICAL · SHORT FORM',min:15,max:180,step:15,default:45,hook:'3 วินาทีแรก',cta:'ชวนติดตามบัญชี',title:'Hook เร็ว ซับอ่านง่าย'},
    reels:{name:'Instagram Reels',ratio:'9:16',kind:'VERTICAL · REELS',min:15,max:180,step:15,default:45,hook:'3 วินาทีแรก',cta:'ชวนบันทึกและแชร์',title:'เนื้อหากระชับ ชวนแชร์'},
    youtube:{name:'YouTube (long-form)',ratio:'16:9',kind:'LANDSCAPE · LONG FORM',min:300,max:600,step:30,default:420,hook:'15 วินาทีแรก',cta:'ชวนกดติดตามและดูวิดีโอถัดไป',title:'แบ่งบทและรักษาจังหวะ'}
  };
  var content={knowledge:'คลิปให้ความรู้ AI',product:'คลิปแนะนำสินค้า Affiliate',live:'ไฮไลต์จากไลฟ์'};
  var currentPlatform='tiktok';
  function durationLabel(s){s=Number(s)||0;return s<60?s+' วินาที':Math.floor(s/60)+' นาที'+(s%60?' '+(s%60)+' วินาที':'');}
  function prompt(){var p=platforms[currentPlatform],kind=content[q('#hm-format').value]||content.knowledge,seconds=Number(q('#hm-duration').value),subject=q('#hm-topic').value.trim()||'หัวข้อที่ต้องการ',subs=q('#hm-subtitles').checked,motion=q('#hm-motion').checked,voice=q('#hm-voice').checked;
  return 'บทบาท: AI Video Editing Agent สำหรับ HYBRID MIND\n\nเป้าหมาย: ผลิต'+kind+' เรื่อง “'+subject+'”\nแพลตฟอร์ม: '+p.name+'\nอัตราส่วน: '+p.ratio+'\nความยาวเป้าหมาย: '+durationLabel(seconds)+'\nHook: ดึงดูดความสนใจใน'+p.hook+'\nการเล่าเรื่อง: '+p.title+'\nSubtitle: '+(subs?'ใส่ซับไทยทุกช่วงที่พูด ตรวจคำผิดและ safe zone':'ไม่ต้องฝังซับบนภาพ แต่เตรียมไฟล์คำบรรยายถ้าทำได้')+'\nMotion Graphic: '+(motion?'ใช้กราฟิกอธิบายตัวเลข/ประเด็นสำคัญตาม CI':'ใช้ภาพและตัวอักษรแบบเรียบง่าย')+'\nเสียงพากย์: '+(voice?'พากย์ไทยด้วยเสียงที่ได้รับสิทธิ์และมีเครื่องมือรองรับ':'ใช้เสียงจากฟุตเทจเดิมเป็นหลัก')+'\nCTA: '+p.cta+'\n\nขั้นตอนทำงาน:\n1) ตรวจไฟล์ต้นฉบับจริงในโฟลเดอร์ที่อนุญาตและตรวจเครื่องมือตัดต่อที่พร้อมใช้\n2) ถอดบทสนทนา เลือกช่วงสำคัญ เสนอ Shot List และ Hook พร้อม Timecode\n3) ตัดต่อ ใส่ซับและกราฟิก โดยรักษาข้อเท็จจริงและไม่สร้างคำพูดที่ไม่ได้มีในต้นฉบับ\n4) เรนเดอร์ MP4 ผ่านเครื่องมือที่มี ตรวจผลด้านภาพ เสียง ระยะเวลา และ Subtitle\n5) รายงานพาธไฟล์จริง พร้อมรายการตรวจรับและข้อจำกัด\n\nข้อจำกัด: ห้ามเรียก API มีค่าใช้จ่าย อัปโหลดคลิปหรือเผยแพร่ โดยไม่มีการอนุญาตแยกต่างหาก หากเครื่องมือหรือสิทธิ์ไม่พร้อม ให้รายงานแทนการอ้างว่าตัดต่อเสร็จแล้ว';}
  function updateStudio(){var p=platforms[currentPlatform];if(!p)return;var seconds=Number(q('#hm-duration').value);str('hm-duration-out',durationLabel(seconds));str('hm-ratio-text',p.ratio+' · '+durationLabel(seconds));str('hm-content-meta',p.kind);var landscape=p.ratio==='16:9';q('#hm-phone').classList.toggle('hm-landscape',landscape);q('#hm-preview-title').textContent=q('#hm-topic').value.trim().slice(0,46)||'AI Agent ช่วยตัดต่อ?';q('#hm-demo-sub').textContent=q('#hm-subtitles').checked?'ตัวอย่างซับภาษาไทย (จำลอง)':'ไม่มีซับฝังบนภาพ';q('#hm-demo-sub').style.display=q('#hm-subtitles').checked?'inline-block':'none';qa('.hm-frame-glow').forEach(function(el){el.style.opacity=q('#hm-motion').checked?'1':'.22';});q('#hm-progress-fill').style.width=Math.min(94,Math.max(12,seconds/p.max*100))+'%';q('#hm-prompt-text').value=prompt();}
  qa('[data-platform]').forEach(function(b){b.addEventListener('click',function(){currentPlatform=b.dataset.platform;var p=platforms[currentPlatform];qa('[data-platform]').forEach(function(x){var on=x===b;x.classList.toggle('is-current',on);x.setAttribute('aria-pressed',String(on));});var range=q('#hm-duration');range.min=p.min;range.max=p.max;range.step=p.step;range.value=p.default;var lo=q('.hm-minmax');if(lo)lo.innerHTML='<span>'+durationLabel(p.min)+'</span><span>'+durationLabel(p.max)+'</span>';updateStudio();});});
  ['hm-format','hm-topic','hm-duration','hm-subtitles','hm-motion','hm-voice'].forEach(function(id){q('#'+id).addEventListener('input',updateStudio);q('#'+id).addEventListener('change',updateStudio);});
  q('#hm-generate-prompt').addEventListener('click',function(){updateStudio();q('#hm-prompt-text').focus();str('hm-copy-status','สร้าง Prompt จากตัวเลือกปัจจุบันแล้ว');});
  function feedback(s){str('hm-copy-status',s);}
  function copyPrompt(){var v=q('#hm-prompt-text').value;if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(v).then(function(){feedback('✓ คัดลอก Prompt แล้ว');}).catch(function(){fallbackCopy();});}else fallbackCopy();}
  function fallbackCopy(){var el=q('#hm-prompt-text');el.focus();el.select();var success=false;try{success=!!document.execCommand('copy');}catch(e){}feedback(success?'✓ คัดลอก Prompt แล้ว':'กรุณาเลือกข้อความและคัดลอกด้วยตนเอง');}
  q('#hm-copy-prompt').addEventListener('click',copyPrompt);q('#hm-copy-prompt-bottom').addEventListener('click',copyPrompt);
  updateStudio();

  /* Hypothetical cost scenario. Compare user's own time and tool spend; never a model benchmark. */
  var metricIds=['hm-clip-count','hm-manual-min','hm-ai-min','hm-hour-rate','hm-ai-cost'];
  function metrics(){var clips=Number(q('#hm-clip-count').value),manual=Number(q('#hm-manual-min').value),assist=Number(q('#hm-ai-min').value),rate=Number(q('#hm-hour-rate').value),api=Number(q('#hm-ai-cost').value),totalM=clips*manual/60,totalA=clips*assist/60,delta=totalM-totalA,costDiff=(totalM-totalA)*rate-clips*api;str('hm-count-value',fmt.format(clips)+' คลิป');str('hm-manual-value',manual+' นาที');str('hm-ai-value',assist+' นาที');str('hm-rate-value','฿'+fmt.format(rate));str('hm-cost-value','฿'+fmt.format(api));q('#hm-hours-saved').innerHTML=delta.toFixed(1)+' <small>ชม./เดือน</small>';str('hm-manual-total',totalM.toFixed(1)+' ชม.');str('hm-ai-total',totalA.toFixed(1)+' ชม.');var max=Math.max(totalM,totalA,.001);q('#hm-bar-manual').style.width=Math.max(3,totalM/max*100)+'%';q('#hm-bar-ai').style.width=Math.max(3,totalA/max*100)+'%';str('hm-cost-saving',(costDiff<0?'−':'')+'฿'+fmt.format(Math.abs(Math.round(costDiff))));q('#hm-cost-saving').style.color=costDiff<0?'#f7b879':'#c8f878';str('hm-metric-summary',costDiff>=0?'สถานการณ์นี้มีส่วนต่างทางการเงินเชิงบวกตามค่าที่คุณตั้งไว้':'สถานการณ์นี้มีต้นทุนรวมสูงกว่าการทำเองตามค่าที่คุณตั้งไว้');}
  metricIds.forEach(function(id){q('#'+id).addEventListener('input',metrics);});metrics();
})();
