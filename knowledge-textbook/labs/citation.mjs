import {scoped,readControls,restoreControls,addReset} from './helpers.mjs';
export function mountCitationLab(root, restored=null) {
 const {q,listen,dispose}=scoped(root); const document=root.ownerDocument;
 const initial=readControls(root); restoreControls(root,restored?.controls);
  var current = q("#hmcite-current");
  var citation = q("#hmcite-citation");
  var timeline = q("#hmcite-timeline-result");
  var cases = q("#hmcite-case");
  var caseResult = q("#hmcite-case-result");
  var fixture = {
    v1: { quote: "ต้องขออนุมัติก่อนเผยแพร่", digestLabel: "digest ของ v1" },
    v2: { quote: "ต้องได้รับอนุมัติก่อนส่งออก", digestLabel: "digest ของ v2" }
  };

  function updateTimeline() {
    var currentVersion = current.value;
    var citedVersion = citation.value;
    var isFresh = currentVersion === citedVersion;
    q('[data-value="current"]').textContent = currentVersion;
    q('[data-value="snapshot"]').textContent = currentVersion;
    q('[data-value="digest"]').textContent = fixture[currentVersion].digestLabel;
    q('[data-value="citation"]').textContent = citedVersion;
    q('[data-value="quote"]').textContent = "“" + fixture[citedVersion].quote + "”";
    timeline.dataset.state = isFresh ? "verified" : "rejected";
    timeline.querySelector('[data-value="timeline-title"]').textContent = isFresh
      ? "สมมติ: revision ตรง · การตรวจ hash และช่วงข้อความผ่านแล้ว"
      : "STALE · revision ไม่ตรงกับ manifest ปัจจุบัน";
    timeline.querySelector('[data-value="timeline-detail"]').textContent = isFresh
      ? "fixture นี้ตั้งสมมติฐานว่าการตรวจ SHA-256 กับ UTF-8 byte span ผ่านแล้ว จึงแสดงผลจำลอง QUOTE_VERIFIED เพื่อระบุตำแหน่ง quote เท่านั้น ไม่ยืนยัน truth หรือ entailment"
      : "citation ระบุ " + citedVersion + " แต่ manifest ปัจจุบันระบุ " + currentVersion + " จึงปฏิเสธก่อนใช้ quote แม้ digest ของฉบับเก่ายังตรงกับไบต์เก่า";
  }

  var outputs = {
    correct: {
      state: "verified",
      title: "QUOTE_VERIFIED · ตำแหน่ง quote ตรง",
      body: "สมมติว่า source_id อยู่ใน manifest ปัจจุบัน, revision ตรง, SHA-256 ที่คำนวณจากไบต์ปัจจุบันตรงกับ manifest, ขอบเขตไบต์ถูกต้อง และไบต์ที่เลือกเท่ากับ UTF-8 ของ quote ผลนี้ยืนยันตำแหน่งและความตรงของ quote เท่านั้น ไม่ยืนยันความจริงหรือ entailment (การที่หลักฐานรองรับข้อสรุป)"
    },
    stale: {
      state: "rejected",
      title: "ปฏิเสธ · STALE_REVISION",
      body: "citation ระบุ v1 แต่ manifest ฝั่งแอประบุ v2 เป็นฉบับปัจจุบัน แม้ digest ของ v1 ยังตรงกับไบต์ v1 ก็ไม่ผ่าน freshness gate"
    },
    mutated: {
      state: "rejected",
      title: "ปฏิเสธ · DIGEST_MISMATCH",
      body: "ไบต์ปัจจุบันเปลี่ยน แต่ digest ที่ manifest เชื่อถือยังเป็นค่าเดิม เมื่อนำ SHA-256 ของไบต์ปัจจุบันมาเทียบจึงไม่ตรง และหยุดก่อนยอมรับช่วง quote"
    },
    wrongspan: {
      state: "rejected",
      title: "ปฏิเสธ · QUOTE_SPAN_MISMATCH",
      body: "ตำแหน่ง [start,end) ที่ให้มาไม่ได้เลือก UTF-8 bytes เดียวกับ quote ที่แสดง หรือขอบเขตแบ่งอักขระหลายไบต์ จึงไม่ยืนยันตำแหน่ง quote"
    },
    unknown: {
      state: "rejected",
      title: "ปฏิเสธ · UNKNOWN_SOURCE",
      body: "ไม่พบ source_id ใน manifest ที่แอปเชื่อถือ citation จึงกำหนดแหล่งหรือฉบับปัจจุบันเองไม่ได้"
    }
  };

  function updateCase() {
    var result = outputs[cases.value];
    caseResult.dataset.state = result.state;
    caseResult.replaceChildren();
    var title = document.createElement("strong");
    title.textContent = result.title;
    var body = document.createElement("p");
    body.textContent = result.body;
    caseResult.append(title, body);
  }

  listen(current,"change", updateTimeline);
  listen(citation,"change", updateTimeline);
  listen(q("#hmcite-evaluate"),"click", updateCase);
  listen(cases,"change", updateCase);

 function reset(){restoreControls(root,initial);updateTimeline();updateCase();}
 addReset(root,reset,listen);updateTimeline();updateCase();
 return {getState:()=>({controls:readControls(root)}),dispose,reset};
}
