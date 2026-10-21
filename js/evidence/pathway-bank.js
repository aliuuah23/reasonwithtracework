let cache=null;
export async function loadPathways(){if(cache)return cache;try{const r=await fetch('./data/pathways.json?v=d3.1-pathway-bank-restored');if(!r.ok)throw new Error(`HTTP ${r.status}`);const data=await r.json();cache=Array.isArray(data)?data:[];}catch(e){console.warn('Reference pathways unavailable; workspace remains usable.',e);cache=[];}return cache;}
export async function searchPathways(query=''){
  const all=await loadPathways(); const q=query.trim().toLowerCase();
  if(!q)return all;
  return all.filter(p=>`${p.concept} ${p.source} ${p.steps.map(s=>s.text).join(' ')}`.toLowerCase().includes(q));
}
export async function findRelatedPathways(term){
  const all=await loadPathways(); const q=term.toLowerCase();
  return all.filter(p=>p.concept.toLowerCase().includes(q)||q.includes(p.concept.toLowerCase())).slice(0,4);
}


// Brief-scoped cue ranking. This is transparent keyword support, NOT semantic
// similarity inference and NOT a claim that examples come from this project.
const CUES = {
  flexibility: ['flexib','adapt','reconfig','multi-use','multiple use','different use','changing','change','movable','seat','twenty additional','20 additional'],
  privacy: ['privac','private','individual','alone','quiet','focus','isolat','retreat','exposure'],
  community: ['communit','group','gather','social','interact','collectiv','shared','encounter'],
  shelter: ['shelter','roof','canopy','rain','shade','sun','heat','weather','outdoor','ventilat','climat'],
  threshold: ['threshold','transition','movement','route','circulat','access','approach','entrance','entry','unobstruct','pathway','pedestrian','between']
};
function cueHit(text, cue){
  // English morphology by prefix (e.g. privacy/private, flexibility/flexible).
  return String(text||'').toLowerCase().includes(cue);
}
export function rankPathwaysForBrief(items, project){
  if(!project?.brief)return [];
  const brief=String(project.brief||'')+' '+String(project.projectName||'');
  const selected=project.hotspots?.find(h=>h.id===project.selectedHotspotId)?.text||'';
  return items.map((pathway,index)=>{
    const cues=CUES[String(pathway.concept||'').toLowerCase()]||[];
    const selectedMatches=cues.filter(c=>cueHit(selected,c));
    const briefMatches=cues.filter(c=>cueHit(brief,c));
    const label=selectedMatches.length?'Matches selected phrase':briefMatches.length?'Related to brief wording':'Explore another interpretation';
    return {pathway,score:selectedMatches.length*10+briefMatches.length,source: selectedMatches.length?'phrase':briefMatches.length?'brief':'other',label,index};
  }).sort((a,b)=>b.score-a.score||a.index-b.index);
}
