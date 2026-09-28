export function toast(message){
  const region=document.getElementById('toastRegion'); if(!region)return;
  const el=document.createElement('div'); el.className='toast'; el.textContent=message; region.appendChild(el);
  setTimeout(()=>el.remove(),2200);
}
export function setSaveStatus(text='Saved locally',saving=false){
  const el=document.getElementById('saveStatus'); if(!el)return;
  el.lastChild.textContent=` ${text}`; const dot=el.querySelector('.status-dot'); if(dot)dot.style.background=saving?'#d49a37':'#55a56e';
}
