const backdrop=()=>document.getElementById('modalBackdrop');
const modal=()=>document.getElementById('modal');
let backdropPointerStart=null;
export function openModal(html,{onOpen,allowBackdropDismiss=true}={}){
  const layer=backdrop(),content=modal();
  content.innerHTML=html;
  layer.classList.remove('hidden');
  backdropPointerStart=null;
  // Only an intentional press AND release on the backdrop dismisses a dialog.
  // Dragging selection out of a textarea or past the screen must never dismiss it.
  layer.onpointerdown=e=>{
    backdropPointerStart=allowBackdropDismiss && e.target===layer && e.button===0
      ? {id:e.pointerId,x:e.clientX,y:e.clientY,moved:false}:null;
  };
  layer.onpointermove=e=>{
    if(backdropPointerStart?.id===e.pointerId && Math.hypot(e.clientX-backdropPointerStart.x,e.clientY-backdropPointerStart.y)>7){
      backdropPointerStart.moved=true;
    }
  };
  layer.onpointerup=e=>{
    // A genuine click on empty backdrop closes; dragging either direction does not.
    const start=backdropPointerStart;
    const dismiss=Boolean(start && !start.moved && e.pointerId===start.id && e.target===layer && Math.hypot(e.clientX-start.x,e.clientY-start.y)<=7);
    backdropPointerStart=null;
    if(dismiss)closeModal();
  };
  layer.onpointercancel=()=>{backdropPointerStart=null;};
  layer.onclick=null;
  content.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',closeModal));
  onOpen?.(content);
}
export function closeModal(){
  backdropPointerStart=null;
  const layer=backdrop();if(layer){layer.classList.add('hidden');layer.onpointerdown=null;layer.onpointermove=null;layer.onpointerup=null;layer.onpointercancel=null;}
  if(modal())modal().innerHTML='';
}
