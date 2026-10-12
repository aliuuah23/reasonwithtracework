import { createNode, addLinkedNode } from '../core/trace-model.js';
export function addConsequence(state,sourceNodeId,text,branchId,tags=[]){
  const node=createNode({type:'consequence',label:text,branchId,meta:{tags}});
  return addLinkedNode(state,sourceNodeId,node);
}
