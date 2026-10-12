let cache=null;
export async function loadPathways(){ if(cache)return cache; cache=await (await fetch('./data/pathways.json')).json(); return cache; }
export async function searchPathways(query=''){
  const all=await loadPathways(); const q=query.trim().toLowerCase();
  if(!q)return all;
  return all.filter(p=>`${p.concept} ${p.source} ${p.steps.map(s=>s.text).join(' ')}`.toLowerCase().includes(q));
}
export async function findRelatedPathways(term){
  const all=await loadPathways(); const q=term.toLowerCase();
  return all.filter(p=>p.concept.toLowerCase().includes(q)||q.includes(p.concept.toLowerCase())).slice(0,4);
}
