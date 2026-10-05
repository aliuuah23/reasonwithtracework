let cache=null;

export async function loadPilotEvidence(){
  if(cache) return cache;
  try{
    const res=await fetch('./data/pilot-transition-evidence.json');
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    cache=await res.json();
  }catch(err){
    console.warn('TRACEWORK pilot transition evidence could not be loaded.',err);
    cache={pairs:{},source:{}};
  }
  return cache;
}

export function transitionEvidence(sourceType,targetType,evidence=cache){
  if(!sourceType||!targetType||!evidence?.pairs) return null;
  return evidence.pairs[`${sourceType}->${targetType}`]||null;
}

export function transitionSummary(sourceType,targetType,evidence=cache){
  const hit=transitionEvidence(sourceType,targetType,evidence);
  if(!hit) return null;
  return `${hit.participantCount}/${hit.sampleSize} pilot participants showed this category transition (${hit.edgeCount} coded relationship${hit.edgeCount===1?'':'s'}).`;
}
