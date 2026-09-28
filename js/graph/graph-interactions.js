export function fitGraph(viewport,surface){
  viewport.scrollTo({left:0,top:Math.max(0,(surface.scrollHeight-viewport.clientHeight)/5),behavior:'smooth'});
}
export function focusNode(viewport,nodeEl){
  if(!nodeEl)return;
  const left=Math.max(0,nodeEl.offsetLeft-viewport.clientWidth*.35);
  const top=Math.max(0,nodeEl.offsetTop-viewport.clientHeight*.35);
  viewport.scrollTo({left,top,behavior:'smooth'});
}
