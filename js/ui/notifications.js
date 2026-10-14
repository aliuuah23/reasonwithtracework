export function toast(message){
  const region=document.getElementById('toastRegion'); if(!region)return;
  const el=document.createElement('div'); el.className='toast'; el.textContent=message; region.appendChild(el);
  setTimeout(()=>el.remove(),2200);
}

export function coach(title,message,{duration=5200,pinnable=false}={}){
  const region=document.getElementById('toastRegion'); if(!region)return;
  const el=document.createElement('div');el.className='toast coach-toast';
  const safeTitle=escapeHtml(title),safeMessage=escapeHtml(message);
  el.innerHTML=`<div class="coach-toast-head"><strong>${safeTitle}</strong><div class="coach-toast-actions">${pinnable?'<button type="button" class="coach-pin" aria-label="Keep warning open">Keep open</button>':''}<button type="button" class="coach-dismiss" aria-label="Close warning" title="Close warning">×</button></div></div><span>${safeMessage}</span>`;
  region.appendChild(el);
  let timer=setTimeout(()=>el.remove(),duration);
  const close=()=>{clearTimeout(timer);el.remove();};
  el.querySelector('.coach-dismiss')?.addEventListener('click',close);
  el.querySelector('.coach-pin')?.addEventListener('click',e=>{
    clearTimeout(timer);timer=null;el.classList.add('pinned');e.currentTarget.remove();
  });
}

export function setSaveStatus(text='Saved locally',saving=false){
  const el=document.getElementById('saveStatus'); if(!el)return;
  el.lastChild.textContent=` ${text}`; const dot=el.querySelector('.status-dot'); if(dot)dot.style.background=saving?'#d49a37':'#55a56e';
}

function escapeHtml(t=''){
  return String(t).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
}
