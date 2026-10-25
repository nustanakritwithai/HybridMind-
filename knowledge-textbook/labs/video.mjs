import { scoped, readControls, restoreControls, addReset } from './helpers.mjs';

const stages = [
  { name: 'FOOTAGE', th: 'นำเข้าคลิปดิบ', tag: '● SOURCE', color: '#58e4f3', p: [-290, 36, -34], desc: 'จัดระเบียบไฟล์ ตรวจคุณภาพภาพและเสียง และกำหนดสิทธิ์เข้าถึงให้ AI Agent' },
  { name: 'STORY', th: 'วางโครงเรื่องและ Hook', tag: '● PLAN', color: '#91a6ff', p: [-174, -84, -44], desc: 'วิเคราะห์คลิป เลือกช่วงสำคัญ และเสนอ Script หรือ Hook ให้มนุษย์ตรวจรับ' },
  { name: 'EDIT', th: 'ตัดภาพและเสียง', tag: '● EDIT', color: '#ad8dff', p: [-10, -113, -8], desc: 'ส่งงานให้ซอฟต์แวร์ตัดต่อ ตัดส่วนเงียบ จัดลำดับช็อต และปรับจังหวะ' },
  { name: 'CAPTIONS', th: 'สร้างและตรวจซับ', tag: '● TEXT', color: '#f7b879', p: [165, -68, 62], desc: 'ถอดเสียงเป็นข้อความ วางซับตามเวลา และตรวจชื่อเฉพาะกับคำผิดภาษาไทย' },
  { name: 'GRAPHICS', th: 'เพิ่มกราฟิกและเสียง', tag: '● STYLE', color: '#d7f686', p: [274, 69, 55], desc: 'ใส่ Title, Lower Third, Motion Graphic และเสียงประกอบตามสิทธิ์ที่มี' },
  { name: 'RENDER', th: 'ส่งออกและตรวจไฟล์ MP4', tag: '● OUTPUT', color: '#5ce8c0', p: [78, 153, 91], desc: 'เรนเดอร์ผ่านเครื่องมือที่พร้อม ตรวจความละเอียด เสียง Subtitle และไฟล์ก่อนส่งมอบ' }
];
const topPositions = [[-310,18,-164],[-178,-24,-92],[-14,-56,-12],[170,-22,90],[332,30,198],[118,88,302]];
const platforms = {
  tiktok: { name: 'TikTok', ratio: '9:16', kind: 'VERTICAL · SHORT FORM', min: 15, max: 180, step: 15, value: 45, hook: '3 วินาทีแรก', cta: 'ชวนติดตามบัญชี', title: 'Hook เร็ว ซับอ่านง่าย' },
  reels: { name: 'Instagram Reels', ratio: '9:16', kind: 'VERTICAL · REELS', min: 15, max: 180, step: 15, value: 45, hook: '3 วินาทีแรก', cta: 'ชวนบันทึกและแชร์', title: 'เนื้อหากระชับ ชวนแชร์' },
  youtube: { name: 'YouTube (long-form)', ratio: '16:9', kind: 'LANDSCAPE · LONG FORM', min: 300, max: 600, step: 30, value: 420, hook: '15 วินาทีแรก', cta: 'ชวนกดติดตามและดูวิดีโอถัดไป', title: 'แบ่งบทและรักษาจังหวะ' }
};
const contentKinds = { knowledge: 'คลิปให้ความรู้ AI', product: 'คลิปแนะนำสินค้า Affiliate', live: 'ไฮไลต์จากไลฟ์' };
const metricIds = ['hm-clip-count', 'hm-manual-min', 'hm-ai-min', 'hm-hour-rate', 'hm-ai-cost'];
const studioIds = ['hm-format', 'hm-topic', 'hm-duration', 'hm-subtitles', 'hm-motion', 'hm-voice'];

export function mountVideoLab(root, restored = null) {
  if (!root || !root.isConnected) return { getState: () => ({}), dispose() {}, reset() {} };
  const { q, qa, listen, dispose: disposeScope } = scoped(root);
  const cleanups = [];
  let disposed = false;
  const alive = () => !disposed && root.isConnected;
  const byId = (id) => q(`#${id}`);
  const text = (id, value) => { const el = byId(id); if (el) el.textContent = value; };
  const numberFormat = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });
  const canvas = byId('hm-3d-canvas');
  const ctx = canvas?.getContext?.('2d') || null;
  const initialControls = readControls(root);
  let selected = 0, camera = 'orbit', yaw = -.37, pitch = .24, playing = true;
  let drag = null, raf = 0, inView = true, lastT = 0, phase = 0, hits = [];
  let size = { w: 960, h: 545, dpr: 1 };
  const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const reducedMotion = !!motionQuery?.matches;
  if (reducedMotion) playing = false;
  let currentPlatform = 'tiktok';
  if ('MutationObserver' in window && document.documentElement) {
    const rootObserver = new MutationObserver(() => { if (!root.isConnected) dispose(); });
    rootObserver.observe(document.documentElement, { childList: true, subtree: true });
    cleanups.push(() => rootObserver.disconnect());
  }

  function formatDuration(seconds) {
    const s = Number(seconds) || 0;
    return s < 60 ? `${s} วินาที` : `${Math.floor(s / 60)} นาที${s % 60 ? ` ${s % 60} วินาที` : ''}`;
  }
  function chooseStage(index) {
    selected = Math.max(0, Math.min(stages.length - 1, Number(index) || 0));
    const s = stages[selected];
    text('hm-stage-number', `${String(selected + 1).padStart(2, '0')} / 06`);
    text('hm-stage-title', s.th);
    text('hm-stage-desc', s.desc);
    text('hm-stage-indicator', s.tag);
    qa('.hm-node-btn').forEach((b) => {
      const on = Number(b.dataset.stage) === selected;
      b.classList.toggle('is-current', on); b.setAttribute('aria-pressed', String(on));
    });
    paint();
  }
  function selectCamera(view) {
    if (!['front','top','orbit'].includes(view)) return;
    camera = view;
    if (view === 'front') { yaw = 0; pitch = .1; }
    if (view === 'top') { yaw = -.28; pitch = 1.16; }
    if (view === 'orbit') { yaw = -.37; pitch = .24; }
    qa('.hm-view-btn').forEach((b) => {
      const on = b.dataset.camera === view; b.classList.toggle('is-current', on); b.setAttribute('aria-pressed', String(on));
    });
    text('hm-view-label', `${view.toUpperCase()} 3D`); paint(); requestFrame();
  }
  function setPlaying(value) {
    playing = !!value && !reducedMotion;
    const b = byId('hm-pause-scene');
    if (b) { b.textContent = playing ? 'Ⅱ' : '▶'; b.setAttribute('aria-pressed', String(!playing)); b.setAttribute('aria-label', playing ? 'หยุดภาพเคลื่อนไหว' : 'เล่นภาพเคลื่อนไหว'); }
    if (playing) { lastT = 0; requestFrame(); } else paint();
  }
  function project(point, index) {
    // Compact readers need separate hit targets: the desktop perspective packs
    // six cards into overlapping labels at phone width. Keep the six stages in
    // reading order, with restrained camera/drag offsets and room for the caption.
    if (size.w < 560 && Number.isInteger(index)) {
      const column=index%2, row=Math.floor(index/2);
      return {x:size.w*(column ? .74 : .26)+Math.sin(yaw)*5*(row-1),
        y:78+row*76+Math.sin(pitch)*5*(column ? 1 : -1),z:row*12,scale:.85};
    }
    const src = camera === 'top' && Number.isInteger(index) ? (topPositions[index] || point) : point;
    const [x, y, z] = src, c = Math.cos(yaw), s = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x1 = x*c-z*s, z1 = x*s+z*c, y1 = y*cp-z1*sp, z2 = y*sp+z1*cp;
    let persp = 700 / (700 + z2 + 55), scale = Math.min(size.w/950, size.h/590)*1.03;
    if (camera === 'top') { persp *= .92; scale *= .96; }
    return { x: size.w*.5+x1*scale*persp, y: size.h*.47+y1*scale*persp, z: z2, scale: scale*persp };
  }
  function line3d(a,b,color,width=1) { const pa=project(a),pb=project(b); ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke(); }
  function rounded(x,y,w,h,r) { r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath(); }
  function paint() {
    if (!ctx || !alive()) return;
    const w=size.w,h=size.h; ctx.clearRect(0,0,w,h);
    for(let i=0;i<75;i++){const xx=((i*97.27+31)%100)/100*w, yy=((i*63.2+19)%100)/100*h*.78;ctx.globalAlpha=.15+(i%6)*.08;ctx.fillStyle='#97d9ff';ctx.fillRect(xx,yy,i%8===0?2:1,i%8===0?2:1);}ctx.globalAlpha=1;
    for(let x=-450;x<=450;x+=75) line3d([x,177,-330],[x,177,330],'rgba(87,173,226,.075)',.9);
    for(let z=-330;z<=330;z+=66) line3d([-450,177,z],[450,177,z],'rgba(87,173,226,.085)',.9);
    for(let ring=0;ring<3;ring++){ctx.beginPath();for(let k=0;k<=76;k++){const a=k/76*Math.PI*2,r=345+ring*23,v=project([r*Math.cos(a),Math.sin(a*3+ring)*17,r*Math.sin(a)*.56]);if(k===0)ctx.moveTo(v.x,v.y);else ctx.lineTo(v.x,v.y);}ctx.strokeStyle=['rgba(76,228,245,.20)','rgba(137,142,255,.12)','rgba(76,228,245,.08)'][ring];ctx.lineWidth=1;ctx.stroke();}
    const nodes=stages.map((n,i)=>({n,i,pt:project(n.p,i)})).sort((a,b)=>b.pt.z-a.pt.z);
    for(let i=0;i<stages.length-1;i++){const a=project(stages[i].p,i),b=project(stages[i+1].p,i+1),mx=(a.x+b.x)/2,my=(a.y+b.y)/2-(camera==='top'?18:26)*Math.min(1,a.scale);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(mx,my,b.x,b.y);ctx.lineWidth=6;ctx.strokeStyle='rgba(64,222,241,.045)';ctx.stroke();ctx.lineWidth=1.6;ctx.strokeStyle=i===selected?'rgba(86,244,242,.9)':'rgba(99,171,213,.42)';ctx.stroke();const p=(phase*.24+i*.15)%1,xx=(1-p)**2*a.x+2*(1-p)*p*mx+p*p*b.x,yy=(1-p)**2*a.y+2*(1-p)*p*my+p*p*b.y;ctx.beginPath();ctx.arc(xx,yy,2.7,0,Math.PI*2);ctx.fillStyle='#adf6f4';ctx.shadowColor='#60e6ef';ctx.shadowBlur=13;ctx.fill();ctx.shadowBlur=0;}
    hits=[];
    for(const {n,i,pt} of nodes){let f=Math.max(.63,Math.min(1.15,pt.scale));if(camera==='top')f*=.9;const ww=128*f,hh=63*f,x=pt.x-ww/2,y=pt.y-hh/2,on=i===selected;ctx.save();ctx.shadowColor=on?n.color:'rgba(50,129,190,.23)';ctx.shadowBlur=on?32:12;rounded(x,y,ww,hh,11*f);ctx.fillStyle=on?'rgba(22,51,71,.97)':'rgba(15,28,48,.94)';ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=on?n.color:'rgba(117,174,220,.35)';ctx.lineWidth=on?2:1;ctx.stroke();ctx.fillStyle=n.color;rounded(x+10*f,y+11*f,5*f,5*f,2.5*f);ctx.fill();ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillStyle=on?'#fff':'#d6e5f5';ctx.font=`bold ${Math.round(12*f)}px ui-monospace, monospace`;ctx.fillText(n.name,x+21*f,y+16*f,ww-25*f);ctx.fillStyle='#91abc4';ctx.font=`${Math.round(9*f)}px ui-monospace, monospace`;ctx.fillText(`STAGE ${String(i+1).padStart(2,'0')}`,x+11*f,y+41*f,ww-19*f);ctx.restore();hits.push({i,x,y,w:ww,h:hh});}
    ctx.textAlign='center';ctx.fillStyle='rgba(103,185,217,.5)';ctx.font='10px ui-monospace, monospace';ctx.fillText('AI ORCHESTRATION // 3D PIPELINE VIEW',w/2,w<560?280:h*.17);
  }
  function requestFrame(){ if(!alive()||!ctx||!inView||!playing||raf)return; raf=requestAnimationFrame(step); }
  function step(t){raf=0;if(!alive()||!ctx||!inView||!playing)return;const delta=Math.min(60,t-(lastT||t));lastT=t;phase+=delta/1000;if(camera==='orbit'&&!drag&&!reducedMotion)yaw+=delta*.00010;paint();requestFrame();}
  function resize(){if(!alive()||!canvas||!ctx)return;const r=canvas.getBoundingClientRect();size.w=Math.max(250,r.width);size.h=Math.max(320,r.height);size.dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(size.w*size.dpr);canvas.height=Math.round(size.h*size.dpr);ctx.setTransform(size.dpr,0,0,size.dpr,0,0);paint();}
  if (ctx) {
    if ('ResizeObserver' in window) { const ro=new ResizeObserver(resize);ro.observe(canvas);cleanups.push(()=>ro.disconnect()); }
    else listen(window,'resize',resize);
    if ('IntersectionObserver' in window) { const io=new IntersectionObserver((entries)=>{if(!alive())return;inView=!!entries[0]?.isIntersecting;if(inView)requestFrame();},{rootMargin:'80px'});io.observe(canvas);cleanups.push(()=>io.disconnect()); }
    resize();
    listen(canvas,'pointerdown',(e)=>{drag={x:e.clientX,y:e.clientY,yaw,pitch,moved:false};try{canvas.setPointerCapture(e.pointerId);}catch{}});
    listen(canvas,'pointermove',(e)=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>7)drag.moved=true;if(drag.moved){camera='custom';yaw=drag.yaw+dx*.007;pitch=Math.max(-1.3,Math.min(1.48,drag.pitch+dy*.005));qa('.hm-view-btn').forEach((b)=>{b.classList.remove('is-current');b.setAttribute('aria-pressed','false');});text('hm-view-label','CUSTOM 3D');paint();}});
    listen(canvas,'pointerup',(e)=>{if(!drag)return;const moved=drag.moved;drag=null;if(!moved){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,hit=hits.slice().reverse().find((h)=>x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h);if(hit)chooseStage(hit.i);}requestFrame();});
    listen(canvas,'pointercancel',()=>{drag=null;});
    canvas.tabIndex=0;
    listen(canvas,'keydown',(e)=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){yaw+=e.key==='ArrowLeft'?-.13:.13;e.preventDefault();paint();}if(e.key==='ArrowUp'||e.key==='ArrowDown'){pitch=Math.min(1.48,Math.max(-1.3,pitch+(e.key==='ArrowUp'?-.13:.13)));e.preventDefault();paint();}});
  }
  qa('.hm-node-btn').forEach((b)=>listen(b,'click',()=>chooseStage(b.dataset.stage)));
  qa('.hm-view-btn').forEach((b)=>listen(b,'click',()=>selectCamera(b.dataset.camera)));
  if(byId('hm-pause-scene'))listen(byId('hm-pause-scene'),'click',()=>setPlaying(!playing));

  function makePrompt(){
    const p=platforms[currentPlatform]||platforms.tiktok, kind=contentKinds[byId('hm-format')?.value]||contentKinds.knowledge, seconds=Number(byId('hm-duration')?.value)||45, subject=byId('hm-topic')?.value.trim()||'the selected topic', subs=!!byId('hm-subtitles')?.checked, motion=!!byId('hm-motion')?.checked, voice=!!byId('hm-voice')?.checked;
    return `บทบาท: AI Video Editing Agent สำหรับ HYBRID MIND\n\nเป้าหมาย: ผลิต${kind} เรื่อง “${subject}”\nแพลตฟอร์ม: ${p.name}\nอัตราส่วน: ${p.ratio}\nความยาวเป้าหมาย: ${formatDuration(seconds)}\nHook: ดึงดูดความสนใจใน${p.hook}\nการเล่าเรื่อง: ${p.title}\nSubtitle: ${subs?'ใส่ซับไทยทุกช่วงที่พูด ตรวจคำผิดและ safe zone':'ไม่ต้องฝังซับบนภาพ แต่เตรียมไฟล์คำบรรยายถ้าทำได้'}\nMotion Graphic: ${motion?'ใช้กราฟิกอธิบายตัวเลข/ประเด็นสำคัญตาม CI':'ใช้ภาพและตัวอักษรแบบเรียบง่าย'}\nเสียงพากย์: ${voice?'พากย์ไทยด้วยเสียงที่ได้รับสิทธิ์และมีเครื่องมือรองรับ':'ใช้เสียงจากฟุตเทจเดิมเป็นหลัก'}\nCTA: ${p.cta}\n\nขั้นตอนทำงาน:\n1) ตรวจไฟล์ต้นฉบับจริงในโฟลเดอร์ที่อนุญาตและตรวจเครื่องมือตัดต่อที่พร้อมใช้\n2) ถอดบทสนทนา เลือกช่วงสำคัญ เสนอ Shot List และ Hook พร้อม Timecode\n3) ตัดต่อ ใส่ซับและกราฟิก โดยรักษาข้อเท็จจริงและไม่สร้างคำพูดที่ไม่ได้มีในต้นฉบับ\n4) เรนเดอร์ MP4 ผ่านเครื่องมือที่มี ตรวจผลด้านภาพ เสียง ระยะเวลา และ Subtitle\n5) รายงานพาธไฟล์จริง พร้อมรายการตรวจรับและข้อจำกัด\n\nข้อจำกัด: ห้ามเรียก API มีค่าใช้จ่าย อัปโหลดคลิปหรือเผยแพร่ โดยไม่มีการอนุญาตแยกต่างหาก หากเครื่องมือหรือสิทธิ์ไม่พร้อม ให้รายงานแทนการอ้างว่าตัดต่อเสร็จแล้ว`;
  }
  function updateStudio(){const p=platforms[currentPlatform];if(!p)return;const seconds=Number(byId('hm-duration')?.value)||0; text('hm-duration-out',formatDuration(seconds));text('hm-ratio-text',`${p.ratio} · ${formatDuration(seconds)}`);text('hm-content-meta',p.kind);byId('hm-phone')?.classList.toggle('hm-landscape',p.ratio==='16:9');text('hm-preview-title',(byId('hm-topic')?.value.trim()||'AI Agent ช่วยตัดต่อ?').slice(0,46));const sub=byId('hm-demo-sub');if(sub){sub.textContent=byId('hm-subtitles')?.checked?'ตัวอย่างซับภาษาไทย (จำลอง)':'ไม่มีซับฝังบนภาพ';sub.style.display=byId('hm-subtitles')?.checked?'inline-block':'none';}qa('.hm-frame-glow').forEach((el)=>{el.style.opacity=byId('hm-motion')?.checked?'1':'.22';});const fill=byId('hm-progress-fill');if(fill)fill.style.width=`${Math.min(94,Math.max(12,seconds/p.max*100))}%`;const promptBox=byId('hm-prompt-text');if(promptBox)promptBox.value=makePrompt();}
  function choosePlatform(key){const p=platforms[key];if(!p)return;currentPlatform=key;qa('[data-platform]').forEach((b)=>{const on=b.dataset.platform===key;b.classList.toggle('is-current',on);b.setAttribute('aria-pressed',String(on));});const range=byId('hm-duration');if(range){range.min=p.min;range.max=p.max;range.step=p.step;range.value=String(p.value);}const limits=q('.hm-minmax');if(limits){limits.replaceChildren();for(const value of [p.min,p.max]){const span=document.createElement('span');span.textContent=formatDuration(value);limits.append(span);}}updateStudio();}
  qa('[data-platform]').forEach((b)=>listen(b,'click',()=>choosePlatform(b.dataset.platform)));
  for(const id of studioIds){const el=byId(id);if(el){listen(el,'input',updateStudio);listen(el,'change',updateStudio);}}
  function setFeedback(value){text('hm-copy-status',value);}
  function fallbackCopy(){const el=byId('hm-prompt-text');if(!el)return;el.focus({preventScroll:true});el.select();let ok=false;try{ok=!!document.execCommand('copy');}catch{}setFeedback(ok?'✓ คัดลอก Prompt แล้ว':'กรุณาเลือกข้อความและคัดลอกด้วยตนเอง');}
  async function copyPrompt(){const value=byId('hm-prompt-text')?.value||'';if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(value);if(alive())setFeedback('✓ คัดลอก Prompt แล้ว');}catch{if(alive())fallbackCopy();}}else fallbackCopy();}
  const generate=byId('hm-generate-prompt');if(generate)listen(generate,'click',()=>{updateStudio();byId('hm-prompt-text')?.focus({preventScroll:true});setFeedback('สร้าง Prompt จากตัวเลือกปัจจุบันแล้ว');});
  for(const id of ['hm-copy-prompt','hm-copy-prompt-bottom'])if(byId(id))listen(byId(id),'click',copyPrompt);

  function updateMetrics(){const clips=Number(byId('hm-clip-count')?.value),manual=Number(byId('hm-manual-min')?.value),assist=Number(byId('hm-ai-min')?.value),rate=Number(byId('hm-hour-rate')?.value),api=Number(byId('hm-ai-cost')?.value),totalM=clips*manual/60,totalA=clips*assist/60,delta=totalM-totalA,costDiff=delta*rate-clips*api;
    text('hm-count-value',`${numberFormat.format(clips)} คลิป`);text('hm-manual-value',`${manual} นาที`);text('hm-ai-value',`${assist} นาที`);text('hm-rate-value',`฿${numberFormat.format(rate)}`);text('hm-cost-value',`฿${numberFormat.format(api)}`);const saved=byId('hm-hours-saved');if(saved){saved.replaceChildren(document.createTextNode(delta.toFixed(1)+' '));const small=document.createElement('small');small.textContent='ชม./เดือน';saved.append(small);}text('hm-manual-total',`${totalM.toFixed(1)} ชม.`);text('hm-ai-total',`${totalA.toFixed(1)} ชม.`);const max=Math.max(totalM,totalA,.001);for(const [id,value] of [['hm-bar-manual',totalM],['hm-bar-ai',totalA]]){const bar=byId(id);if(bar)bar.style.width=`${Math.max(3,value/max*100)}%`;}text('hm-cost-saving',`${costDiff<0?'−':''}฿${numberFormat.format(Math.abs(Math.round(costDiff)))}`);const saving=byId('hm-cost-saving');if(saving)saving.style.color=costDiff<0?'#f7b879':'#c8f878';text('hm-metric-summary',costDiff>=0?'สถานการณ์นี้มีส่วนต่างทางการเงินเชิงบวกตามค่าที่คุณตั้งไว้':'สถานการณ์นี้มีต้นทุนรวมสูงกว่าการทำเองตามค่าที่คุณตั้งไว้');}
  for(const id of metricIds){const el=byId(id);if(el)listen(el,'input',updateMetrics);}

  function applyDefaults(){restoreControls(root,initialControls);currentPlatform='tiktok';choosePlatform('tiktok');selectCamera('orbit');chooseStage(0);yaw=-.37;pitch=.24;drag=null;phase=0;setPlaying(!reducedMotion);updateStudio();updateMetrics();setFeedback('');paint();}
  function reset(){if(!alive())return;applyDefaults();}
  addReset(root,reset,listen);
  if(restored){restoreControls(root,restored.controls||restored);currentPlatform=platforms[restored.platform]?restored.platform:'tiktok';}
  // Preserve source control values while deriving the range configuration from its selected platform.
  const requestedPlatform=currentPlatform;
  const restoredDuration=restored?.controls?.['hm-duration']?.value ?? null;
  choosePlatform(requestedPlatform);
  if(restoredDuration!=null&&byId('hm-duration'))byId('hm-duration').value=restoredDuration;
  if(restored){
    const scene=restored.scene||restored;
    if(Number.isFinite(scene.selected))chooseStage(scene.selected);
    if(['orbit','front','top','custom'].includes(scene.camera)){
      camera=scene.camera;
      if(Number.isFinite(scene.yaw))yaw=scene.yaw;if(Number.isFinite(scene.pitch))pitch=scene.pitch;
      qa('.hm-view-btn').forEach((b)=>{const on=b.dataset.camera===camera;b.classList.toggle('is-current',on);b.setAttribute('aria-pressed',String(on));});text('hm-view-label',`${camera.toUpperCase()} 3D`);paint();
    }
    if(typeof scene.playing==='boolean')setPlaying(scene.playing);
  }
  updateStudio();updateMetrics();chooseStage(selected);setPlaying(playing);requestFrame();

  function getState(){return {controls:readControls(root),platform:currentPlatform,scene:{selected,camera,yaw,pitch,playing}};}
  function dispose(){if(disposed)return;disposed=true;if(raf)cancelAnimationFrame(raf);raf=0;for(const fn of cleanups.splice(0))fn();disposeScope();}
  return {getState,dispose,reset};
}
