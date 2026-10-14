let cache=null;
export async function loadPathways(){if(cache)return cache;try{const r=await fetch('./data/pathways.json');if(!r.ok)throw new Error(`HTTP ${r.status}`);const data=await r.json();cache=Array.isArray(data)?data:[];}catch(e){console.warn('Reference pathways unavailable; workspace remains usable.',e);cache=[];}return cache;}
export async function searchPathways(query=''){
  const all=await loadPathways(); const q=query.trim().toLowerCase();
  if(!q)return all;
  return all.filter(p=>`${p.concept} ${p.source} ${p.steps.map(s=>s.text).join(' ')}`.toLowerCase().includes(q));
}
export async function findRelatedPathways(term){
  const all=await loadPathways(); const q=term.toLowerCase();
  return all.filter(p=>p.concept.toLowerCase().includes(q)||q.includes(p.concept.toLowerCase())).slice(0,4);
}
