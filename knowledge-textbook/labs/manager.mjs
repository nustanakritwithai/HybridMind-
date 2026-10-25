import {labMarkupIdentity} from './registry.mjs';
import {mountVideoLab} from './video.mjs';
import {mountCitationLab} from './citation.mjs';
import {mountAuthorizationLab} from './authorization.mjs';
import {mountApprovalLab} from './approval.mjs';

const constructors = Object.freeze({video:mountVideoLab,citation:mountCitationLab,authorization:mountAuthorizationLab,approval:mountApprovalLab});
const mounted = new Map(), stateByRevision = new Map();
export function disposeInteractiveLabs(container) {
  for (const [node,record] of mounted) {
    if (!container.contains(node)) continue;
    stateByRevision.set(record.key,record.instance.getState());
    record.instance.dispose(); mounted.delete(node);
  }
}
export function mountInteractiveLabs(container) {
  for (const root of container.querySelectorAll('.hm-reviewed-lab')) {
    const identity = labMarkupIdentity(root);
    if (!identity || mounted.has(root)) continue;
    try {
      const instance = constructors[identity.kind](root,stateByRevision.get(identity.key) ?? null);
      mounted.set(root,{key:identity.key,instance}); root.dataset.labReady='true';
    } catch (error) {
      root.dataset.labReady='error';
      const note=root.ownerDocument.createElement('p');note.className='fallback-note';
      note.textContent='ห้องทดลองเปิดไม่ได้ในครั้งนี้ ลองโหลดหน้าใหม่ได้ เนื้อหาและรูปยังอ่านได้ตามปกติ';root.prepend(note);
      console.error('Reviewed lab failed to mount',identity.articleId,identity.kind,error);
    }
  }
}
