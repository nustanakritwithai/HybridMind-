// Exact reviewed snapshots only. Imported script text is NEVER executed.
export const REVIEWED_LABS = Object.freeze({
  'hm:article:2241': Object.freeze({hash:'sha256:101dff6b44b53b804559fb1cdd260783beb713eebcd5d49b8130b7f313e050be',revision:'2026-10-18T21:05:05.000Z',url:'https://hybridmind.online/2026/10/16/rag-citation-gate-current-revision-sha256-utf8-byte-span/',roots:Object.freeze({'hm-video-lab':'video','hmcite-20261016':'citation'})}),
  'hm:article:2310': Object.freeze({hash:'sha256:819c59704b0efee0105745e92a5b2300632112ec1f8b478ac0c5ccf0fbef7d6a',revision:'2026-10-18T21:04:45.000Z',url:'https://hybridmind.online/2026/10/16/rag-document-authorization-before-hydration/',roots:Object.freeze({'hm-video-lab':'video','hmacl-20261016':'authorization'})}),
  'hm:article:2494': Object.freeze({hash:'sha256:49029c928f54c86d79bb8f579aed060794a03170f9d7c31128f59dd2563fe80d',revision:'2026-10-18T21:04:33.000Z',url:'https://hybridmind.online/2026/10/18/agent-approval-gate-action-fingerprint/',roots:Object.freeze({'hm-video-lab':'video','ap2217-labs':'approval'})}),
});
const approved = new WeakMap();
const markup = new WeakMap();
export async function prepareInteractiveEntries(entries) {
  const accepted = [];
  for (const entry of entries) {
    approved.delete(entry);
    const review = REVIEWED_LABS[entry.article_id];
    if (!review || entry.source_hash !== review.hash || entry.source_revision !== review.revision
      || entry.canonical_url !== review.url || entry.provenance !== 'wordpress_export'
      || entry.source_hash_status !== 'source_bytes_verified' || entry.blocks?.length !== 1
      || entry.blocks[0].type !== 'html_fragment' || !globalThis.crypto?.subtle) continue;
    const html = entry.blocks[0].html;
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(html));
    const hash = 'sha256:' + [...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('');
    if (hash !== review.hash) continue;
    approved.set(entry,{html, review}); accepted.push(entry.article_id);
  }
  return accepted;
}
export function approvedLabRoots(entry) {
  const proof = approved.get(entry);
  if (!proof || proof.html !== entry.blocks?.[0]?.html || entry.blocks.length !== 1
    || entry.source_hash !== proof.review.hash || entry.source_revision !== proof.review.revision
    || entry.canonical_url !== proof.review.url || REVIEWED_LABS[entry.article_id] !== proof.review
    || entry.provenance !== 'wordpress_export' || entry.source_hash_status !== 'source_bytes_verified'
    || entry.blocks[0].type !== 'html_fragment') return null;
  return proof.review.roots;
}
export function registerLabMarkup(node, entry, sourceId) {
  const roots = approvedLabRoots(entry), kind = roots?.[sourceId];
  if (!kind) return;
  markup.set(node,Object.freeze({kind,articleId:entry.article_id,sourceId,key:entry.article_id+'@'+entry.source_hash+':'+kind}));
}
export function labMarkupIdentity(node) { return markup.get(node) ?? null; }
