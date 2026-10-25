import {scoped,readControls,restoreControls,addReset} from './helpers.mjs';
export function mountAuthorizationLab(root,restored=null) {
 const {q,listen,dispose}=scoped(root);
 const initial=readControls(root);restoreControls(root,restored?.controls);
  var tenant = q('#hmacl-tenant');
  var live = q('#hmacl-live');
  var error = q('#hmacl-error');
  var early = q('#hmacl-early-result');
  var late = q('#hmacl-late-result');
  var filterPosition = q('#hmacl-filter-position');
  var topk = q('#hmacl-topk');
  var orderResult = q('#hmacl-order-result');
  var nodes = Array.prototype.slice.call(root.querySelectorAll('.acl-node'));
  var step = Number.isInteger(restored?.step) ? Math.max(0,Math.min(3,restored.step)) : 0;
  var labels = ['trusted auth context', 'server policy', 'text hydration', 'reranker'];
  var fixedCandidates = ['doc-forbidden', 'doc-A1', 'doc-B1'];

  function policyFor(key) {
    return key === 'tenant-a' ? ['doc-A1'] : key === 'tenant-b' ? ['doc-B1'] : [];
  }

  function updateOrderResult(key) {
    var allowed = policyFor(key);
    var k = Number(topk.value);
    var position = filterPosition.value;
    var hydrated = position === 'early'
      ? fixedCandidates.filter(function (id) { return allowed.indexOf(id) !== -1; }).slice(0, k)
      : fixedCandidates.slice(0, k);
    var reranker = hydrated.slice();
    var output = reranker.filter(function (id) { return allowed.indexOf(id) !== -1; });
    orderResult.textContent = (position === 'early' ? 'กรอง ID ก่อน hydration' : 'กรองหลัง hydration/reranker') +
      ' · Top-k ' + k + ' · allowed IDs [' + allowed.join(', ') + ']' +
      ' · hydrated IDs [' + hydrated.join(', ') + '] · reranker IDs [' + reranker.join(', ') +
      '] · allowed output IDs [' + output.join(', ') + ']. ' +
      (position === 'late' && hydrated.length
        ? 'ข้อความถูกโหลดก่อนตรวจ policy ในลำดับที่ผิด แม้ allowed output จะว่างก็เอาข้อความกลับจากขั้นก่อนหน้าไม่ได้.'
        : 'กรอง ID ก่อนเปิดข้อความ; ข้อมูลและลำดับทั้งหมดเป็น fixture สังเคราะห์ ไม่ใช่ผลทดสอบระบบจริง.');
  }

  function paint() {
    var key = tenant.value;
    var allowed = policyFor(key);
    var principal = key === 'missing' ? 'ไม่มี trusted ACL context' : 'principal-1 (ตัวอย่างสมมติ)';
    var candidate = key === 'tenant-b' ? 'doc-B1' : key === 'tenant-a' ? 'doc-A1' : null;
    var allowedText = allowed.length ? allowed.join(', ') : 'ไม่มี';
    var passed = candidate && allowed.indexOf(candidate) !== -1;
    var nodeData = key === 'missing'
      ? [['Identity', 'ไม่มี trusted ACL context'], ['ปฏิเสธโดยปริยาย', 'allowed IDs: ไม่มี'], ['ไม่ hydrate ข้อความ', 'ไม่มี ID ผ่าน policy'], ['ไม่มีข้อความเข้า reranker', 'หยุดก่อนสร้างคำตอบ']]
      : [['TrustedAuthContext', principal + ' / ' + key], ['Server policy', 'allowed IDs: ' + allowedText], ['Hydration', 'อ่านข้อความของ ' + allowedText], ['Reranker', 'ใช้เฉพาะข้อความที่อนุญาต']];

    early.textContent = key === 'missing'
      ? 'บริบท ACL ไม่มี → deny-by-default → ไม่มี document ID หรือข้อความถูกส่งต่อในตัวอย่างนี้.'
      : 'Server policy อนุญาต ' + allowedText + ' → กรอง candidate IDs ก่อน hydration → อ่านได้เฉพาะข้อความของ ' + allowedText + '.';
    late.textContent = key === 'missing'
      ? 'ไม่มี ACL context จึงต้องปฏิเสธโดยปริยาย; โหมดกรองช้าด้านล่างแสดงลำดับที่ผิด โดยจำลองว่าข้อความถูกโหลดก่อนตรวจ policy.'
      : 'ลำดับสังเคราะห์เริ่มจาก doc-forbidden (อันดับสูงสุด) → ข้อความนั้นถูก hydrate ก่อน → policy ปฏิเสธภายหลัง; ' + allowedText + ' จึงเป็นเอกสารเดียวที่เหลือหลังกรอง.';

    nodes.forEach(function (node, index) {
      node.classList.toggle('is-active', index === step);
      node.classList.toggle('is-denied', key === 'missing' && index === 1);
      node.querySelector('strong').textContent = nodeData[index][0];
      node.querySelector('small').textContent = nodeData[index][1];
    });
    live.textContent = 'ขั้นตอน ' + (step + 1) + ' จาก 4: ' + labels[step] + '. ' +
      'Principal: ' + principal + '. Allowed IDs จาก mock server policy: ' + allowedText +
      '. ' + (passed ? 'ID ' + candidate + ' อยู่ในชุดที่อนุญาตของสถานการณ์สมมติ.' : 'ไม่มี ID ที่อนุญาตให้ส่งต่อในสถานการณ์นี้.');
    updateOrderResult(key);
  }

  function safely(run) {
    try {
      error.hidden = true;
      run();
    } catch (_) {
      error.hidden = false;
    }
  }

  listen(q('#hmacl-prev'),'click', function () {
    safely(function () { step = Math.max(0, step - 1); paint(); });
  });
  listen(q('#hmacl-next'),'click', function () {
    safely(function () { step = Math.min(3, step + 1); paint(); });
  });
  listen(q('#hmacl-reset'),'click', function () {
    safely(function () { step = 0; tenant.value = 'tenant-a'; filterPosition.value = 'early'; topk.value = '1'; paint();  });
  });
  listen(tenant,'change', function () {
    safely(function () { step = 0; paint(); });
  });
  listen(filterPosition,'change', function () { safely(function () { updateOrderResult(tenant.value); }); });
  listen(topk,'change', function () { safely(function () { updateOrderResult(tenant.value); }); });

 function reset(){step=0;restoreControls(root,initial);safely(paint);}
 addReset(root,reset,listen);safely(paint);
 return {getState:()=>({controls:readControls(root),step}),dispose,reset};
}
