import { createNode, createEdge } from '../core/trace-model.js';

const nextType={input:'interpretation',interpretation:'grounding',grounding:'consequence',consequence:'evaluation',evaluation:'goal'};

export function createBranch(state,fromNodeId,label='Alternative interpretation'){
  const origin=state.nodes.find(n=>n.id===fromNodeId);
  if(!origin) return null;
  const parentEdge=state.edges.find(e=>e.target===origin.id);
  const sourceId = origin.type==='interpretation' && parentEdge ? parentEdge.source : origin.id;
  const branchId=uniqueBranchId();
  const node=createNode({type:'interpretation',label,branchId,meta:{branchedFrom:origin.id,provisional:true}});
  state.nodes.push(node); state.edges.push(createEdge(sourceId,node.id,{status:'provisional'}));
  state.activeNodeId=node.id; state.activeBranchId=branchId;
  return node;
}

export function forkNext(state,fromNodeId,label){
  const origin=state.nodes.find(n=>n.id===fromNodeId);
  const type=origin ? nextType[origin.type] : null;
  if(!origin || !type) return null;
  const branchId=uniqueBranchId();
  const node=createNode({type,label,branchId,meta:{forkedFrom:origin.id,provisional:true}});
  state.nodes.push(node);
  state.edges.push(createEdge(origin.id,node.id,{status:'provisional'}));
  state.activeNodeId=node.id;
  state.activeBranchId=branchId;
  return node;
}

export function nextNodeType(type){ return nextType[type] || null; }

export function rejectBranch(state,branchId){
  // Input nodes represent shared source language and must never be rejected simply
  // because one downstream pathway is rejected.
  const branchNodes=state.nodes.filter(n=>n.branchId===branchId && n.type!=='input');
  const ids=new Set(branchNodes.map(n=>n.id));
  branchNodes.forEach(n=>n.status='rejected');
  // Reject only edges that ENTER a rejected node. This keeps shared ancestors and
  // unrelated outgoing paths visually active.
  state.edges.filter(e=>ids.has(e.target)).forEach(e=>e.status='rejected');
}

export function restoreBranch(state,branchId){
  const branchNodes=state.nodes.filter(n=>n.branchId===branchId && n.type!=='input');
  const ids=new Set(branchNodes.map(n=>n.id));
  branchNodes.forEach(n=>n.status='active');
  state.nodes.filter(n=>n.type==='input').forEach(n=>n.status='active');
  state.edges.filter(e=>ids.has(e.target)).forEach(e=>{
    const target=state.nodes.find(n=>n.id===e.target);
    e.status=target?.meta?.provisional?'provisional':'active';
  });
}

export function repairSharedInputs(state){
  const inputIds=new Set(state.nodes.filter(n=>n.type==='input').map(n=>n.id));
  state.nodes.filter(n=>n.type==='input').forEach(n=>n.status='active');
  state.edges.filter(e=>inputIds.has(e.source)).forEach(e=>{
    const target=state.nodes.find(n=>n.id===e.target);
    if(target && target.status!=='rejected') e.status=target.meta?.provisional?'provisional':'active';
  });
  return state;
}

function uniqueBranchId(){ return `branch-${Date.now()}-${Math.random().toString(36).slice(2,5)}`; }
