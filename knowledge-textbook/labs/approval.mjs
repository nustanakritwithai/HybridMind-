import {scoped,readControls,restoreControls,addReset} from './helpers.mjs';
export function mountApprovalLab(root,restored=null){
 const {q:select,listen,dispose}=scoped(root); const q=k=>select('#ap2217-'+k);
 const initial=readControls(root);restoreControls(root,restored?.controls);
var fields=["tenant","actor","tool","report","revision","visibility","body"],receipt=restored?.receipt ? structuredClone(restored.receipt) : null,status=q("status"),scene=q("scene"),sceneResult=q("scene-result"),track=q("track"),view=Number.isInteger(restored?.view)?restored.view%4:0;
function snapshot(){var o={};fields.forEach(function(k){o[k]=q(k).value;});return o;}
function show(message,state){status.textContent=message;status.setAttribute("data-state",state||"info");}
listen(q("approve"),"click",function(){receipt={approved:snapshot(),state:"unused"};show("สร้าง receipt จำลองสำหรับ snapshot นี้แล้ว · digest(snapshot) · TTL ตัวอย่าง 30 วินาที","ok");});
listen(q("expire"),"click",function(){if(!receipt){show("DENY_UNKNOWN · ยังไม่มี receipt ให้ทำเครื่องหมายหมดอายุ","deny");return;}if(receipt.state==="consumed"){show("DENY_USED · ใช้แล้ว ไม่เปลี่ยนสถานะย้อนหลัง","deny");return;}if(receipt.state==="invalidated"){show("DENY_INVALIDATED · ถูกยกเลิกถาวรแล้ว","deny");return;}receipt.state="expired";show("DENY_EXPIRED · ตั้งสถานะหมดอายุด้วยมือในแบบจำลอง ไม่ได้รอ TTL 30 วินาที","deny");});
listen(q("consume"),"click",function(){
 if(!receipt){show("DENY_UNKNOWN · ยังไม่มี receipt","deny");return;}
 var now=snapshot(),approved=receipt.approved;
 if(now.tenant!==approved.tenant||now.actor!==approved.actor){show("DENY_SCOPE · tenant หรือ actor ไม่ตรง ไม่ใช้หรือทำให้ receipt ของเจ้าของเดิมเสีย","deny");return;}
 if(receipt.state==="invalidated"){show("DENY_INVALIDATED · ใช้ต่อไม่ได้ถาวร แม้คืนค่าฟิลด์เดิม","deny");return;}
 if(receipt.state==="consumed"){show("DENY_USED · receipt ถูกใช้แล้ว","deny");return;}
 if(receipt.state==="expired"){show("DENY_EXPIRED · หมดอายุตามขั้นจำลอง","deny");return;}
 var changed=fields.filter(function(k){return approved[k]!==now[k];});
 if(changed.length){receipt.state="invalidated";show("DENY_CHANGED · ฟิลด์ที่เปลี่ยน: "+changed.join(", ")+" · invalidate ถาวร","deny");return;}
 receipt.state="consumed";show("ALLOW_MOCK_ONLY · snapshot ตรง ใช้ได้ครั้งเดียวในแบบจำลอง ไม่มีผลภายนอก","ok");
});
listen(q("reset"),"click",function(){receipt=null;var d={tenant:"tenant-demo",actor:"actor-demo",tool:"report.publish.v1",report:"report-17",revision:"1",visibility:"private",body:"body-A"};fields.forEach(function(k){q(k).value=d[k];});show("เริ่มใหม่ · ยังไม่มี receipt · สร้าง receipt ให้คำขอ A ก่อน","info");});
var scenes={a:{request:"คำขอ A · private",receipt:"receipt ผูกกับ A",gate:"ประตู · fingerprint ตรง",result:"ALLOW_MOCK_ONLY · snapshot A ตรงกับ receipt และผ่านประตูจำลองหนึ่งครั้ง"},changed:{request:"คำขอ B · public",receipt:"receipt เดิมผูกกับ A",gate:"ประตู · ปฏิเสธก่อนผลกระทบ",result:"DENY_CHANGED · fingerprint ต่างกัน; receipt ถูก invalidate ถาวร แม้คืน private ก็ใช้ซ้ำไม่ได้"},expired:{request:"คำขอ A · private",receipt:"receipt · ตั้งหมดอายุด้วยมือ",gate:"ประตู · อายุไม่ผ่าน",result:"DENY_EXPIRED · สถานการณ์นี้ตั้งหมดอายุด้วยมือ ไม่มีนาฬิกาและไม่ได้รอ TTL"},replay:{request:"คำขอ A · private",receipt:"receipt · ใช้แล้วหนึ่งครั้ง",gate:"ประตู · replay ถูกปฏิเสธ",result:"DENY_USED · receipt ที่ใช้สำเร็จแล้วใช้ซ้ำไม่ได้"}};
function renderScene(){var s=scenes[scene.value];q("request-node").textContent=s.request;q("receipt-node").textContent=s.receipt;q("gate-node").textContent=s.gate;sceneResult.textContent=s.result;sceneResult.setAttribute("data-state",scene.value==="a"?"ok":"deny");}
function renderView(){track.setAttribute('data-view',String(view));q('view').textContent='หมุนมุมมอง · '+['ภาพรวม','ซ้าย','ด้านหน้า','ขวา'][view];}
listen(scene,"change",renderScene);listen(q("view"),"click",function(){view=(view+1)%4;renderView();});
 function reset(){restoreControls(root,initial);receipt=null;view=0;renderView();show('เริ่มใหม่ · ยังไม่มี receipt · สร้าง receipt จากคำขอ A ก่อน','info');renderScene();}
 addReset(root,reset,listen);renderScene();renderView();
 if(restored?.message)show(restored.message,restored.status);
 return {getState:()=>({controls:readControls(root),receipt:receipt?structuredClone(receipt):null,view,message:status.textContent,status:status.dataset.state}),dispose,reset};
}
