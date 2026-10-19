// TRACEWORK — architectural propositions; client-side, source-aware procedural axonometry.
// Outputs are interpretive schemes, not computationally validated building designs or AI renders.
const ESC=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const str=s=>String(s??'');
const cueSets={
  seating:/seat|bench|chair|sit|occup|gather|group|forum|discussion|social/i,
  privacy:/privac|screen|partition|separat|quiet|individual|acoustic|enclos|retreat/i,
  circulation:/circulat|route|path|walk|access|move|movement|flow|unobstruct|entrance/i,
  shelter:/shelter|shade|roof|canopy|rain|cover/i,
  flexible:/flexib|movable|moveable|reconfig|adapt|modular|transform/i,
  vegetation:/tree|green|plant|landscape|garden|nature/i,
  daylight:/daylight|light|ventilat|breeze|airflow|open/i,
  stepped:/terrac|step|amphi|tier|level|platform/i,
  courtyard:/courtyard|central|court|middle|open core/i
};
const meaningful=n=>n && n.meta?.artifactKind!=='architectural-proposition' && n.meta?.artifactKind!=='reasoning-digest';
const active=n=>n.status!=='rejected';
export function spatialCues(nodes=[],brief=''){
  const source=nodes.map(n=>n.label).join(' ')+' '+str(brief).slice(0,650);
  return Object.fromEntries(Object.entries(cueSets).map(([k,re])=>[k,re.test(source)]));
}
function briefType(text){let t=str(text).toLowerCase();return /pavilion|shelter|canopy/.test(t)?'Pavilion':/library|reading room/.test(t)?'Library':/house|housing|resident|dwelling|apartment/.test(t)?'Housing':/classroom|school|learning/.test(t)?'Learning space':/public space|plaza|park/.test(t)?'Public space':'Architectural';}
export function supportedOptions(state,scoped,max=3){
  const nodes=(scoped?.nodes||state.nodes||[]).filter(meaningful),edges=(scoped?.edges||state.edges||[]);
  const candidates=[];
  const branchIds=[...new Set(nodes.filter(n=>n.type!=='input'&&n.type!=='note').map(n=>n.branchId||'branch-1'))];
  const inputNodes=nodes.filter(n=>n.type==='input');
  for(const bid of branchIds){
    const branch=nodes.filter(n=>n.branchId===bid&&n.type!=='input');
    if(!branch.length)continue;
    const ids=new Set(branch.map(n=>n.id));
    const ancestors=inputNodes.filter(n=>edges.some(e=>e.source===n.id && ids.has(e.target))|| n.branchId===bid);
    const subset=[...ancestors,...branch];
    if(!subset.some(n=>n.type==='consequence'||spatialCues([n]).seating||spatialCues([n]).privacy))continue;
    const nonrejected=branch.filter(active);
    const types=new Set(nonrejected.map(n=>n.type));
    const cues=spatialCues(subset);
    const specificity=Object.values(cues).filter(Boolean).length;
    // Documentary completeness, not spatial quality or user performance.
    const score=types.size*2 + Math.min(6,nonrejected.length) + Math.min(5,specificity) + nonrejected.filter(n=>['evaluation','goal'].includes(n.type)).length;
    const title=branch.find(n=>n.type==='consequence'&&active(n))?.label||branch.find(n=>active(n))?.label||'Working branch';
    candidates.push({id:bid,title: title.slice(0,100),nodes:subset,edges:edges.filter(e=>subset.some(n=>n.id===e.source)&&subset.some(n=>n.id===e.target)),score,documentedNodes:nonrejected.length,sourceIds:subset.map(n=>n.id),rejected:branch.every(n=>!active(n))});
  }
  candidates.sort((a,b)=>b.score-a.score||b.documentedNodes-a.documentedNodes||a.id.localeCompare(b.id));
  if(!candidates.length && nodes.length){return [{id:'visible-trace',title:nodes.find(n=>n.type==='consequence')?.label||'Visible reasoning',nodes,edges,sourceIds:nodes.map(n=>n.id),score:0,documentedNodes:nodes.length}];}
  return candidates.slice(0,max);
}
export function makePropositionSpec({state,scoped,mode='focus-map',option=null,ordinal=1}){
  const input=(option?.nodes||scoped?.nodes||[]).filter(meaningful);
  const included=input.length?input:(state.nodes||[]).filter(meaningful);
  const cues=spatialCues(included,state.brief);
  const architecture=briefType(state.brief);
  const local=spatialCues(included,'');
  // Variations are selected from architectural evidence first. Unresolved moves are assumptions.
  const concept=local.privacy?'Screened zones':local.stepped?'Stepped forum':local.flexible?'Reconfigurable canopy':local.courtyard?'Open central court':local.seating?'Shared seating pavilion':'Open structural canopy';
  const variation=local.privacy?'screened':local.stepped?'stepped':local.flexible?'flexible':local.courtyard?'courtyard':local.seating?'seating':'open';
  const title=`${architecture} · ${concept}`;
  const features=[
    ['Shelter',cueSets.shelter,'Roof canopy / structural cover',cues.shelter],
    ['Occupation',cueSets.seating,'Seating and gathering layout',cues.seating],
    ['Spatial division',cueSets.privacy,'Adjustable privacy screens',cues.privacy],
    ['Movement',cueSets.circulation,'Clear circulation spine',cues.circulation],
    ['Adaptation',cueSets.flexible,'Reconfigurable furnishing',cues.flexible]
  ];
  const annotations=features.map(([heading,re,form,cued])=>{
    const match=included.find(n=>active(n)&&re.test(n.label))||included.find(n=>re.test(n.label));
    return {heading,form,sourceId:match?.id||null,sourceText:match?.label||'',status:match?'Reasoning cue recorded; architectural form inferred':'Added as a visual assumption',grounded:Boolean(match),used:Boolean(cued)||heading==='Shelter'||heading==='Movement'};
  }).filter(x=>x.used||x.grounded).slice(0,5);
  const recordedClaims=annotations.filter(a=>a.grounded).length;
  return {id:`prop-${Date.now()}-${ordinal}`,title,concept,variation,mode,ordinal,architecture,
    cues,annotations,sourceIds:[...new Set(included.map(n=>n.id))],branchId:option?.id||null,
    documentedScore:option?.score??null,recordedClaims,assumptions:annotations.filter(a=>!a.grounded).map(a=>a.form),
    note:'Exploratory architectural scheme. Geometry, structural adequacy, dimensions, capacity and accessibility require designer verification.',
    frameworkId:state.frameworkId||'tracework'};
}
const P=(x,y,z=0)=>[Math.round(362+(x-y)*26),Math.round(222+(x+y)*14-z*34)];
const pts=a=>a.map(q=>P(...q).join(',')).join(' ');
const poly=(coords,fill,stroke='#455469',sw=1.3,extras='')=>`<polygon points="${pts(coords)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" ${extras}/>`;
const line=(a,b,stroke='#506478',width=2,attrs='')=>`<path d="M ${P(...a).join(' ')} L ${P(...b).join(' ')}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" fill="none" ${attrs}/>`;
function cuboid(x,y,z,w,d,h,color='#d9c7aa'){
  return poly([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],color,'#6e7c89',.8)
    +poly([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],'#8999a5','#56636e',.7)
    +poly([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],'#b9c4c9','#56636e',.7);
}
function wrapSvg(s,width=40,maxLines=3){
 const words=str(s).split(/\s+/);let lines=[],row='';for(const w of words){if((row+' '+w).trim().length>width&&row){lines.push(row);row=w;}else row=(row+' '+w).trim();}if(row)lines.push(row);if(lines.length>maxLines){lines=lines.slice(0,maxLines);lines[maxLines-1]=lines[maxLines-1].slice(0,width-2)+'…';}return lines;
}
function svgTspans(txt,x,y,color='#263847',max=45,lineHeight=17,fontSize=13,maxLines=3){return `<text x="${x}" y="${y}" fill="${color}" font-family="Arial,sans-serif" font-size="${fontSize}">${wrapSvg(txt,max,maxLines).map((t,i)=>`<tspan x="${x}" dy="${i?lineHeight:0}">${ESC(t)}</tspan>`).join('')}</text>`;}
export function renderPropositionSVG(spec,{width=1080,height=760}={}){
 const c=spec.cues,mode=spec.variation;
 let floor=poly([[0,0,-.24],[10,0,-.24],[10,10,-.24],[0,10,-.24]],'#d6e1db','#bbc8c6',1)+poly([[0,0,0],[10,0,0],[10,10,0],[0,10,0]],'#f1f0e9','#9aaaac',1.5);
 for(let i=1;i<10;i++){floor+=line([i,0,.02],[i,10,.02],'#cfdad7',.65)+line([0,i,.02],[10,i,.02],'#cfdad7',.65);}
 let space='';
 // A site-scale route is visible in every suggestion; its need to be confirmed is disclosed.
 space+=poly([[4.3,0,.06],[5.7,0,.06],[5.7,10,.06],[4.3,10,.06]],'#dceadf','#b9cbc0',.7,'opacity=".92"');
 space+=line([5,0,.09],[5,10,.09],'#7a9b9c',2,'stroke-dasharray="5 5"');
 const screens=mode==='screened'||c.privacy;
 if(screens){
   for(let y of [1.2,3.9,6.6]){
     space+=poly([[1.0,y,0],[3.7,y,0],[3.7,y,2.2],[1.0,y,2.2]],'#bdcbd1','#6c8090',1.1,'opacity=".80"');
     for(let xx=1.5;xx<3.7;xx+=.5)space+=line([xx,y,.15],[xx,y,2.0],'#879ea3',.7);
   }
   space+=poly([[6.2,5.8,0],[9.2,5.8,0],[9.2,5.8,2],[6.2,5.8,2]],'#d8dad5','#8198a2',1,'opacity=".72"');
 }
 const terraced=mode==='stepped';
 if(terraced){for(let k=0;k<3;k++)space+=cuboid(.7,1.1+k*1.25,0,3.3,.72,.24+k*.14,'#d3b99a');}
 // Recognisable seats, tables and circulation infrastructure, laid out in the project.
 for(let row=0;row<3;row++){
   const yy=1.1+row*2.7;
   if(mode==='courtyard' && row===1)continue;
   space+=cuboid(6.2,yy,.05,2.35,.52,.46,'#b8a586');
   space+=cuboid(6.42,yy-.14,.54,1.9,.16,.52,'#aa9677');
   if(c.seating||row!==1) space+=cuboid(6.5,yy+1.1,.05,1.5,.78,.62,'#d3c6aa');
 }
 if(mode==='flexible'){
  for(let k=0;k<3;k++)space+=cuboid(1.2+k*.75,7.15,.05,.48,1.2,.42,'#a9bcb9');
 }
 if(c.vegetation){for(const [x,y] of [[.6,8.7],[8.9,.7]]){space+=cuboid(x,y,0,.5,.5,.24,'#8ab09b');space+=`<circle cx="${P(x+.25,y+.25,2.2)[0]}" cy="${P(x+.25,y+.25,2.2)[1]}" r="19" fill="#8fb6a5" opacity=".72"/>`;}}
 // Small scale figures make enclosure, ceiling height and route occupation legible.
 const people=[[4.9,1.4],[5.25,7.6]];
 for(const [hx,hy] of people){
   const [px,py]=P(hx,hy,1.6),[footX,footY]=P(hx,hy,.12);
   space+=`<circle cx="${px}" cy="${py-7}" r="5" fill="#617b84"/>`;
   space+=`<path d="M ${px} ${py-1} L ${footX} ${footY-9} M ${footX} ${footY-9} l -7 10 M ${footX} ${footY-9} l 7 10" fill="none" stroke="#617b84" stroke-width="3" stroke-linecap="round"/>`;
 }
 let cols='';for(const [x,y] of [[.8,.8],[9.2,.8],[9.2,9.2],[.8,9.2]]){
  cols+=line([x,y,.06],[x,y,3.55],'#405d70',6)+line([x+.1,y,.06],[x+.1,y,3.55],'#a9c3c7',2);
  cols+=poly([[x-.27,y-.27,0],[x+.27,y-.27,0],[x+.27,y+.27,0],[x-.27,y+.27,0]],'#87999e','#536a7b',.7);
 }
 let roof='';
 if(mode==='courtyard'){
   roof+=poly([[.3,.3,3.55],[9.7,.3,3.55],[9.7,2.5,3.55],[.3,2.5,3.55]],'#c1d5d8','#526d7b',1.5,'opacity=".78"');
   roof+=poly([[.3,7.7,3.55],[9.7,7.7,3.55],[9.7,9.7,3.55],[.3,9.7,3.55]],'#c1d5d8','#526d7b',1.5,'opacity=".78"');
   roof+=poly([[.3,2.5,3.55],[2.8,2.5,3.55],[2.8,7.7,3.55],[.3,7.7,3.55]],'#c1d5d8','#526d7b',1.5,'opacity=".78"');
   roof+=poly([[7.2,2.5,3.55],[9.7,2.5,3.55],[9.7,7.7,3.55],[7.2,7.7,3.55]],'#c1d5d8','#526d7b',1.5,'opacity=".78"');
 } else {
   roof+=poly([[.3,.3,3.55],[9.7,.3,3.7],[9.7,9.7,3.55],[.3,9.7,3.4]],'#c0d8dc','#536e7f',2,'opacity=".60"');
   for(let j=1;j<=6;j++)roof+=line([j*1.4,.4,3.6],[j*1.4,9.6,3.6],'#668795',1.5,'opacity=".65"');
   roof+=poly([[.3,9.7,3.4],[9.7,9.7,3.55],[9.7,9.7,3.37],[.3,9.7,3.22]],'#708f9e','#536e7f',1.3);
 }
 roof+=line([.3,.3,3.55],[9.7,.3,3.7],'#526f7d',2.5)+line([9.7,.3,3.7],[9.7,9.7,3.55],'#526f7d',2.5);
 const markerLocations={'Shelter':P(1.1,1.1,3.5),'Occupation':P(7.2,2.4,.7),'Spatial division':P(2.1,3.9,1.7),'Movement':P(5,5,.1),'Adaptation':P(7.1,7.4,.55)};
 const annotations=spec.annotations.slice(0,4);
 const markers=annotations.map((a,i)=>({num:i+1,p:markerLocations[a.heading]||P(5,5,.2)}));
 let dots=markers.map(m=>`<circle cx="${m.p[0]}" cy="${m.p[1]}" r="12" fill="#fff" stroke="#203d51" stroke-width="2"/><text x="${m.p[0]}" y="${m.p[1]+4.5}" text-anchor="middle" font-size="12" font-weight="700" font-family="Arial" fill="#203d51">${m.num}</text>`).join('');
 let notes=annotations.map((a,i)=>{const y=192+i*118; const badge=a.grounded?'REASONING CUE RECORDED':'VISUAL ASSUMPTION';return `<rect x="735" y="${y}" width="320" height="105" rx="12" fill="#ffffff" stroke="#dee5e9"/>
 <circle cx="755" cy="${y+23}" r="12" fill="#183e53"/><text x="755" y="${y+27}" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">${i+1}</text>
 <text x="777" y="${y+28}" font-family="Arial" font-size="15" font-weight="700" fill="#243c4b">${ESC(a.heading)}</text>
 ${svgTspans(a.form,753,y+50,'#465a66',40,16,11,1)}
 ${svgTspans(a.grounded?a.sourceText:'Geometry is illustrative',753,y+66,'#6c7b83',46,13,10,2)}
 <text x="753" y="${y+96}" font-family="Arial" font-size="10" letter-spacing=".7" fill="${a.grounded?'#28786f':'#a47436'}">${badge}</text>`;}).join('');
 const legend=spec.annotations.map(a=>`• ${a.heading}: ${a.grounded?'recorded statement':'visual assumption'}${a.grounded?' — '+a.sourceText.slice(0,80):''}`).join('\n');
 const title=`${spec.architecture} · ${spec.concept}`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1080 760" role="img" aria-label="${ESC(title)} — TRACEWORK architectural axonometric concept">
 <rect width="1080" height="760" fill="#f5f7f7"/>
 <path d="M 0 100 H 1080" stroke="#d8e2e6"/>
 <text x="45" y="39" font-family="Arial" font-size="13" letter-spacing="2" fill="#52778b">TRACEWORK  /  ARCHITECTURAL PROPOSITION</text>
 ${svgTspans(title,45,76,'#1b3443',72,20,25,1)}
 <text x="45" y="124" font-family="Arial" font-size="12" fill="#657986">CONCEPT AXONOMETRIC  ·  SCHEMATIC  ·  NOT TO SCALE</text>
 <rect x="28" y="148" width="683" height="533" rx="16" fill="#e9eff0" stroke="#d7e0e3"/>
 <path d="M 42 583 L 698 255" stroke="#ffffff" stroke-width=".8" opacity=".45"/>
 <g transform="translate(12,65)">${floor}${space}${cols}${roof}${dots}</g>
 <text x="48" y="651" font-family="Arial" font-size="12" fill="#596f7c">FORMED SPATIAL SUGGESTION  ·  Verify dimensions, capacity, access and structure</text>
 <text x="735" y="156" font-family="Arial" font-size="12" font-weight="700" letter-spacing="1" fill="#566e7d">ARCHITECTURAL MOVES / SOURCES</text>
 ${notes}
 <rect x="32" y="706" width="1016" height="35" rx="8" fill="#e3eceb"/><text x="48" y="728" font-size="12" font-family="Arial" fill="#315269">Designer to test: ${ESC(spec.note.slice(0,142))}</text>
 <title>${ESC(legend)}</title></svg>`;
}
export function propositionMarkdown(spec){
 return `# ${spec.title}\n\n**View:** ${spec.mode.replaceAll('-',' ')}\n**Framework:** ${spec.frameworkId}\n**Status:** Suggested architectural proposition — NOT a recorded participant drawing or verified design.\n\n## Architectural moves and provenance\n${spec.annotations.map((a,i)=>`${i+1}. **${a.heading} — ${a.form}**\n   - ${a.grounded?`Recorded thought (${a.sourceId}): ${a.sourceText}`:'Visual assumption; no direct recorded statement'}`).join('\n')}\n\n## Required verification\n${spec.note}\n\nThe conceptual axonometric is a rule-based interpretation of recorded language. It is not a generated building information model, a structural simulation, or a certified architectural design.\n`;
}
