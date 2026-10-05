import { typeLabels } from '../core/ontology.js';
import { transitionEvidence } from '../evidence/pilot-evidence.js';

const allowedFallback = {
  input: new Set(['interpretation','grounding','consequence']),
  interpretation: new Set(['grounding','consequence','goal']),
  grounding: new Set(['interpretation','consequence','goal']),
  consequence: new Set(['consequence','evaluation','goal']),
  evaluation: new Set(['consequence','goal']),
  goal: new Set(['consequence']),
  note: new Set(['input','interpretation','grounding','consequence','evaluation','goal','note'])
};

const role = {
  input:'source language, requirement or observation',
  interpretation:'a reading or implication taken from that source',
  grounding:'evidence, context, association or reasoning that supports a move',
  consequence:'a spatial proposition or the spatial/experiential effect it produces',
  evaluation:'a judgement, comparison, priority or trade-off',
  goal:'a design intention or aim',
  note:'an intentionally uncategorised thought'
};

export function connectionCheck(source,target,edges=[],evidence=null){
  if(!source||!target) return {ok:false,reason:'The wire needs to land on another reasoning node.',detail:'A TRACEWORK wire says that one thought is being used to develop another. Leave the thought floating if that relationship is not clear yet.'};
  if(source.id===target.id) return {ok:false,reason:'A node cannot develop itself.',detail:'If the sentence contains two separate moves, split it into two nodes and connect those instead.'};
  if(edges.some(e=>e.source===source.id&&e.target===target.id)) return {ok:false,reason:'These two moves are already connected.',detail:'Use the existing wire, or disconnect it first if you want to test another relationship.'};

  // Grey notes are deliberately wild cards. They can sit anywhere in the reasoning field.
  if(source.type==='note'||target.type==='note'){
    return {ok:true,reason:'Loose-note connection allowed.',detail:'Notes are intentionally outside the six-category grammar and can connect anywhere while the thought is still forming.',signal:'neutral'};
  }

  const empirical=transitionEvidence(source.type,target.type,evidence);
  if(empirical){
    return {
      ok:true,
      reason:'This relationship appears in the pavilion pilot.',
      detail:`${empirical.participantCount}/${empirical.sampleSize} participants showed this category transition across ${empirical.edgeCount} coded relationship${empirical.edgeCount===1?'':'s'}. This is precedent, not a rule.`,
      signal:empirical.band,
      evidence:empirical
    };
  }

  if(target.type==='input'){
    return {
      ok:false,
      reason:`“${clip(source.label)}” reads as ${label(source.type)}, while “${clip(target.label)}” is source material.`,
      detail:`That would make a developed reasoning move rewrite the given/observed Input itself. If the first thought reveals a new condition, add it as a new Input instead. Keep going — the mismatch may be telling you that another node is missing.`
    };
  }

  if(allowedFallback[source.type]?.has(target.type)){
    return {
      ok:true,
      reason:'This connection is structurally plausible but not strongly represented in the mapped pilot transitions.',
      detail:`TRACEWORK will keep it exploratory. “${clip(source.label)}” can plausibly develop “${clip(target.label)}”, but the current P01–P10 evidence does not make that relationship common enough to present as a strong precedent.`,
      signal:'limited'
    };
  }

  const sourceLabel=label(source.type), targetLabel=label(target.type);
  return {
    ok:false,
    reason:`The role of “${clip(source.label)}” does not currently explain why “${clip(target.label)}” follows.`,
    detail:`The first node is functioning as ${sourceLabel} (${role[source.type]}), while the second is ${targetLabel} (${role[target.type]}). Try recategorising one, adding a bridging thought that makes the dependency explicit, or leave them unconnected for now. Push the reasoning a little harder — the gap itself may be useful.`
  };
}

export function connectionSignal(source,target,evidence=null){
  if(!source||!target) return {band:'neutral',score:null};
  if(source.type==='note'||target.type==='note') return {band:'neutral',score:null};
  const empirical=transitionEvidence(source.type,target.type,evidence);
  if(empirical) return {band:empirical.band,score:empirical.score,evidence:empirical};
  return {band:'unseen',score:0,evidence:null};
}

function label(type){return typeLabels[type]||type||'reasoning move';}
function clip(text=''){
  const t=String(text).trim();
  return t.length>72?`${t.slice(0,69)}…`:t;
}
