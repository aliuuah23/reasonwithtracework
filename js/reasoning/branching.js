import { createNode, createEdge } from '../core/trace-model.js';
export function createBranch(state,fromNodeId,label='Alternative interpretation'){
  const origin=state.nodes.find(n=>n.id===fromNodeId);
  if(!origin) return null;
  const parentEdge=state.edges.find(e=>e.target===origin.id);
  const sourceId = origin.type==='interpretation' && parentEdge ? parentEdge.source : origin.id;
  const branchId=`branch-${Date.now()}-${Math.random().toString(36).slice(2,5)}`;
  const node=createNode({type:'interpretation',label,branchId,meta:{branchedFrom:origin.id,provisional:true}});
  state.nodes.push(node); state.edges.push(createEdge(sourceId,node.id,{status:'provisional'}));
  state.activeNodeId=node.id; state.activeBranchId=branchId;
  return node;
}
export function rejectBranch(state,branchId){
  state.nodes.filter(n=>n.branchId===branchId).forEach(n=>n.status='rejected');
  const ids=new Set(state.nodes.filter(n=>n.branchId===branchId).map(n=>n.id));
  state.edges.filter(e=>ids.has(e.target)||ids.has(e.source)).forEach(e=>e.status='rejected');
}
