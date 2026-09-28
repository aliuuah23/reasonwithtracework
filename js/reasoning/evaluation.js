import { createNode, addLinkedNode } from '../core/trace-model.js';
export function addEvaluation(state,sourceNodeId,text,branchId,priorities=[]){
  const node=createNode({type:'evaluation',label:text,branchId,meta:{priorities}});
  return addLinkedNode(state,sourceNodeId,node);
}
export function addGoal(state,sourceNodeId,text,branchId){
  const node=createNode({type:'goal',label:text,branchId,meta:{}});
  return addLinkedNode(state,sourceNodeId,node);
}
