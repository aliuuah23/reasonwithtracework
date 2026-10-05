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

const role = {
  input:'source language, requirement or observation',
  interpretation:'a stated reading of that source',
  grounding:'the reason that reading is plausible or relevant',
  consequence:'the spatial move that follows',
  evaluation:'a judgement about priorities, trade-offs or effects',
  goal:'the design aim the route ultimately serves',
  note:'an intentionally uncategorised thought'
};
const order=['input','interpretation','grounding','consequence','evaluation','goal'];

export function connectionCheck(source,target,edges=[]){
  if(!source||!target) return {ok:false,reason:'The wire needs to land on the left connection shoulder of a reasoning node.',detail:'A connection in TRACEWORK means one move is explicitly being used to develop another. Keep thinking — either land on a node input or leave the thought floating until its relationship becomes clearer.'};
  if(source.id===target.id) return {ok:false,reason:'A node cannot explain or develop itself.',detail:'If the thought contains two different moves, split it into two nodes and connect those instead.'};
  if(source.type==='note'||target.type==='note') return {ok:false,reason:'Loose notes stay outside the reasoning grammar until they are classified.',detail:'Convert the note when its role becomes clearer, or keep it loose. TRACEWORK will not force an early category.'};
  if(target.type==='input') return {ok:false,reason:'Input is source material, so reasoning should develop out of it rather than flow back into it.',detail:`“${clip(source.label)}” is currently a ${typeLabels[source.type]||source.type}. If it reveals a new requirement, add that requirement as a separate Input instead.`};
  if(source.type==='goal') return {ok:false,reason:'A Goal describes what a reasoning route serves; it does not normally generate an earlier reasoning step.',detail:`If “${clip(source.label)}” is actually evidence or a condition for the next thought, recategorise it. Otherwise continue from an earlier node. Keep the thinking moving.`};
  if(edges.some(e=>e.source===source.id&&e.target===target.id)) return {ok:false,reason:'These two moves are already connected.',detail:'Use the existing wire, or disconnect it first if you want to test another relationship.'};

  if(!allowed[source.type]?.has(target.type)){
    const a=order.indexOf(source.type),b=order.indexOf(target.type);
    const sourceLabel=typeLabels[source.type]||source.type;
    const targetLabel=typeLabels[target.type]||target.type;
    if(a===b){
      return {ok:false,reason:`Both nodes currently function as ${sourceLabel}. TRACEWORK reads them as parallel moves rather than one developing the other.`,detail:`If one is actually explaining, spatialising or evaluating the other, recategorise that node. Otherwise let them stay parallel and connect them later to a shared downstream move.`};
    }
    if(b<a){
      return {ok:false,reason:`This would make a later ${sourceLabel} act as the basis for an earlier ${targetLabel}.`,detail:`A ${targetLabel} is currently defined as ${role[target.type]}, while this ${sourceLabel} is ${role[source.type]}. If the wording really does work backwards, add a bridging node or recategorise one of them rather than forcing the link.`};
    }
    const expected=[...(allowed[source.type]||[])].map(t=>typeLabels[t]||t).join(' or ');
    return {ok:false,reason:`The jump from ${sourceLabel} to ${targetLabel} leaves too much of the reasoning interval unstated.`,detail:expected?`This ${sourceLabel} normally develops into ${expected}. Add the missing reasoning move if it matters — the friction is useful here.`:'Keep this thought open until the next relation becomes clearer.'};
  }
  return {ok:true,reason:'Connection fits the current reasoning grammar.',detail:''};
}

export function connectionSignal(source,target,status='active'){
  const a=order.indexOf(source?.type),b=order.indexOf(target?.type);
  if(status==='provisional') return 'exploratory';
  if(a<0||b<0) return 'direct';
  return b-a===1?'direct':'exploratory';
}

function clip(text=''){
  const t=String(text).trim();
  return t.length>58?`${t.slice(0,55)}…`:t;
}
