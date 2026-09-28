const KEY = 'tracework.project.v2';
export function saveProject(state){
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
  catch (err) { console.warn('TRACEWORK could not save locally.', err); return false; }
}
export function loadProject(){
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
export function clearProject(){ try { localStorage.removeItem(KEY); } catch {} }
export function exportProject(state){
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tracework-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
