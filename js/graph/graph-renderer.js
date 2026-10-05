import { autoLayout, surfaceSize } from './graph-layout.js';
import { typeLabels } from '../core/ontology.js';
import { nodeGuidance } from '../core/node-guidance.js';

const CANVAS_ORIGIN_X=360;
const CANVAS_ORIGIN_Y=680;
const TYPE_ORDER=['input','interpretation','grounding','consequence','evaluation','goal'];

export function renderGraph({nodes,edges,activeNodeId},els,{
  onNodeClick,onNodeMove,onNodeContext,onNodeQuickLock,onEdgeClick,onEdgeQuickDisconnect,onConnect,canConnect,getScale=()=>1,
  selectedEdgeId=null,selectedNodeIds=[],issueNodeIds=[],showNodeTypes=true,showWireSignals=true
}){
  const world=autoLayout(nodes);
  const laid=world.map(n=>({...n,x:(Number(n.x)||0)+CANVAS_ORIGIN_X,y:(Number(n.y)||0)+CANVAS_ORIGIN_Y}));
  const positions=new Map(laid.map(n=>[n.id,{...n}]));
  const nodesById=new Map(laid.map(n=>[n.id,n]));
  const selectedSet=new Set(selectedNodeIds||[]);
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
  els.surface.classList.toggle('hide-wire-signals',!showWireSignals);
  els.svg.setAttribute('viewBox',`0 0 ${size.width} ${size.height}`);
  const issueSet=new Set(issueNodeIds||[]);
  els.nodes.innerHTML=laid.map(n=>nodeMarkup(n,selectedSet.has(n.id)||n.id===activeNodeId,issueSet.has(n.id))).join('');
  els.svg.innerHTML=edges.map(e=>edgeMarkup(e,positions,activeNodeId,edges,selectedEdgeId,nodesById,showWireSignals)).join('');

  const nodeAnchor=(id,side='out')=>{
    const el=els.nodes.querySelector(`.graph-node[data-id="${cssEscape(id)}"]`);
    if(!el){
      const n=positions.get(id); if(!n)return null;
      return {x:n.x+(side==='out'?230:0),y:n.y+46};
    }
    return {x:el.offsetLeft+(side==='out'?el.offsetWidth:0),y:el.offsetTop+el.offsetHeight/2};
  };

  const pathForEdge=edge=>{
    const a=nodeAnchor(edge.source,'out'),b=nodeAnchor(edge.target,'in');
    if(!a||!b)return '';
    return curvePath(a.x,a.y,b.x,b.y);
  };

  const redrawEdges=()=>{
    els.svg.querySelectorAll('[data-edge-id]').forEach(path=>{
      const edge=edges.find(e=>e.id===path.dataset.edgeId);
      if(!edge)return;
      const d=pathForEdge(edge);
      if(d)path.setAttribute('d',d);
    });
  };
  requestAnimationFrame(redrawEdges);

  els.svg.querySelectorAll('.trace-edge-hit,.trace-edge').forEach(path=>{
    path.addEventListener('click',e=>{
      e.stopPropagation();
      const id=path.dataset.edgeId;
      if(e.shiftKey) onEdgeQuickDisconnect?.(id);
      else onEdgeClick?.(id);
    });
  });

  const groupIdsFor=(id)=>{
    const node=nodesById.get(id);
    if(!node)return [id];
    const groupId=node.meta?.groupId;
    if(groupId){
      const ids=laid.filter(n=>n.meta?.groupId===groupId && !n.meta?.locked).map(n=>n.id);
      return ids.length?ids:[id];
    }
    if(selectedSet.has(id) && selectedSet.size>1){
      const ids=[...selectedSet].filter(x=>nodesById.has(x) && !nodesById.get(x)?.meta?.locked);
      return ids.length?ids:[id];
    }
    return [id];
  };

  els.nodes.querySelectorAll('.graph-node').forEach(el=>{
    el.addEventListener('click',e=>{
      if(e.target.closest('.node-port'))return;
      if(!el.classList.contains('dragging')) onNodeClick?.(el.dataset.id,e);
    });
    el.addEventListener('contextmenu',e=>{
      e.preventDefault();e.stopPropagation();
      onNodeContext?.(el.dataset.id,e);
    });
    el.addEventListener('auxclick',e=>{
      if(e.button!==1||e.target.closest('.node-port'))return;
      e.preventDefault();e.stopPropagation();
      onNodeQuickLock?.(el.dataset.id,e);
    });

    bindDrag(el,{
      bounds:size,
      locked:el.dataset.locked==='true',
      getDragIds:()=>groupIdsFor(el.dataset.id),
      nodesRoot:els.nodes,
      positions,
      onLiveMove:(id,x,y)=>{
        const pos=positions.get(id);
        if(pos){pos.x=x;pos.y=y;}
        redrawEdges();
      },
      onMove:(id,x,y)=>onNodeMove?.(id,x-CANVAS_ORIGIN_X,y-CANVAS_ORIGIN_Y),
      getScale
    });
  });

  bindConnectionPorts({surface:els.surface,svg:els.svg,nodesRoot:els.nodes,positions,nodesById,edges,onConnect,canConnect,getScale,nodeAnchor});
}

function nodeMarkup(n,selected,issue){
  const locked=Boolean(n.meta?.locked);
  const grouped=Boolean(n.meta?.groupId);
  const meta=n.type==='note'?'Loose note':n.meta?.provisional?'Provisional':n.status==='rejected'?'Rejected':'Active';
  const statusHelp=n.type==='note'
    ? 'Loose note = intentionally uncategorised. Convert it only when its reasoning role becomes clear.'
    : n.status==='rejected'
      ? 'Rejected = retained as reasoning history, but no longer treated as an active route.'
      : n.meta?.provisional
        ? 'Provisional = an alternative, imported or forked move that has not yet been treated as the main route.'
        : 'Active = currently retained as part of the working reasoning network.';
  const help=nodeGuidance[n.type]?.use||'';
  const ports=n.type==='note'?'':`${n.type!=='input'?'<button class="node-port port-in" type="button" aria-label="Connect into this node" title="Drop a connection here"></button>':''}${n.type!=='goal'?'<button class="node-port port-out" type="button" aria-label="Connect from this node" title="Drag from here to connect another reasoning move"></button>':''}`;
  return `<article class="graph-node ${selected?'selected':''} ${issue?'trace-open':''} ${locked?'locked':''} ${grouped?'grouped':''} ${n.status==='rejected'?'rejected':''}" data-id="${n.id}" data-type="${n.type}" data-locked="${locked?'true':'false'}" style="left:${n.x}px;top:${n.y}px">
    ${ports}<div class="node-accent"></div>${locked?'<span class="node-lock-pill" title="Position locked">LOCKED</span>':''}${grouped?'<span class="node-group-pill" title="Moves with its group">GROUP</span>':''}<div class="node-body">
      <div class="node-type has-help" data-help="${escapeHtml(help)}"><i></i>${typeLabels[n.type]||n.type}</div>
      <div class="node-label">${escapeHtml(n.label)}</div>
      <div class="node-foot"><span class="node-status has-help" data-help="${escapeHtml(statusHelp)}">${escapeHtml(meta)}</span></div>
    </div></article>`;
}

function edgeMarkup(e,pos,activeNodeId,edges,selectedEdgeId,nodesById,showWireSignals){
  const d=edgePath(e,pos);
  if(!d)return '';
  const active=isOnActivePath(e,activeNodeId,edges);
  const muted=Boolean(selectedEdgeId && e.id!==selectedEdgeId);
  const signal=wireSignal(e,nodesById);
  const signalClass=showWireSignals && signal==='exploratory'?'exploratory':'';
  return `<path data-edge-id="${e.id}" class="trace-edge-hit" d="${d}"/><path data-edge-id="${e.id}" class="trace-edge ${active&&!selectedEdgeId?'active':''} ${e.id===selectedEdgeId?'selected':''} ${muted?'edge-muted':''} ${signalClass} ${e.status==='rejected'?'rejected':''}" d="${d}"/>`;
}

function wireSignal(edge,nodesById){
  const a=nodesById.get(edge.source),b=nodesById.get(edge.target);
  if(!a||!b)return 'direct';
  const ai=TYPE_ORDER.indexOf(a.type),bi=TYPE_ORDER.indexOf(b.type);
  if(edge.status==='provisional')return 'exploratory';
  if(ai<0||bi<0)return 'direct';
  return bi-ai===1?'direct':'exploratory';
}

function edgePath(e,pos){
  const a=pos.get(e.source),b=pos.get(e.target);
  if(!a||!b)return '';
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

function bindDrag(el,{bounds,onLiveMove,onMove,getScale,locked=false,getDragIds=()=>[el.dataset.id],nodesRoot,positions}){
  let start=null,origins=null,moved=false,dragIds=[];

  el.addEventListener('pointerdown',e=>{
    if(e.button!==0||e.target.closest('.node-port'))return;
    if(locked)return;
    e.stopPropagation();
    dragIds=getDragIds?.()||[el.dataset.id];
    origins=new Map();
    dragIds.forEach(id=>{
      const target=nodesRoot.querySelector(`.graph-node[data-id="${cssEscape(id)}"]`);
      if(target)origins.set(id,{el:target,x:parseFloat(target.style.left),y:parseFloat(target.style.top)});
    });
    if(!origins.size)return;
    start={x:e.clientX,y:e.clientY,pointerId:e.pointerId};
    moved=false;
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove',e=>{
    if(!start||e.pointerId!==start.pointerId)return;
    const scale=Math.max(.01,Number(getScale?.()||1));
    let dx=(e.clientX-start.x)/scale,dy=(e.clientY-start.y)/scale;
    if(Math.abs(dx)+Math.abs(dy)<=2&&!moved)return;
    moved=true;
    origins.forEach(({el:target})=>target.classList.add('dragging'));
    const maxX=Math.max(20,bounds.width-250),maxY=Math.max(20,bounds.height-112);
    const minOriginX=Math.min(...[...origins.values()].map(o=>o.x));
    const minOriginY=Math.min(...[...origins.values()].map(o=>o.y));
    const maxOriginX=Math.max(...[...origins.values()].map(o=>o.x));
    const maxOriginY=Math.max(...[...origins.values()].map(o=>o.y));
    dx=Math.min(maxX-maxOriginX,Math.max(20-minOriginX,dx));
    dy=Math.min(maxY-maxOriginY,Math.max(20-minOriginY,dy));
    origins.forEach((o,id)=>{
      const x=o.x+dx,y=o.y+dy;
      o.el.style.left=`${x}px`;o.el.style.top=`${y}px`;
      const pos=positions.get(id); if(pos){pos.x=x;pos.y=y;}
      onLiveMove?.(id,x,y);
    });
  });

  const finish=e=>{
    if(!start||e.pointerId!==start.pointerId)return;
    if(moved){
      origins.forEach((o,id)=>{
        const x=parseFloat(o.el.style.left),y=parseFloat(o.el.style.top);
        onMove?.(id,x,y);
      });
    }
    try{el.releasePointerCapture(e.pointerId);}catch{}
    start=null;
    setTimeout(()=>origins?.forEach(({el:target})=>target.classList.remove('dragging')),0);
  };
  el.addEventListener('pointerup',finish);
  el.addEventListener('pointercancel',finish);
}

function bindConnectionPorts({surface,svg,nodesRoot,positions,nodesById,edges,onConnect,canConnect,getScale,nodeAnchor}){
  nodesRoot.querySelectorAll('.port-out').forEach(port=>{
    port.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      e.preventDefault();e.stopPropagation();
      const sourceEl=port.closest('.graph-node');
      const sourceId=sourceEl?.dataset.id;
      const source=nodesById.get(sourceId);
      if(!source)return;
      const start=nodeAnchor(sourceId,'out')||positions.get(sourceId);
      const temp=document.createElementNS('http://www.w3.org/2000/svg','path');
      temp.setAttribute('class','trace-edge draft-connection');
      svg.appendChild(temp);
      nodesRoot.classList.add('connecting');
      nodesRoot.querySelectorAll('.port-in').forEach(targetPort=>{
        const targetId=targetPort.closest('.graph-node')?.dataset.id;
        const target=nodesById.get(targetId);
        const result=canConnect?.(source,target,edges)??{ok:true};
        targetPort.classList.add(result.ok?'compatible':'incompatible');
      });

      const pointFromEvent=evt=>{
        const rect=surface.getBoundingClientRect();
        const scale=Math.max(.01,Number(getScale?.()||1));
        return{x:(evt.clientX-rect.left)/scale,y:(evt.clientY-rect.top)/scale};
      };
      const move=evt=>{
        const p=pointFromEvent(evt);
        temp.setAttribute('d',curvePath(start.x,start.y,p.x,p.y));
      };
      const finish=evt=>{
        window.removeEventListener('pointermove',move,true);
        window.removeEventListener('pointerup',finish,true);
        temp.remove();nodesRoot.classList.remove('connecting');
        nodesRoot.querySelectorAll('.port-in').forEach(p=>p.classList.remove('compatible','incompatible'));
        const hit=document.elementFromPoint(evt.clientX,evt.clientY)?.closest('.port-in');
        const targetId=hit?.closest('.graph-node')?.dataset.id;
        const target=nodesById.get(targetId);
        const result=canConnect?.(source,target,edges)??{ok:Boolean(target)};
        onConnect?.(source,target,result);
      };
      window.addEventListener('pointermove',move,true);
      window.addEventListener('pointerup',finish,true);
      move(e);
    });
  });
}

function escapeHtml(t=''){return String(t).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
function cssEscape(value=''){return globalThis.CSS?.escape?CSS.escape(String(value)):String(value).replace(/[^a-zA-Z0-9_-]/g,'\\$&');}
