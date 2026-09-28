import { branchSummaries } from '../compare/pathway-compare.js';
export function renderTraceDashboard(state){
  const root=document.getElementById('traceDashboard');
  if(!state.nodes.length){root.innerHTML='<div class="empty-state-card">Start a trace in the workspace and its reasoning history will appear here.</div>';return;}
  const branches=branchSummaries(state),active=state.nodes.filter(n=>n.status!=='rejected').length,rejected=state.nodes.filter(n=>n.status==='rejected').length,complete=branches.filter(b=>b.nodes.some(n=>n.type==='goal')).length;
  root.innerHTML=`<section class="trace-card"><h3>Project summary</h3><div class="trace-stats"><div class="trace-stat"><strong>${branches.length}</strong><span>Reasoning paths</span></div><div class="trace-stat"><strong>${active}</strong><span>Active nodes</span></div><div class="trace-stat"><strong>${rejected}</strong><span>Rejected nodes</span></div><div class="trace-stat"><strong>${complete}</strong><span>Completed paths</span></div></div></section>
  <section class="trace-card"><h3>Recent reasoning</h3><div class="timeline">${state.history.slice(0,10).map(e=>`<div class="timeline-item"><time>${time(e.time)}</time><i></i><div><strong>${esc(e.action)}</strong>${e.detail?`<br><span style="color:var(--muted)">${esc(e.detail)}</span>`:''}</div></div>`).join('')||'<p style="color:var(--muted);font-size:12px">No history yet.</p>'}</div></section>
  <section class="trace-card" style="grid-column:1/-1"><h3>Paths</h3>${branches.map((b,i)=>`<div style="display:grid;grid-template-columns:90px 1fr;gap:12px;padding:11px 0;border-top:1px solid var(--border)"><strong style="font-size:12px">Path ${i+1}</strong><div style="display:flex;flex-wrap:wrap;gap:6px">${b.nodes.map(n=>`<span class="status-chip ${n.status==='rejected'?'':'active'}">${esc(n.type)} · ${esc(n.label.slice(0,55))}${n.label.length>55?'…':''}</span>`).join('')}</div></div>`).join('')}</section>`;
}
function time(v){return new Date(v).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}
function esc(t=''){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
