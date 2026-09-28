let cache=null;
export async function loadReferences(){ if(cache)return cache; cache=await (await fetch('./data/references.json')).json(); return cache; }
export async function searchReferences(query=''){
  const all=await loadReferences(); const q=query.toLowerCase().trim(); if(!q)return all;
  return all.filter(r=>`${r.author} ${r.title} ${r.relevance}`.toLowerCase().includes(q));
}
