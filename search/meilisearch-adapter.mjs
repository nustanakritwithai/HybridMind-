/** Build a Meilisearch adapter around an injected SDK-compatible client. No endpoint or key is configured here. */
export function createMeilisearchAdapter(client, indexName) {
  if (!client?.index || !indexName) throw new TypeError('Inject a Meilisearch client and index name');
  return { async search(query, filters = {}) {
    const clauses=[];
    for (const key of ['topicId','contentType','difficulty','locale']) if (filters[key]) clauses.push(`${key} = ${JSON.stringify(filters[key])}`);
    const response=await client.index(indexName).search(query,{filter:clauses.length?clauses:undefined, sort:filters.sort==='date'?['date:desc']:undefined});
    const results=(response.hits??[]).map(hit=>({kind:hit.kind,id:hit.id,title:hit.title,snippet:hit.snippet??'',url:hit.url,topicId:hit.topicId??null,contentType:hit.contentType??null,difficulty:hit.difficulty??null,score:hit._rankingScore??0}));
    return {query,mode:'meilisearch',total:response.estimatedTotalHits??response.totalHits??results.length,results};
  }};
}
