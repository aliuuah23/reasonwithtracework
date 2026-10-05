import { typeLabels } from '../core/ontology.js';

const allowed = {
  input: new Set(['interpretation']),
  interpretation: new Set(['grounding','consequence']),
  grounding: new Set(['consequence']),
  consequence: new Set(['evaluation','goal']),
  evaluation: new Set(['goal']),
  goal: new Set(),
  note: new Set()
};

export function connectionCheck(source,target,edges=[]){
  if(!source||!target) return {ok:false,reason:'Choose two reasoning nodes.'};
  if(source.id===target.id) return {ok:false,reason:'A node cannot connect to itself.'};
  if(source.type==='note'||target.type==='note') return {ok:false,reason:'Classify a loose note before wiring it into the reasoning network.'};
  if(target.type==='input') return {ok:false,reason:'Input nodes are source material, so connections lead out of them rather than into them.'};
  if(source.type==='goal') return {ok:false,reason:'A Goal closes a reasoning route. Start another route from an earlier node instead.'};
  if(edges.some(e=>e.source===source.id&&e.target===target.id)) return {ok:false,reason:'These nodes are already connected.'};
  if(!allowed[source.type]?.has(target.type)){
    const sourceLabel=typeLabels[source.type]||source.type;
    const targetLabel=typeLabels[target.type]||target.type;
    const expected=[...(allowed[source.type]||[])].map(t=>typeLabels[t]||t).join(' or ');
    return {ok:false,reason:expected?`${sourceLabel} usually develops into ${expected}, not ${targetLabel}.`:`${sourceLabel} does not open another reasoning step.`};
  }
  return {ok:true,reason:'Connection fits the current reasoning grammar.'};
}
