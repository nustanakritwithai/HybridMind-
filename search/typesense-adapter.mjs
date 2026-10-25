/** Build a Typesense adapter around an injected SDK-compatible client. No endpoint or key is configured here. */
export function createTypesenseAdapter(client, collectionName) {
  if (!client?.collections || !collectionName) throw new TypeError('Inject a Typesense client and collection name');
  return { async search(query, filters = {}) {
    const clauses=[];
    for (const [key,field] of [['topicId','topicId'],['contentType','contentType'],['difficulty','difficulty'],['locale','locale']]) if (filters[key]) clauses.push(`${field}:=${JSON.stringify(filters[key])}`);
    const response=await client.collections(collectionName).documents().search({q:query,query_by:'title,snippet,searchable',...(clauses.length?{filter_by:clauses.join(' && ')}:{}),sort_by:filters.sort==='date'?'date:desc':'_text_match:desc'});
    const results=(response.hits??[]).map(({document, text_match=0})=>({kind:document.kind,id:document.id,title:document.title,snippet:document.snippet??'',url:document.url,topicId:document.topicId??null,contentType:document.contentType??null,difficulty:document.difficulty??null,score:text_match}));
    return {query,mode:'typesense',total:response.found??results.length,results};
  }};
}
