import { autoLayout, surfaceSize } from './graph-layout.js';
import { typeLabels } from '../core/ontology.js';

export function renderGraph({nodes,edges,activeNodeId},els,{onNodeClick,onNodeMove}){
  const laid=autoLayout(nodes);
  const positions=new Map(laid.map(n=>[n.id,{...n}]));
  const size=surfaceSize(laid);

  els.surface.style.width=`${size.width}px`;
  els.surface.style.height=`${size.height}px`;
  els.svg.setAttribute('viewBox',`0 0 ${size.width} ${size.height}`);
  els.svg.innerHTML=edges.map(e=>edgeMarkup(e,positions,activeNodeId,edges)).join('');
  els.nodes.innerHTML=laid.map(n=>nodeMarkup(n,n.id===activeNodeId)).join('');

  const redrawEdges=()=>{
    els.svg.querySelectorAll('.trace-edge').forEach(path=>{
      const edge=edges.find(e=>e.id===path.dataset.edgeId);
      if(!edge) return;
      const d=edgePath(edge,positions);
      if(d) path.setAttribute('d',d);
    });
  };

  els.nodes.querySelectorAll('.graph-node').forEach(el=>{
    el.addEventListener('click',()=>{
      if(!el.classList.contains('dragging')) onNodeClick?.(el.dataset.id);
    });

    bindDrag(el,{
      bounds:size,
      onLiveMove:(id,x,y)=>{
        const pos=positions.get(id);
        if(pos){ pos.x=x; pos.y=y; }
        redrawEdges();
      },
      onMove:onNodeMove
    });
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
  const d=edgePath(e,pos);
  if(!d) return '';
  const active=isOnActivePath(e,activeNodeId,edges);
  return `<path data-edge-id="${e.id}" class="trace-edge ${active?'active':''} ${e.status==='provisional'?'provisional':''} ${e.status==='rejected'?'rejected':''}" d="${d}"/>`;
}

function edgePath(e,pos){
  const a=pos.get(e.source), b=pos.get(e.target);
  if(!a||!b) return '';
  const x1=a.x+230,y1=a.y+46,x2=b.x,y2=b.y+46;
  const distance=Math.abs(x2-x1);
  const dx=Math.max(50,distance*.45);
  const direction=x2>=x1?1:-1;
  return `M ${x1} ${y1} C ${x1+(dx*direction)} ${y1}, ${x2-(dx*direction)} ${y2}, ${x2} ${y2}`;
}

function isOnActivePath(edge,activeNodeId,edges){
  let current=activeNodeId;
  const path=new Set();
  while(current){
    const e=edges.find(x=>x.target===current);
    if(!e) break;
    path.add(e.id);
    current=e.source;
  }
  return path.has(edge.id);
}

function bindDrag(el,{bounds,onLiveMove,onMove}){
  let start=null,origin=null,moved=false;

  el.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    e.stopPropagation();
    start={x:e.clientX,y:e.clientY,pointerId:e.pointerId};
    origin={x:parseFloat(el.style.left),y:parseFloat(el.style.top)};
    moved=false;
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove',e=>{
    if(!start || e.pointerId!==start.pointerId)return;
    const dx=e.clientX-start.x,dy=e.clientY-start.y;
    if(Math.abs(dx)+Math.abs(dy)<=4 && !moved)return;

    moved=true;
    el.classList.add('dragging');
    const maxX=Math.max(20,bounds.width-250);
    const maxY=Math.max(20,bounds.height-112);
    const x=Math.min(maxX,Math.max(20,origin.x+dx));
    const y=Math.min(maxY,Math.max(20,origin.y+dy));
    el.style.left=`${x}px`;
    el.style.top=`${y}px`;
    onLiveMove?.(el.dataset.id,x,y);
  });

  const finish=e=>{
    if(!start || e.pointerId!==start.pointerId)return;
    if(moved){
      const x=parseFloat(el.style.left),y=parseFloat(el.style.top);
      onMove?.(el.dataset.id,x,y);
    }
    try{ el.releasePointerCapture(e.pointerId); }catch{}
    start=null;
    setTimeout(()=>el.classList.remove('dragging'),0);
  };

  el.addEventListener('pointerup',finish);
  el.addEventListener('pointercancel',finish);
}

function shortBranch(id){ return id==='branch-1'?'Path 1':`Path ${id.slice(-3).toUpperCase()}`; }
function escapeHtml(t=''){ return t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
