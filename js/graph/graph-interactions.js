const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

export function applyZoom(viewport,stage,surface,scale,{preserveCenter=true}={}){
  const old=Number(surface.dataset.zoom||1);
  const naturalW=Number(surface.dataset.worldWidth||parseFloat(surface.style.width)||1100);
  const naturalH=Number(surface.dataset.worldHeight||parseFloat(surface.style.height)||700);
  const next=clamp(scale,.02,1.6);

  let worldCX=0,worldCY=0;
  if(preserveCenter){
    worldCX=(viewport.scrollLeft+viewport.clientWidth/2)/old;
    worldCY=(viewport.scrollTop+viewport.clientHeight/2)/old;
  }

  surface.dataset.zoom=String(next);
  surface.style.transform=`scale(${next})`;
  stage.style.width=`${naturalW*next}px`;
  stage.style.height=`${naturalH*next}px`;

  if(preserveCenter){
    viewport.scrollLeft=Math.max(0,worldCX*next-viewport.clientWidth/2);
    viewport.scrollTop=Math.max(0,worldCY*next-viewport.clientHeight/2);
  }
  return next;
}

export function fitGraph(viewport,stage,surface){
  // The previous .35 minimum made a large aggregate impossible to fit at half-screen.
  const raw=[surface.dataset.contentMinX,surface.dataset.contentMinY,surface.dataset.contentMaxX,surface.dataset.contentMaxY].map(Number);
  const [minX,minY,maxX,maxY]=raw;
  if(!raw.every(Number.isFinite)||maxX<=minX||maxY<=minY)return applyZoom(viewport,stage,surface,1,{preserveCenter:false});
  const availableW=Math.max(100,viewport.clientWidth-32),availableH=Math.max(100,viewport.clientHeight-32);
  const contentW=Math.max(1,maxX-minX),contentH=Math.max(1,maxY-minY);
  const scale=clamp(Math.min(availableW/contentW,availableH/contentH),.02,1.3);
  applyZoom(viewport,stage,surface,scale,{preserveCenter:false});
  // Centre actual occupied node bounds, rather than an arbitrary world origin.
  const left=Math.max(0,((minX+maxX)*scale-viewport.clientWidth)/2);
  const top=Math.max(0,((minY+maxY)*scale-viewport.clientHeight)/2);
  viewport.scrollTo({left,top,behavior:'instant'});
  return scale;
}

export function focusNode(viewport,nodeEl,scale=1){
  if(!nodeEl)return;
  const left=Math.max(0,nodeEl.offsetLeft*scale-viewport.clientWidth*.35);
  const top=Math.max(0,nodeEl.offsetTop*scale-viewport.clientHeight*.35);
  viewport.scrollTo({left,top,behavior:'smooth'});
}

export function bindCanvasPan(viewport){
  let drag=null;
  viewport.addEventListener('pointerdown',e=>{
    if(e.button!==0) return;
    if(e.target.closest('.graph-node,.trace-edge,.node-port,button,input,textarea,select,a')) return;
    drag={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,scrollLeft:viewport.scrollLeft,scrollTop:viewport.scrollTop,moved:false};
    viewport.setPointerCapture(e.pointerId);
    viewport.classList.add('pan-ready');
  });
  viewport.addEventListener('pointermove',e=>{
    if(!drag || e.pointerId!==drag.pointerId) return;
    const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
    if(!drag.moved && Math.abs(dx)+Math.abs(dy)>4){drag.moved=true;viewport.classList.add('panning');}
    if(!drag.moved) return;
    e.preventDefault();
    viewport.scrollLeft=drag.scrollLeft-dx;
    viewport.scrollTop=drag.scrollTop-dy;
  });
  const finish=e=>{
    if(!drag || e.pointerId!==drag.pointerId) return;
    try{viewport.releasePointerCapture(e.pointerId);}catch{}
    drag=null;viewport.classList.remove('panning','pan-ready');
  };
  viewport.addEventListener('pointerup',finish);
  viewport.addEventListener('pointercancel',finish);
}

export function bindWheelZoom(viewport,{getZoom,setZoom,getSelectedNode}){
  viewport.addEventListener('wheel',e=>{
    if(!(e.ctrlKey||e.metaKey)) return;
    e.preventDefault();
    const delta=e.deltaY>0?-.08:.08;
    const selected=getSelectedNode?.();
    setZoom(getZoom()+delta);
    if(selected && selected.isConnected){
      // Ctrl + mouse wheel zooms *onto* the selected card instead of the canvas centre.
      const scale=Math.max(.02,Number(getZoom())||1);
      const cx=selected.offsetLeft+selected.offsetWidth/2;
      const cy=selected.offsetTop+selected.offsetHeight/2;
      viewport.scrollLeft=Math.max(0,cx*scale-viewport.clientWidth/2);
      viewport.scrollTop=Math.max(0,cy*scale-viewport.clientHeight/2);
    }
  },{passive:false});
}
