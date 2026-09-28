export function createNode({type,label,branchId='branch-1',meta={},x=null,y=null,status='active'}){
  return {
    id:`node-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    type, label, branchId, meta, status, x, y,
    createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()
  };
}
export function createEdge(source,target,{status='active'}={}){
  return { id:`edge-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, source, target, status };
}
export function addLinkedNode(state, sourceId, node){
  state.nodes.push(node);
  if (sourceId) state.edges.push(createEdge(sourceId,node.id));
  state.activeNodeId = node.id;
  state.activeBranchId = node.branchId;
  return node;
}
export function descendants(state,nodeId){
  const out=[]; const queue=[nodeId];
  while(queue.length){ const id=queue.shift(); state.edges.filter(e=>e.source===id).forEach(e=>{ if(!out.includes(e.target)){ out.push(e.target); queue.push(e.target); } }); }
  return out;
}
export function ancestors(state,nodeId){
  const out=[]; let current=nodeId;
  while(current){ const edge=state.edges.find(e=>e.target===current); if(!edge) break; out.unshift(edge.source); current=edge.source; }
  return out;
}
export function nodesInBranch(state,branchId){ return state.nodes.filter(n=>n.branchId===branchId); }
export function latestNodeOfType(state,branchId,type){ return [...nodesInBranch(state,branchId)].reverse().find(n=>n.type===type) || null; }
