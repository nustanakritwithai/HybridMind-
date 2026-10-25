/** Build the only catalog shape that may enter a browser or runnable bundle. */
export function projectPublicCatalog(catalog) {
  const topics = catalog?.topics ?? [];
  const topicIds = new Set(topics.map(topic => topic.topic_id));
  const articles = (catalog?.articles ?? []).filter(article =>
    article?.status === 'published' && article?.visibility === 'public' && article?.password_protected === false);
  const articleIds = new Set(articles.map(article => article.article_id));
  const entityIds = new Set([...topicIds, ...articleIds]);
  const sections = (catalog?.sections ?? []).filter(section => articleIds.has(section.article_id));
  const relationships = (catalog?.relationships ?? []).filter(relation =>
    entityIds.has(relation.from_id) && entityIds.has(relation.to_id));
  const learningPaths = (catalog?.learning_paths ?? []).filter(path =>
    (path.ordered_topic_ids ?? []).every(id => topicIds.has(id)));

  return {
    schema_version: catalog?.schema_version ?? '1.0.0',
    snapshot: {
      source: catalog?.snapshot?.source ?? 'wordpress_public_rest_api',
      source_url: catalog?.snapshot?.source_url ?? 'https://hybridmind.online/wp-json/wp/v2/posts',
      captured_at: catalog?.snapshot?.captured_at ?? new Date(0).toISOString(),
      coverage_complete: false,
      page_count: 0,
      published_total: articles.length,
      note: `Client-safe projection: ${articles.length} articles were explicitly verified as published, public, and non-password-protected. The full offline inventory and unknown rows are not included. WordPress remains canonical for article bodies, media, and interactive blocks.`,
    },
    articles,
    sections,
    topics,
    relationships,
    learning_paths: learningPaths,
  };
}
