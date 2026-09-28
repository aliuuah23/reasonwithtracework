export function fitGraph(viewport,surface){
  viewport.scrollTo({
    left:0,
    top:Math.max(0,(surface.scrollHeight-viewport.clientHeight)/5),
    behavior:'smooth'
  });
}

export function focusNode(viewport,nodeEl){
  if(!nodeEl)return;
  const left=Math.max(0,nodeEl.offsetLeft-viewport.clientWidth*.35);
  const top=Math.max(0,nodeEl.offsetTop-viewport.clientHeight*.35);
  viewport.scrollTo({left,top,behavior:'smooth'});
}

export function bindCanvasPan(viewport){
  let drag=null;

  viewport.addEventListener('pointerdown',e=>{
    if(e.button!==0) return;
    if(e.target.closest('.graph-node,button,input,textarea,select,a')) return;

    drag={
      pointerId:e.pointerId,
      startX:e.clientX,
      startY:e.clientY,
      scrollLeft:viewport.scrollLeft,
      scrollTop:viewport.scrollTop,
      moved:false
    };
    viewport.setPointerCapture(e.pointerId);
    viewport.classList.add('pan-ready');
  });

  viewport.addEventListener('pointermove',e=>{
    if(!drag || e.pointerId!==drag.pointerId) return;
    const dx=e.clientX-drag.startX;
    const dy=e.clientY-drag.startY;

    if(!drag.moved && Math.abs(dx)+Math.abs(dy)>4){
      drag.moved=true;
      viewport.classList.add('panning');
    }
    if(!drag.moved) return;

    e.preventDefault();
    viewport.scrollLeft=drag.scrollLeft-dx;
    viewport.scrollTop=drag.scrollTop-dy;
  });

  const finish=e=>{
    if(!drag || e.pointerId!==drag.pointerId) return;
    try{ viewport.releasePointerCapture(e.pointerId); }catch{}
    drag=null;
    viewport.classList.remove('panning','pan-ready');
  };

  viewport.addEventListener('pointerup',finish);
  viewport.addEventListener('pointercancel',finish);
}
