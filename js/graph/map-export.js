// Stage C: full-bounds graphical exports independent of viewport zoom.
// Every export draws real SVG curves, text and shapes (no foreignObject),
// so SVG and the Chrome Print-to-PDF option remain scalable vectors.
const SVGNS='http://www.w3.org/2000/svg';
const TYPES={input:'#7788b8',interpretation:'#5b57c8',grounding:'#338a95',consequence:'#c78d42',evaluation:'#bf6684',goal:'#4c9a74',note:'#7b8190'};
const escape=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const safeName=s=>String(s||'TRACEWORK').replace(/[^a-z0-9-_]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,52)||'TRACEWORK';
function saveBlob(blob,filename){
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),6000);
}
function wrapText(text,maxWidth,font='13px Arial'){
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font=font;
  const result=[];for(const para of String(text||'').split(/\n/)){
    let row='';for(const word of para.split(/\s+/).filter(Boolean)){
      const candidate=row?row+' '+word:word;
      if(ctx.measureText(candidate).width<=maxWidth){row=candidate;continue;}
      if(row){result.push(row);row='';}
      if(ctx.measureText(word).width<=maxWidth){row=word;continue;}
      // Never truncate long architectural terms; wrap at glyph boundaries.
      let chunk='';for(const char of word){if(chunk && ctx.measureText(chunk+char).width>maxWidth){result.push(chunk);chunk='';}chunk+=char;}row=chunk;
    }result.push(row);
  }return result;
}
function textLines(lines,x,y,lineH,attrs=''){
  return `<text x="${x}" y="${y}" ${attrs}>${lines.map((line,i)=>`<tspan x="${x}" dy="${i?lineH:0}">${escape(line)}</tspan>`).join('')}</text>`;
}
function boundsFor(nodes){
  const left=Math.min(...nodes.map(n=>n.x)),top=Math.min(...nodes.map(n=>n.y));
  const right=Math.max(...nodes.map(n=>n.x+n.w)),bottom=Math.max(...nodes.map(n=>n.y+n.h));
  const pad=48;return {left:left-pad,top:top-pad,width:right-left+pad*2,height:bottom-top+pad*2};
}
function nodeData(root){
  return [...root.querySelectorAll('.graph-node')].map(el=>{
    const label=el.querySelector('.node-label')?.textContent?.trim()||'Untitled reasoning move';
    const role=el.querySelector('.node-type')?.textContent?.trim()||el.dataset.type||'Node';
    const status=el.querySelector('.node-status')?.textContent?.trim()||'';
    return {id:el.dataset.id||'',type:el.dataset.type||'note',label,role,status,
      x:el.offsetLeft,y:el.offsetTop,w:Math.max(210,el.offsetWidth||230),
      h:Math.max(92,el.offsetHeight||92,34+wrapText(role,el.offsetWidth-34,'700 11px Arial').length*13+wrapText(label,el.offsetWidth-30,'600 13px Arial').length*19+27),rejected:el.classList.contains('rejected'),
      selected:el.classList.contains('selected'),locked:el.classList.contains('locked'),
      artifactKind:el.dataset.artifact||'',imageData:el.querySelector('.node-artifact-image')?.getAttribute('src')||'',
      excerpt:el.querySelector('.node-artifact-excerpt')?.textContent||''};
  });
}
// Presentation-only layout. The editor's node coordinates are NEVER modified.
// Levels follow the actual reasoning wires rather than assuming every project
// uses the same six-stage, forward-only grammar.
function presentationLayout(nodes,edges){
  const byId=new Map(nodes.map(n=>[n.id,n]));
  const indegree=new Map(nodes.map(n=>[n.id,0]));
  const outgoing=new Map(nodes.map(n=>[n.id,[]]));
  const incoming=new Map(nodes.map(n=>[n.id,[]]));
  edges.forEach(e=>{
    if(!byId.has(e.source)||!byId.has(e.target)||e.source===e.target)return;
    outgoing.get(e.source).push(e.target);incoming.get(e.target).push(e.source);
    indegree.set(e.target,indegree.get(e.target)+1);
  });
  const typeOrder={input:0,interpretation:1,grounding:2,consequence:3,evaluation:4,goal:5,note:2};
  const originalOrder=(a,b)=>a.y-b.y || a.x-b.x || a.id.localeCompare(b.id);
  const queue=nodes.filter(n=>indegree.get(n.id)===0).sort(originalOrder);
  const ranks=new Map(nodes.map(n=>[n.id,0]));
  const consumed=new Set();
  while(queue.length){
    const n=queue.shift();if(consumed.has(n.id))continue;consumed.add(n.id);
    for(const target of outgoing.get(n.id)){
      ranks.set(target,Math.max(ranks.get(target)||0,(ranks.get(n.id)||0)+1));
      indegree.set(target,indegree.get(target)-1);
      if(indegree.get(target)===0){queue.push(byId.get(target));queue.sort(originalOrder);}
    }
  }
  // Cycles are legitimate in a recursive design trace; place their remaining
  // nodes by node role instead of creating an infinite rank/position loop.
  for(const n of nodes)if(!consumed.has(n.id))ranks.set(n.id,typeOrder[n.type]??2);
  // Extremely deep traces are legible as a bounded set of columns rather
  // than an indefinitely long, tiny map on an A3 sheet.
  for(const [id,r] of ranks)ranks.set(id,Math.min(9,r));
  const columns=new Map();
  for(const n of nodes){const rank=ranks.get(n.id)||0;if(!columns.has(rank))columns.set(rank,[]);columns.get(rank).push(n);}
  const result=[];const located=new Map();let x=72;
  for(const rank of [...columns.keys()].sort((a,b)=>a-b)){
    const group=columns.get(rank);
    group.sort((a,b)=>{
      const avg=n=>{
        const preds=incoming.get(n.id).filter(id=>located.has(id));
        return preds.length?preds.reduce((sum,id)=>sum+located.get(id).y,0)/preds.length:n.y;
      };
      return avg(a)-avg(b)||originalOrder(a,b);
    });
    let y=105;const width=Math.max(240,...group.map(n=>n.w));
    for(const n of group){
      const placed={...n,x,y};result.push(placed);located.set(n.id,placed);
      y+=n.h+58;
    }
    x+=width+115;
  }
  return result;
}
function wireCurve(a,b){
  const x1=a.x+a.w,y1=a.y+a.h/2,x2=b.x,y2=b.y+b.h/2;
  const dx=Math.max(50,Math.abs(x2-x1)*.45),direction=x2>=x1?1:-1;
  return `M ${x1} ${y1} C ${x1+dx*direction} ${y1}, ${x2-dx*direction} ${y2}, ${x2} ${y2}`;
}
function svgSnapshot({surface,edges,projectEdges=[],projectName,viewLabel,frameworkLabel,omitRejected=false,arrange=true}){
  const original=nodeData(surface);
  const filtered=omitRejected?original.filter(n=>!n.rejected):original;
  if(!filtered.length)throw Error('No nodes remain with these export settings. Uncheck Hide rejected pathways.');
  const nodeIds=new Set(filtered.map(n=>n.id));
  const pathById=new Map([...edges.querySelectorAll('path.trace-edge:not(.draft-connection)')].map(p=>[p.dataset.edgeId,p]));
  const edgeData=projectEdges.filter(e=>nodeIds.has(e.source)&&nodeIds.has(e.target)&&(!omitRejected||e.status!=='rejected')&&pathById.has(e.id));
  const nodes=arrange?presentationLayout(filtered,edgeData):filtered;
  const byId=new Map(nodes.map(n=>[n.id,n]));
  const box=boundsFor(nodes),width=Math.ceil(box.width),height=Math.ceil(box.height+66);
  const title=String(projectName||'TRACEWORK reasoning map');
  const wires=edgeData.map(e=>{
    const p=pathById.get(e.id),st=getComputedStyle(p);
    const d=arrange?wireCurve(byId.get(e.source),byId.get(e.target)):p.getAttribute('d');
    if(!d)return '';
    // Export the visual status texture and pilot recurrence grade actually shown on the canvas.
    const width=Math.max(1,Math.min(5,parseFloat(st.strokeWidth)||2.1));
    const opacity=Math.max(.2,Math.min(1,parseFloat(st.opacity)||.85));
    return `<path d="${escape(d)}" fill="none" stroke="${escape(st.stroke&&st.stroke!=='none'?st.stroke:'#798293')}" stroke-width="${width}" opacity="${opacity}"${st.strokeDasharray&&st.strokeDasharray!=='none'?` stroke-dasharray="${escape(st.strokeDasharray)}"`:''}/>`;
  }).join('');
  const cards=nodes.map(n=>{
    if(n.artifactKind){
      const role=n.artifactKind==='architectural-proposition'?'Architectural Proposition':'Reasoning Digest';
      const label=wrapText(n.label,n.w-28,'600 13px Arial').slice(0,3);
      const image=n.imageData?.startsWith('data:image/png;base64,')?`<image x="12" y="66" width="${n.w-24}" height="${Math.max(75,n.h-112)}" preserveAspectRatio="xMidYMid meet" href="${escape(n.imageData)}"/>`:'';
      return `<g transform="translate(${n.x},${n.y})"><rect width="${n.w}" height="${n.h}" rx="12" fill="#1d2730" stroke="#73b5b4" stroke-width="1.5"/>
      <text x="14" y="23" fill="#a5dcda" font-size="12" font-weight="700" font-family="Arial">${escape(role)}</text>
      ${textLines(label,14,43,15,'font-family="Arial" font-size="13" fill="#f4f8f8"')}
      ${image||textLines(wrapText(n.excerpt||'Recorded reasoning digest',n.w-26,'12px Arial').slice(0,7),14,92,18,'font-family="Arial" font-size="12" fill="#c5d8dc"')}</g>`;
    }
    const c=TYPES[n.type]||TYPES.note;
    const label=wrapText(n.label,n.w-30,'600 13px Arial');
    const role=wrapText(n.role,n.w-34,'700 11px Arial');
    const labelY=24+(role.length-1)*13+25;
    const h=n.h;
    const status=n.rejected?'Rejected':n.locked?'Locked':n.status;
    return `<g transform="translate(${n.x},${n.y})" opacity="${n.rejected?'.54':'1'}">
      <rect width="${n.w}" height="${h}" rx="12" fill="#ffffff" stroke="${c}" stroke-opacity="${n.selected?'.75':'.30'}" stroke-width="${n.selected?2.2:1}"/>
      <rect width="5" height="${h-20}" x="0" y="10" rx="2.5" fill="${c}"/>
      ${textLines(role,16,22,13,`font-family="Arial, sans-serif" font-weight="700" font-size="11" fill="${c}"`)}
      ${textLines(label,16,labelY,19,`font-family="Arial, sans-serif" font-weight="600" font-size="13" fill="#1e293b"`)}
      ${status?`<text x="16" y="${h-12}" font-family="Arial, sans-serif" font-size="10" fill="#697384">${escape(status)}</text>`:''}
    </g>`;
  }).join('');
  const contentH=Math.max(height,...nodes.map(n=>n.y+n.h-box.top+48));
  const mode=arrange?'Auto-arranged export':'Current layout';
  const rejection=omitRejected?' • Rejected pathways hidden':'';
  const markup=`<svg xmlns="${SVGNS}" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${contentH}" viewBox="0 0 ${width} ${contentH}" role="img" aria-label="${escape(title)}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="32" y="29" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#24283b">${escape(title)}</text>
  <text x="32" y="48" font-family="Arial,sans-serif" font-size="11" fill="#64748b">TRACEWORK • ${escape(viewLabel)} • ${escape(frameworkLabel)} • ${mode}${rejection} • ${nodes.length} nodes</text>
  <g transform="translate(${-box.left},${-box.top+66})">${wires}${cards}</g>
  </svg>`;
  return {svg:markup,width,height:contentH,count:nodes.length,hiddenCount:original.length-filtered.length,wireCount:edgeData.length,title};
}
export function createMapSnapshot({surface,edges,projectEdges=[],projectName,viewLabel,frameworkLabel,omitRejected=false,arrange=true}){
  return svgSnapshot({surface,edges,projectEdges,projectName,viewLabel,frameworkLabel,omitRejected,arrange});
}
export function exportMapSVG(snap){saveBlob(new Blob([snap.svg],{type:'image/svg+xml;charset=utf-8'}),safeName(snap.title)+'-map.svg');}
export async function exportMapPNG(snap,{scale=2}={}){
  let k=Math.min(scale,8192/Math.max(snap.width,snap.height),Math.sqrt(24_000_000/(snap.width*snap.height)));
  k=Math.max(.1,k);
  const canvas=document.createElement('canvas');canvas.width=Math.round(snap.width*k);canvas.height=Math.round(snap.height*k);
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Browser could not create the image canvas.');
  const url=URL.createObjectURL(new Blob([snap.svg],{type:'image/svg+xml;charset=utf-8'}));
  try{
    const img=new Image();img.decoding='sync';await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('SVG could not be rendered into PNG.'));img.src=url;});
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));
    if(!blob)throw Error('PNG generation failed.');saveBlob(blob,safeName(snap.title)+'-map.png');
  }finally{URL.revokeObjectURL(url);}
}
export function exportMapPDF(snap){
  // Print the SVG as native vector graphics; Chrome keeps lines/text scalable.
  // A user gesture opens the window; choose 'Save as PDF' in the print dialog.
  const win=window.open('','_blank');if(!win)throw Error('Allow pop-ups for this site to export a vector PDF.');
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${escape(snap.title)} - TRACEWORK map PDF</title><style>
  @page{size:A3 landscape;margin:9mm}
  html,body{margin:0;background:white;font-family:Arial,sans-serif}main{width:100%;height:auto}
  main svg{width:100%;height:auto;display:block;max-width:100%;max-height:188mm}
  .hint{padding:12px 16px;font-size:13px;color:#445;max-width:900px}
  @media print{.hint{display:none}main svg{max-height:275mm}}
  </style></head><body><div class="hint">Vector PDF: choose <strong>Save as PDF</strong> in the print dialog. Use A3 landscape for dense maps. Close this tab after saving.</div><main>${snap.svg}</main><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300));<\/script></body></html>`;
  win.document.open();win.document.write(html);win.document.close();
  return true;
}
