import { createNode, addLinkedNode } from '../core/trace-model.js';
export function addInterpretation(state,inputNodeId,text,branchId='branch-1',meta={}){
  const node=createNode({type:'interpretation',label:text,branchId,meta});
  return addLinkedNode(state,inputNodeId,node);
}
