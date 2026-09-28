const LEGACY_KEY = 'tracework.project.v2';
const BANK_KEY = 'tracework.projects.v3';
const ACTIVE_KEY = 'tracework.activeProject.v3';

function readBank(){
  try { return JSON.parse(localStorage.getItem(BANK_KEY) || '{}'); }
  catch { return {}; }
}
function writeBank(bank){
  try { localStorage.setItem(BANK_KEY, JSON.stringify(bank)); return true; }
  catch (err) { console.warn('TRACEWORK could not save the project bank.', err); return false; }
}
function migrateLegacy(){
  try {
    const bank=readBank();
    if(Object.keys(bank).length) return bank;
    const raw=localStorage.getItem(LEGACY_KEY);
    if(!raw) return bank;
    const project=JSON.parse(raw);
    if(project?.brief){
      project.projectId=project.projectId || `tw-${Date.now()}`;
      bank[project.projectId]=project;
      writeBank(bank);
      localStorage.setItem(ACTIVE_KEY,project.projectId);
    }
    return bank;
  } catch { return readBank(); }
}

export function saveProject(state){
  if(!state?.projectId || !state?.brief) return false;
  const bank=migrateLegacy();
  bank[state.projectId]=state;
  const ok=writeBank(bank);
  try { localStorage.setItem(ACTIVE_KEY,state.projectId); } catch {}
  return ok;
}

export function loadProject(projectId=null){
  const bank=migrateLegacy();
  let id=projectId;
  if(!id){ try { id=localStorage.getItem(ACTIVE_KEY); } catch {} }
  return id && bank[id] ? structuredClone(bank[id]) : null;
}

export function listProjects(){
  const bank=migrateLegacy();
  return Object.values(bank)
    .filter(p=>p?.brief)
    .sort((a,b)=>new Date(b.updatedAt||0)-new Date(a.updatedAt||0));
}

export function ensureProject(project){
  if(!project?.projectId || !project?.brief) return false;
  const bank=migrateLegacy();
  if(bank[project.projectId]) return false;
  bank[project.projectId]=project;
  return writeBank(bank);
}

export function deleteProject(projectId){
  const bank=migrateLegacy();
  if(!bank[projectId]) return false;
  delete bank[projectId];
  const ok=writeBank(bank);
  try { if(localStorage.getItem(ACTIVE_KEY)===projectId) localStorage.removeItem(ACTIVE_KEY); } catch {}
  return ok;
}

export function clearProject(projectId=null){
  const id=projectId || (()=>{ try{return localStorage.getItem(ACTIVE_KEY);}catch{return null;} })();
  if(id) deleteProject(id);
}

export function clearAllProjects(){
  try {
    localStorage.removeItem(BANK_KEY);
    localStorage.removeItem(ACTIVE_KEY);
    localStorage.removeItem(LEGACY_KEY);
    return true;
  } catch (err) {
    console.warn('TRACEWORK could not clear local project data.', err);
    return false;
  }
}

export function exportProject(state){
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tracework-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
