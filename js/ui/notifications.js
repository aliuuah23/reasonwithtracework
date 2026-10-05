export function toast(message){
  const region=document.getElementById('toastRegion'); if(!region)return;
  const el=document.createElement('div'); el.className='toast'; el.textContent=message; region.appendChild(el);
  setTimeout(()=>el.remove(),2200);
}

export function coach(title,message,{duration=5200}={}){
  const region=document.getElementById('toastRegion'); if(!region)return;
  const el=document.createElement('div');
  el.className='toast coach-toast';
  el.innerHTML=`<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span>`;
  region.appendChild(el);
  const timer=setTimeout(()=>el.remove(),duration);
  el.addEventListener('click',()=>{clearTimeout(timer);el.remove();});
}

export function setSaveStatus(text='Saved locally',saving=false){
  const el=document.getElementById('saveStatus'); if(!el)return;
  el.lastChild.textContent=` ${text}`; const dot=el.querySelector('.status-dot'); if(dot)dot.style.background=saving?'#d49a37':'#55a56e';
}

function escapeHtml(t=''){
  return String(t).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
}
