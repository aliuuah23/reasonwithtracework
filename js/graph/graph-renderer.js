import { autoLayout, surfaceSize } from './graph-layout.js';
import { typeLabels } from '../core/ontology.js';
import { nodeGuidance } from '../core/node-guidance.js';
import { connectionSignal } from './connection-rules.js';

const CANVAS_ORIGIN_X=360;
const CANVAS_ORIGIN_Y=680;

export function renderGraph({nodes,edges,activeNodeId},els,{
  onNodeClick,onNodeMove,onNodeContext,onNodeStatusClick,onEdgeClick,onEdgeQuickDisconnect,onConnect,canConnect,getScale=()=>1,
  selectedEdgeId=null,selectedNodeIds=[],issueNodeIds=[],showNodeTypes=true,showWireSignals=true,pilotEvidence=null
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
  els.svg.innerHTML=edges.map(e=>edgeMarkup(e,activeNodeId,edges,selectedEdgeId,nodesById,showWireSignals,pilotEvidence)).join('');

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

  // Only the generous invisible hit-path handles selection. The visible line never jumps into pointer focus.
  els.svg.querySelectorAll('.trace-edge-hit').forEach(path=>{
    path.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
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
      if(e.target.closest('.node-port,.node-status'))return;
      if(!el.classList.contains('dragging')) onNodeClick?.(el.dataset.id,e);
    });
    el.addEventListener('contextmenu',e=>{
      e.preventDefault();e.stopPropagation();
      onNodeContext?.(el.dataset.id,e);
    });
    el.querySelector('.node-status')?.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      onNodeStatusClick?.(el.dataset.id,e);
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
        ? 'Provisional = kept open for testing, revision or comparison rather than treated as settled.'
        : 'Active = currently retained as part of the working reasoning network.';
  const help=nodeGuidance[n.type]?.use||'';
  const ports='<button class="node-port port-in" type="button" aria-label="Connect into this node" title="Drag from here to find a source for this node"></button><button class="node-port port-out" type="button" aria-label="Connect from this node" title="Drag from here to connect this node forward"></button>';
  return `<article class="graph-node ${selected?'selected':''} ${issue?'trace-open':''} ${locked?'locked':''} ${grouped?'grouped':''} ${n.status==='rejected'?'rejected':''}" data-id="${n.id}" data-type="${n.type}" data-locked="${locked?'true':'false'}" style="left:${n.x}px;top:${n.y}px">
    ${ports}<div class="node-accent"></div>${locked?'<span class="node-lock-pill" title="Position locked">LOCKED</span>':''}${grouped?'<span class="node-group-pill" title="Moves with its group">GROUP</span>':''}<div class="node-body">
      <div class="node-type has-help" data-help="${escapeHtml(help)}"><i></i>${typeLabels[n.type]||n.type}</div>
      <div class="node-label">${escapeHtml(n.label)}</div>
      <div class="node-foot"><button type="button" class="node-status has-help" data-help="${escapeHtml(statusHelp)}">${escapeHtml(meta)}${n.type!=='note'&&n.status!=='rejected'?' ▾':''}</button></div>
    </div></article>`;
}

function edgeMarkup(e,activeNodeId,edges,selectedEdgeId,nodesById,showWireSignals,pilotEvidence){
  const active=isOnActivePath(e,activeNodeId,edges);
  const muted=Boolean(selectedEdgeId && e.id!==selectedEdgeId);
  const source=nodesById.get(e.source),target=nodesById.get(e.target);
  const signal=connectionSignal(source,target,pilotEvidence);
  const signalClass=showWireSignals?`evidence-${signal.band||'neutral'}`:'';
  const visible=`<path data-edge-id="${e.id}" class="trace-edge ${active&&!selectedEdgeId?'active':''} ${e.id===selectedEdgeId?'selected':''} ${muted?'edge-muted':''} ${signalClass} ${e.status==='rejected'?'rejected':''}" d=""/>`;
  const hit=`<path data-edge-id="${e.id}" class="trace-edge-hit" d=""/>`;
  return visible+hit;
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
  let start=null,origins=null,moved=false;
  el.addEventListener('pointerdown',e=>{
    if(e.button!==0||e.target.closest('.node-port,.node-status'))return;
    if(locked)return;
    e.stopPropagation();
    const dragIds=getDragIds?.()||[el.dataset.id];
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
    if(Math.abs(dx)+Math.abs(dy)<=1&&!moved)return;
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
      origins.forEach((o,id)=>onMove?.(id,parseFloat(o.el.style.left),parseFloat(o.el.style.top)));
    }
    try{el.releasePointerCapture(e.pointerId);}catch{}
    start=null;
    setTimeout(()=>origins?.forEach(({el:target})=>target.classList.remove('dragging')),0);
  };
  el.addEventListener('pointerup',finish);
  el.addEventListener('pointercancel',finish);
}

function bindConnectionPorts({surface,svg,nodesRoot,positions,nodesById,edges,onConnect,canConnect,getScale,nodeAnchor}){
  nodesRoot.querySelectorAll('.node-port').forEach(port=>{
    port.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      e.preventDefault();e.stopPropagation();
      const originEl=port.closest('.graph-node');
      const originId=originEl?.dataset.id;
      const origin=nodesById.get(originId);
      if(!origin)return;
      const startSide=port.classList.contains('port-in')?'in':'out';
      const start=nodeAnchor(originId,startSide)||positions.get(originId);
      const temp=document.createElementNS('http://www.w3.org/2000/svg','path');
      temp.setAttribute('class','trace-edge draft-connection');
      svg.appendChild(temp);
      nodesRoot.classList.add('connecting');

      nodesRoot.querySelectorAll('.node-port').forEach(candidate=>{
        const otherId=candidate.closest('.graph-node')?.dataset.id;
        if(!otherId||otherId===originId)return;
        const other=nodesById.get(otherId);
        const pair=resolvePair(origin,other,startSide);
        const result=canConnect?.(pair.source,pair.target,edges)??{ok:true};
        candidate.classList.add(result.ok?'compatible':'incompatible');
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
        nodesRoot.querySelectorAll('.node-port').forEach(p=>p.classList.remove('compatible','incompatible'));
        const hit=document.elementFromPoint(evt.clientX,evt.clientY)?.closest('.node-port');
        const otherId=hit?.closest('.graph-node')?.dataset.id;
        const other=nodesById.get(otherId);
        if(!other){onConnect?.(null,null,{ok:false});return;}
        const pair=resolvePair(origin,other,startSide);
        const result=canConnect?.(pair.source,pair.target,edges)??{ok:true};
        onConnect?.(pair.source,pair.target,result);
      };
      window.addEventListener('pointermove',move,true);
      window.addEventListener('pointerup',finish,true);
      move(e);
    });
  });
}

function resolvePair(origin,other,startSide){
  return startSide==='in'?{source:other,target:origin}:{source:origin,target:other};
}

function curvePath(x1,y1,x2,y2){
  const distance=Math.abs(x2-x1);
  const dx=Math.max(50,distance*.45);
  const direction=x2>=x1?1:-1;
  return `M ${x1} ${y1} C ${x1+(dx*direction)} ${y1}, ${x2-(dx*direction)} ${y2}, ${x2} ${y2}`;
}

function escapeHtml(t=''){return String(t).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
function cssEscape(value=''){return globalThis.CSS?.escape?CSS.escape(String(value)):String(value).replace(/[^a-zA-Z0-9_-]/g,'\\$&');}
