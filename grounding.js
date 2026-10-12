import { createNode, addLinkedNode } from '../core/trace-model.js';
export function addGrounding(state,sourceNodeId,text,sourceKind,branchId){
  const node=createNode({type:'grounding',label:text,branchId,meta:{sourceKind}});
  return addLinkedNode(state,sourceNodeId,node);
}
