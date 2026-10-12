export function toast(message){
  const region=document.getElementById('toastRegion'); if(!region)return;
  const el=document.createElement('div'); el.className='toast'; el.textContent=message; region.appendChild(el);
  setTimeout(()=>el.remove(),2200);
}

export function coach(title,message,{duration=5200,pinnable=false}={}){
  const region=document.getElementById('toastRegion'); if(!region)return;
  const el=document.createElement('div');
  el.className='toast coach-toast';
  el.innerHTML=`<div class="coach-toast-head"><strong>${escapeHtml(title)}</strong>${pinnable?'<button type="button" aria-label="Keep this explanation open">Keep open</button>':''}</div><span>${escapeHtml(message)}</span>`;
  region.appendChild(el);
  let timer=setTimeout(()=>el.remove(),duration);
  const pin=el.querySelector('button');
  if(pin){
    pin.addEventListener('click',e=>{
      e.stopPropagation();
      clearTimeout(timer); timer=null;
      el.classList.add('pinned');
      pin.textContent='×'; pin.setAttribute('aria-label','Close explanation');
      pin.onclick=evt=>{evt.stopPropagation();el.remove();};
    },{once:true});
  }
}

export function setSaveStatus(text='Saved locally',saving=false){
  const el=document.getElementById('saveStatus'); if(!el)return;
  el.lastChild.textContent=` ${text}`; const dot=el.querySelector('.status-dot'); if(dot)dot.style.background=saving?'#d49a37':'#55a56e';
}

function escapeHtml(t=''){
  return String(t).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
}
