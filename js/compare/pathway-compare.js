const order=['interpretation','grounding','consequence','evaluation','goal'];

export function branchPath(state,branchId){
  const own=state.nodes.filter(n=>n.branchId===branchId && n.type!=='input');
  if(!own.length) return [];
  const depth=n=>order.indexOf(n.type);
  const leaf=[...own].sort((a,b)=>depth(b)-depth(a) || new Date(b.createdAt||0)-new Date(a.createdAt||0))[0];
  const route=[];
  let current=leaf;
  const seen=new Set();
  while(current && !seen.has(current.id)){
    seen.add(current.id);
    if(current.type!=='input') route.unshift(current);
    const edge=state.edges.find(e=>e.target===current.id);
    current=edge ? state.nodes.find(n=>n.id===edge.source) : null;
  }
  return route;
}

export function branchSummaries(state){
  const branches=[...new Set(state.nodes.filter(n=>n.type!=='input').map(n=>n.branchId))];
  return branches.map((branchId,index)=>{
    const nodes=branchPath(state,branchId);
    const own=state.nodes.filter(n=>n.branchId===branchId && n.type!=='input');
    const rejected=own.length>0 && own.every(n=>n.status==='rejected');
    const provisional=own.some(n=>n.meta?.provisional) && !rejected;
    const status=rejected?'Rejected':provisional?'Provisional':'Active';
    const firstOwn=own[0] || nodes[0];
    return {branchId,nodes,status,label:firstOwn?.label || `Path ${index+1}`};
  });
}

export function compareBranches(state,a,b){
  const aPath=branchPath(state,a),bPath=branchPath(state,b);
  const byType=(path,type)=>[...path].reverse().find(n=>n.type===type);
  return order.map(type=>({type,a:byType(aPath,type),b:byType(bPath,type)}));
}
