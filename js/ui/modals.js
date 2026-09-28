const backdrop=()=>document.getElementById('modalBackdrop');
const modal=()=>document.getElementById('modal');
export function openModal(html,{onOpen}={}){
  modal().innerHTML=html; backdrop().classList.remove('hidden');
  const close=()=>closeModal();
  backdrop().onclick=e=>{ if(e.target===backdrop())close(); };
  modal().querySelectorAll('[data-close-modal]').forEach(b=>b.onclick=close);
  onOpen?.(modal());
}
export function closeModal(){ backdrop()?.classList.add('hidden'); if(modal())modal().innerHTML=''; }
