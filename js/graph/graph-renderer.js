import { autoLayout, surfaceSize } from './graph-layout.js';
import { typeLabels } from '../core/ontology.js';
import { nodeGuidance } from '../core/node-guidance.js';
import { connectionSignal } from './connection-rules.js';

const CANVAS_ORIGIN_X=360;
const CANVAS_ORIGIN_Y=680;
let lastNodeActivation={id:null,time:0};

export function renderGraph({nodes,edges,activeNodeId},els,{
  onNodeClick,onNodeDoubleClick,onNodePreviewToggle,onNodeMove,onNodeContext,onNodeStatusClick,onNodeTypeClick,onEdgeClick,onEdgeQuickDisconnect,onConnect,canConnect,getScale=()=>1,
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

  // Wire selection uses a screen-consistent hit target and resolves overlapping wires by
  // geometric proximity. The visible path never moves or changes geometry when selected.
  const visibleEdges=[...els.svg.querySelectorAll('.trace-edge:not(.draft-connection)')];
  const pointInSvg=e=>{
    const pt=els.svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY;
    const matrix=els.svg.getScreenCTM();
    return matrix?pt.matrixTransform(matrix.inverse()):{x:e.clientX,y:e.clientY};
  };
  const distanceToPath=(path,p)=>{
    const len=path.getTotalLength?.()||0; if(!len)return Infinity;
    // Denser sampling makes crossing/parallel wires deterministic without changing their paths.
    const samples=Math.max(28,Math.min(160,Math.ceil(len/10)));
    let best=Infinity;
    for(let i=0;i<=samples;i++){
      const q=path.getPointAtLength((len*i)/samples);
      const d=Math.hypot(q.x-p.x,q.y-p.y); if(d<best)best=d;
    }
    return best;
  };
  const nearestEdgeId=e=>{
    const p=pointInSvg(e); let winner=null,best=Infinity;
    visibleEdges.forEach(path=>{
      const d=distanceToPath(path,p);
      if(d<best-.15){best=d;winner=path.dataset.edgeId;}
      else if(Math.abs(d-best)<=.15 && path.dataset.edgeId===selectedEdgeId){winner=path.dataset.edgeId;}
    });
    // Keep roughly the same click tolerance on screen at every zoom level.
    const scale=Math.max(.2,Number(getScale?.()||1));
    return best<=(18/scale)?winner:null;
  };
  let hoveredWireId=null;
  const setWireHover=id=>{
    if(hoveredWireId===id)return;
    hoveredWireId=id||null;
    visibleEdges.forEach(x=>x.classList.toggle('wire-hover',Boolean(id)&&x.dataset.edgeId===id));
  };
  const hitPaths=[...els.svg.querySelectorAll('.trace-edge-hit')];
  hitPaths.forEach(path=>{
    path.addEventListener('pointermove',e=>setWireHover(nearestEdgeId(e)));
    path.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      e.preventDefault();e.stopPropagation();
      const id=nearestEdgeId(e);
      if(!id)return;
      setWireHover(id);
      if(e.shiftKey) onEdgeQuickDisconnect?.(id);
      else onEdgeClick?.(id);
    });
    path.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
  });
  els.svg.addEventListener('pointerleave',()=>setWireHover(null));

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
      if(e.target.closest('.node-port,.node-status,.node-type,.node-preview-toggle,.spatial-preview'))return;
      if(el.classList.contains('dragging'))return;
      const now=Date.now(),id=el.dataset.id;
      if(lastNodeActivation.id===id && now-lastNodeActivation.time<360){
        lastNodeActivation={id:null,time:0};
        e.preventDefault();e.stopPropagation();
        onNodeDoubleClick?.(id,e);
        return;
      }
      lastNodeActivation={id,time:now};
      onNodeClick?.(id,e);
    });
    el.addEventListener('contextmenu',e=>{
      e.preventDefault();e.stopPropagation();
      onNodeContext?.(el.dataset.id,e);
    });
    el.querySelector('.node-status')?.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      onNodeStatusClick?.(el.dataset.id,e);
    });
    el.querySelector('.node-type')?.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      onNodeTypeClick?.(el.dataset.id,e);
    });
    el.querySelector('.node-preview-toggle')?.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      onNodePreviewToggle?.(el.dataset.id,e);
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
  const sourceInput=n.type==='input' && n.meta?.source==='brief';
  const baseHelp=nodeGuidance[n.type]?.use||'';
  const help=sourceInput?`${baseHelp} Source Inputs stay tied to the brief.`:`${baseHelp} Click the category label to change this node type.`;
  const ports='<button class="node-port port-in" type="button" aria-label="Connect into this node" title="Drag from here to find a source for this node"></button><button class="node-port port-out" type="button" aria-label="Connect from this node" title="Drag from here to connect this node forward"></button>';
  const previewOpen=n.type==='consequence'&&Boolean(n.meta?.spatialPreviewOpen);
  const previewButton=n.type==='consequence'?`<button type="button" class="node-preview-toggle" aria-expanded="${previewOpen?'true':'false'}" title="Expand a schematic spatial reading of this text">${previewOpen?'Hide spatial read':'Spatial read'} ${previewOpen?'▴':'▾'}</button>`:'';
  const preview=previewOpen?spatialPreviewMarkup(n.label):'';
  return `<article class="graph-node ${selected?'selected':''} ${issue?'trace-open':''} ${locked?'locked':''} ${grouped?'grouped':''} ${previewOpen?'preview-open':''} ${n.status==='rejected'?'rejected':''}" data-id="${n.id}" data-type="${n.type}" data-locked="${locked?'true':'false'}" style="left:${n.x}px;top:${n.y}px">
    ${ports}<div class="node-accent"></div>${locked?'<span class="node-lock-pill" title="Position locked">LOCKED</span>':''}${grouped?'<span class="node-group-pill" title="Moves with its group">GROUP</span>':''}<div class="node-body">
      <div class="node-type has-help" data-help="${escapeHtml(help)}"><i></i>${typeLabels[n.type]||n.type}</div>
      <div class="node-label">${escapeHtml(n.label)}</div>
      ${preview}
      <div class="node-foot"><button type="button" class="node-status has-help" data-help="${escapeHtml(statusHelp)}">${escapeHtml(meta)}${n.type!=='note'&&n.status!=='rejected'?' ▾':''}</button>${previewButton}</div>
    </div></article>`;
}


function spatialPreviewMarkup(text=''){
  const lower=String(text).toLowerCase();
  const has=(...words)=>words.some(w=>lower.includes(w));
  const cues=[];
  if(has('seat','bench','chair','occup'))cues.push('occupation');
  if(has('movable','moveable','flex','rearrang','combine','adapt'))cues.push('reconfiguration');
  if(has('perimeter','edge','boundary'))cues.push('edge');
  if(has('centre','center','central','middle'))cues.push('centre');
  if(has('recess','sunken','lower','level','step'))cues.push('level');
  if(has('open','permeable','visual connection'))cues.push('openness');
  if(has('screen','wall','partition','privacy'))cues.push('screening');
  if(has('roof','canopy','shelter','shade'))cues.push('cover');
  if(has('path','route','circulation','approach','through'))cues.push('movement');
  if(!cues.length)cues.push('spatial relation');

  const plan=[];
  plan.push('<rect x="12" y="12" width="76" height="48" rx="5" class="spatial-zone"/>');
  if(cues.includes('edge')) plan.push('<path d="M18 20 H82 M18 52 H82" class="spatial-heavy"/>');
  if(cues.includes('centre')) plan.push('<ellipse cx="50" cy="36" rx="19" ry="12" class="spatial-soft"/>');
  if(cues.includes('level')) plan.push('<rect x="34" y="24" width="32" height="24" rx="4" class="spatial-dashed"/>');
  if(cues.includes('screening')) plan.push('<path d="M50 16 V56" class="spatial-heavy"/>');
  if(cues.includes('occupation')){
    plan.push('<rect x="22" y="27" width="14" height="6" rx="2" class="spatial-fill"/>');
    plan.push('<rect x="64" y="39" width="14" height="6" rx="2" class="spatial-fill"/>');
  }
  if(cues.includes('movement')) plan.push('<path d="M8 37 C27 30, 70 46, 92 35" class="spatial-arrow" marker-end="url(#arrowPlan)"/>');
  if(cues.includes('reconfiguration')) plan.push('<path d="M31 43 L43 35 M69 29 L58 37" class="spatial-arrow" marker-end="url(#arrowPlan)"/>');
  if(cues.includes('openness')) plan.push('<path d="M12 26 V18 Q12 12 18 12 H29 M71 60 H82 Q88 60 88 54 V46" class="spatial-erase"/>');

  const ax=[];
  ax.push('<path d="M20 45 L50 28 L82 44 L51 61 Z" class="spatial-zone"/>');
  if(cues.includes('cover')) ax.push('<path d="M24 27 L53 11 L80 25 L51 41 Z" class="spatial-heavy"/>');
  if(cues.includes('level')) ax.push('<path d="M38 43 L51 36 L65 43 L51 51 Z M38 43 V50 L51 58 L65 50 V43" class="spatial-dashed"/>');
  if(cues.includes('screening')) ax.push('<path d="M51 28 V56 M51 28 L69 38 V54" class="spatial-heavy"/>');
  if(cues.includes('occupation')){
    ax.push('<path d="M28 43 L38 38 L45 42 L35 48 Z" class="spatial-fill"/>');
    ax.push('<path d="M59 47 L69 42 L76 46 L66 52 Z" class="spatial-fill"/>');
  }
  if(cues.includes('reconfiguration')) ax.push('<path d="M31 56 C39 63 53 64 62 57" class="spatial-arrow" marker-end="url(#arrowAx)"/>');

  return `<div class="spatial-preview" aria-label="Schematic spatial reading">
    <div class="spatial-preview-head"><strong>Possible spatial read</strong><span>schematic · text cues, not a proposed solution</span></div>
    <div class="spatial-preview-grid">
      <figure><svg viewBox="0 0 100 72" aria-label="Plan sketch"><defs><marker id="arrowPlan" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5 Z" class="spatial-marker"/></marker></defs>${plan.join('')}</svg><figcaption>plan sketch</figcaption></figure>
      <figure><svg viewBox="0 0 100 72" aria-label="Simple axonometric sketch"><defs><marker id="arrowAx" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5 Z" class="spatial-marker"/></marker></defs>${ax.join('')}</svg><figcaption>simple 3D</figcaption></figure>
    </div>
    <div class="spatial-cues">${cues.slice(0,4).map(c=>`<span>${escapeHtml(c)}</span>`).join('')}</div>
  </div>`;
}

function edgeMarkup(e,activeNodeId,edges,selectedEdgeId,nodesById,showWireSignals,pilotEvidence){
  const active=isOnActivePath(e,activeNodeId,edges);
  const muted=Boolean(selectedEdgeId && e.id!==selectedEdgeId);
  const source=nodesById.get(e.source),target=nodesById.get(e.target);
  const signal=connectionSignal(source,target,pilotEvidence);
  const signalClass=showWireSignals?`evidence-${signal.band||'neutral'}`:'';
  const isSelected=e.id===selectedEdgeId;
  const halo=isSelected?`<path data-edge-id="${e.id}" class="trace-edge-selection" vector-effect="non-scaling-stroke" d=""/>`:'';
  const visible=`<path data-edge-id="${e.id}" class="trace-edge ${active&&!selectedEdgeId?'active':''} ${isSelected?'selected':''} ${muted?'edge-muted':''} ${signalClass} ${e.status==='rejected'?'rejected':''}" vector-effect="non-scaling-stroke" d=""/>`;
  const hit=`<path data-edge-id="${e.id}" class="trace-edge-hit" vector-effect="non-scaling-stroke" d=""/>`;
  return halo+visible+hit;
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
    if(e.button!==0||e.target.closest('.node-port,.node-status,.node-type,.node-preview-toggle,.spatial-preview'))return;
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
