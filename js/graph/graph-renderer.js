import { autoLayout, surfaceSize } from './graph-layout.js';
import { typeLabels } from '../core/ontology.js';

export function renderGraph({nodes,edges,activeNodeId},els,{onNodeClick,onNodeMove}){
  const laid=autoLayout(nodes);
  const positions=new Map(laid.map(n=>[n.id,n]));
  const size=surfaceSize(laid);
  els.surface.style.width=`${size.width}px`; els.surface.style.height=`${size.height}px`;
  els.svg.setAttribute('viewBox',`0 0 ${size.width} ${size.height}`);
  els.svg.innerHTML=edges.map(e=>edgeMarkup(e,positions,activeNodeId,edges)).join('');
  els.nodes.innerHTML=laid.map(n=>nodeMarkup(n,n.id===activeNodeId)).join('');
  els.nodes.querySelectorAll('.graph-node').forEach(el=>{
    el.addEventListener('click',e=>{ if(!el.classList.contains('dragging')) onNodeClick?.(el.dataset.id); });
    bindDrag(el,onNodeMove);
  });
}
function nodeMarkup(n,selected){
  const meta=n.meta?.provisional?'Provisional':n.status==='rejected'?'Rejected':'Active';
  return `<article class="graph-node ${selected?'selected':''} ${n.status==='rejected'?'rejected':''}" data-id="${n.id}" data-type="${n.type}" style="left:${n.x}px;top:${n.y}px">
    <div class="node-accent"></div><div class="node-body">
      <div class="node-type"><i></i>${typeLabels[n.type]||n.type}</div>
      <div class="node-label">${escapeHtml(n.label)}</div>
      <div class="node-foot"><span>${escapeHtml(meta)}</span><span class="node-branch">${shortBranch(n.branchId)}</span></div>
    </div></article>`;
}
function edgeMarkup(e,pos,activeNodeId,edges){
  const a=pos.get(e.source), b=pos.get(e.target); if(!a||!b) return '';
  const x1=a.x+230,y1=a.y+46,x2=b.x,y2=b.y+46,dx=Math.max(50,(x2-x1)*.45);
  const active=isOnActivePath(e,activeNodeId,edges);
  return `<path class="trace-edge ${active?'active':''} ${e.status==='provisional'?'provisional':''} ${e.status==='rejected'?'rejected':''}" d="M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}"/>`;
}
function isOnActivePath(edge,activeNodeId,edges){
  let current=activeNodeId; const path=new Set();
  while(current){ const e=edges.find(x=>x.target===current); if(!e) break; path.add(e.id); current=e.source; }
  return path.has(edge.id);
}
function bindDrag(el,onMove){
  let start=null,origin=null,moved=false;
  el.addEventListener('pointerdown',e=>{ if(e.button!==0)return; start={x:e.clientX,y:e.clientY}; origin={x:parseFloat(el.style.left),y:parseFloat(el.style.top)}; moved=false; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove',e=>{ if(!start)return; const dx=e.clientX-start.x,dy=e.clientY-start.y; if(Math.abs(dx)+Math.abs(dy)>5){moved=true;el.classList.add('dragging');el.style.left=`${origin.x+dx}px`;el.style.top=`${origin.y+dy}px`;}});
  el.addEventListener('pointerup',e=>{ if(!start)return; if(moved) onMove?.(el.dataset.id,parseFloat(el.style.left),parseFloat(el.style.top)); start=null; setTimeout(()=>el.classList.remove('dragging'),0); });
}
function shortBranch(id){ return id==='branch-1'?'Path 1':`Path ${id.slice(-3).toUpperCase()}`; }
function escapeHtml(t=''){ return t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
