const depthByType={input:0,interpretation:1,grounding:2,consequence:3,evaluation:4,goal:5};
export function autoLayout(nodes){
  const branches=[...new Set(nodes.map(n=>n.branchId))];
  const branchY=new Map(branches.map((b,i)=>[b,120+i*150]));
  return nodes.map(n=>{
    if(n.x!=null&&n.y!=null) return n;
    const depth=depthByType[n.type] ?? 0;
    return {...n,x:70+depth*265,y:branchY.get(n.branchId)??120};
  });
}
export function surfaceSize(nodes){
  const maxX=Math.max(1050,...nodes.map(n=>(n.x||0)+280));
  const maxY=Math.max(680,...nodes.map(n=>(n.y||0)+180));
  return {width:maxX,height:maxY};
}
