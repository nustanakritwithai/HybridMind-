export function applyContentRevisionOverlay(catalog, overlay) {
  if (!overlay) return catalog;
  if (overlay.schema_version !== '1.0.0' || !Array.isArray(overlay.articles)) throw new TypeError('Invalid public REST revision overlay');
  const next = structuredClone(catalog);
  const seen = new Set();
  for (const revision of overlay.articles) {
    if (seen.has(revision.article_id)) throw new TypeError(`Duplicate revision overlay: ${revision.article_id}`);
    seen.add(revision.article_id);
    const article = next.articles?.find(item => item.article_id === revision.article_id);
    if (!article || article.status !== 'published' || article.visibility !== 'public' || article.password_protected !== false) {
      throw new TypeError(`Revision overlay article is not explicitly public: ${revision.article_id}`);
    }
    if (article.canonical_url !== revision.canonical_url) throw new TypeError(`Revision overlay URL mismatch: ${revision.article_id}`);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(revision.source_revision)) throw new TypeError(`Invalid public revision timestamp: ${revision.article_id}`);
    if (!/^sha256:[a-f0-9]{64}$/.test(revision.source_hash)) throw new TypeError(`Invalid public source hash: ${revision.article_id}`);
    article.article_revision = revision.source_revision;
    article.modified_at = revision.source_revision;
    article.source_hash = revision.source_hash.slice('sha256:'.length);
  }
  for (const binding of overlay.sections ?? []) {
    const section = next.sections.find(item=>item.section_id===binding.section_id && item.article_id===binding.article_id);
    const article = next.articles.find(item=>item.article_id===binding.article_id);
    if (!section || !seen.has(binding.article_id) || article.article_revision!==binding.source_revision) throw new TypeError('Invalid source section revision binding');
    section.article_revision = binding.source_revision;
    section.anchor = binding.anchor;
    section.anchor_status = binding.anchor ? 'verified' : 'missing';
  }
  return next;
}
