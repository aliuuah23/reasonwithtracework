export function branchSummaries(state){
  const branches=[...new Set(state.nodes.map(n=>n.branchId))];
  return branches.map(branchId=>({branchId,nodes:state.nodes.filter(n=>n.branchId===branchId&&n.type!=='input')}));
}
export function compareBranches(state,a,b){
  const byType=(branch,type)=>state.nodes.find(n=>n.branchId===branch&&n.type===type);
  return ['interpretation','grounding','consequence','evaluation','goal'].map(type=>({type,a:byType(a,type),b:byType(b,type)}));
}
