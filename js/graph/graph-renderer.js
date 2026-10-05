import { autoLayout, surfaceSize } from './graph-layout.js';
import { typeLabels } from '../core/ontology.js';
import { nodeGuidance } from '../core/node-guidance.js';

const CANVAS_ORIGIN_X=360;
const CANVAS_ORIGIN_Y=680;

export function renderGraph({nodes,edges,activeNodeId},els,{
  onNodeClick,onNodeMove,onEdgeClick,onConnect,canConnect,getScale=()=>1,
  selectedEdgeId=null,issueNodeIds=[],showNodeTypes=true
}){
  const world=autoLayout(nodes);
  const laid=world.map(n=>({...n,x:(Number(n.x)||0)+CANVAS_ORIGIN_X,y:(Number(n.y)||0)+CANVAS_ORIGIN_Y}));
  const positions=new Map(laid.map(n=>[n.id,{...n}]));
  const nodesById=new Map(laid.map(n=>[n.id,n]));
  const size=surfaceSize(laid);
  const minX=Math.min(...laid.map(n=>n.x),CANVAS_ORIGIN_X);
  const minY=Math.min(...laid.map(n=>n.y),CANVAS_ORIGIN_Y);
  const maxX=Math.max(...laid.map(n=>n.x+230),CANVAS_ORIGIN_X+600);
  const maxY=Math.max(...laid.map(n=>n.y+112),CANVAS_ORIGIN_Y+420);

  els.surface.style.width=`${size.width}px`;
  els.surface.style.height=`${size.height}px`;
  els.surface.dataset.worldWidth=String(size.width);
  els.surface.dataset.worldHeight=String(size.height);
  els.surface.dataset.originX=String(CANVAS_ORIGIN_X);
  els.surface.dataset.originY=String(CANVAS_ORIGIN_Y);
  els.surface.dataset.contentMinX=String(minX);
  els.surface.dataset.contentMinY=String(minY);
  els.surface.dataset.contentMaxX=String(maxX);
  els.surface.dataset.contentMaxY=String(maxY);
  els.surface.classList.toggle('hide-node-types',!showNodeTypes);
  els.svg.setAttribute('viewBox',`0 0 ${size.width} ${size.height}`);
  els.svg.innerHTML=edges.map(e=>edgeMarkup(e,positions,activeNodeId,edges,selectedEdgeId)).join('');
  const issueSet=new Set(issueNodeIds||[]);
  els.nodes.innerHTML=laid.map(n=>nodeMarkup(n,n.id===activeNodeId,issueSet.has(n.id))).join('');

  const redrawEdges=()=>{
    els.svg.querySelectorAll('.trace-edge').forEach(path=>{
      const edge=edges.find(e=>e.id===path.dataset.edgeId);
      if(!edge) return;
      const d=edgePath(edge,positions);
      if(d) path.setAttribute('d',d);
    });
  };

  els.svg.querySelectorAll('.trace-edge').forEach(path=>{
    path.addEventListener('click',e=>{e.stopPropagation();onEdgeClick?.(path.dataset.edgeId);});
  });

  els.nodes.querySelectorAll('.graph-node').forEach(el=>{
    el.addEventListener('click',e=>{
      if(e.target.closest('.node-port'))return;
      if(!el.classList.contains('dragging')) onNodeClick?.(el.dataset.id);
    });

    bindDrag(el,{
      bounds:size,
      onLiveMove:(id,x,y)=>{
        const pos=positions.get(id);
        if(pos){ pos.x=x; pos.y=y; }
        redrawEdges();
      },
      onMove:(id,x,y)=>onNodeMove?.(id,x-CANVAS_ORIGIN_X,y-CANVAS_ORIGIN_Y),
      getScale
    });
  });

  bindConnectionPorts({surface:els.surface,svg:els.svg,nodesRoot:els.nodes,positions,nodesById,edges,onConnect,canConnect,getScale});
}

function nodeMarkup(n,selected,issue){
  const meta=n.type==='note'?'Loose note':n.meta?.provisional?'Provisional':n.status==='rejected'?'Rejected':'Active';
  const help=nodeGuidance[n.type]?.use||'';
  const ports=n.type==='note'?'':`${n.type!=='input'?'<button class="node-port port-in" type="button" aria-label="Connect into this node" title="Connect into this node"></button>':''}${n.type!=='goal'?'<button class="node-port port-out" type="button" aria-label="Connect from this node" title="Connect from this node"></button>':''}`;
  return `<article class="graph-node ${selected?'selected':''} ${issue?'trace-open':''} ${n.status==='rejected'?'rejected':''}" data-id="${n.id}" data-type="${n.type}" style="left:${n.x}px;top:${n.y}px">
    ${ports}<div class="node-accent"></div><div class="node-body">
      <div class="node-type has-help" data-help="${escapeHtml(help)}"><i></i>${typeLabels[n.type]||n.type}</div>
      <div class="node-label">${escapeHtml(n.label)}</div>
      <div class="node-foot"><span>${escapeHtml(meta)}</span><span class="node-branch">${n.type==='note'?'Unclassified':shortBranch(n.branchId)}</span></div>
    </div></article>`;
}

function edgeMarkup(e,pos,activeNodeId,edges,selectedEdgeId){
  const d=edgePath(e,pos);
  if(!d) return '';
  const active=isOnActivePath(e,activeNodeId,edges);
  return `<path data-edge-id="${e.id}" class="trace-edge ${active?'active':''} ${e.id===selectedEdgeId?'selected':''} ${e.status==='provisional'?'provisional':''} ${e.status==='rejected'?'rejected':''}" d="${d}"/>`;
}

function edgePath(e,pos){
  const a=pos.get(e.source), b=pos.get(e.target);
  if(!a||!b) return '';
  return curvePath(a.x+230,a.y+46,b.x,b.y+46);
}
function curvePath(x1,y1,x2,y2){
  const distance=Math.abs(x2-x1);
  const dx=Math.max(50,distance*.45);
  const direction=x2>=x1?1:-1;
  return `M ${x1} ${y1} C ${x1+(dx*direction)} ${y1}, ${x2-(dx*direction)} ${y2}, ${x2} ${y2}`;
}

function isOnActivePath(edge,activeNodeId,edges){
  let current=activeNodeId;
  const path=new Set();
  const visited=new Set();
  while(current&&!visited.has(current)){
    visited.add(current);
    const incoming=edges.filter(x=>x.target===current);
    if(!incoming.length)break;
    incoming.forEach(e=>path.add(e.id));
    current=incoming[0].source;
  }
  return path.has(edge.id);
}

function bindDrag(el,{bounds,onLiveMove,onMove,getScale}){
  let start=null,origin=null,moved=false;

  el.addEventListener('pointerdown',e=>{
    if(e.button!==0||e.target.closest('.node-port'))return;
    e.stopPropagation();
    start={x:e.clientX,y:e.clientY,pointerId:e.pointerId};
    origin={x:parseFloat(el.style.left),y:parseFloat(el.style.top)};
    moved=false;
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove',e=>{
    if(!start || e.pointerId!==start.pointerId)return;
    const scale=Math.max(.01,Number(getScale?.()||1));
    const dx=(e.clientX-start.x)/scale,dy=(e.clientY-start.y)/scale;
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

function bindConnectionPorts({surface,svg,nodesRoot,positions,nodesById,edges,onConnect,canConnect,getScale}){
  const outputs=nodesRoot.querySelectorAll('.port-out');
  outputs.forEach(port=>{
    port.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      e.preventDefault();e.stopPropagation();
      const sourceEl=port.closest('.graph-node');
      const sourceId=sourceEl?.dataset.id;
      const source=nodesById.get(sourceId);
      if(!source)return;
      const start=positions.get(sourceId);
      const temp=document.createElementNS('http://www.w3.org/2000/svg','path');
      temp.setAttribute('class','trace-edge draft-connection');
      svg.appendChild(temp);
      nodesRoot.classList.add('connecting');
      nodesRoot.querySelectorAll('.port-in').forEach(targetPort=>{
        const targetId=targetPort.closest('.graph-node')?.dataset.id;
        const target=nodesById.get(targetId);
        const result=canConnect?.(source,target,edges) ?? {ok:true};
        targetPort.classList.add(result.ok?'compatible':'incompatible');
      });

      const pointFromEvent=evt=>{
        const rect=surface.getBoundingClientRect();
        const scale=Math.max(.01,Number(getScale?.()||1));
        return {x:(evt.clientX-rect.left)/scale,y:(evt.clientY-rect.top)/scale};
      };
      const move=evt=>{
        const p=pointFromEvent(evt);
        temp.setAttribute('d',curvePath(start.x+230,start.y+46,p.x,p.y));
      };
      const finish=evt=>{
        window.removeEventListener('pointermove',move,true);
        window.removeEventListener('pointerup',finish,true);
        temp.remove();nodesRoot.classList.remove('connecting');
        nodesRoot.querySelectorAll('.port-in').forEach(p=>p.classList.remove('compatible','incompatible'));
        const hit=document.elementFromPoint(evt.clientX,evt.clientY)?.closest('.port-in');
        const targetId=hit?.closest('.graph-node')?.dataset.id;
        const target=nodesById.get(targetId);
        const result=canConnect?.(source,target,edges) ?? {ok:Boolean(target)};
        onConnect?.(source,target,result);
      };
      window.addEventListener('pointermove',move,true);
      window.addEventListener('pointerup',finish,true);
      move(e);
    });
  });
}

function shortBranch(id){ return id==='branch-1'?'Path 1':`Path ${String(id||'').slice(-3).toUpperCase()}`; }
function escapeHtml(t=''){ return String(t).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c])); }
