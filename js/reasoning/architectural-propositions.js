// TRACEWORK D2.4 — evidence-led pavilion assembly and differentiated architectural form studies.
// Geometry is authored procedurally, in the browser, from statements and links in the user's trace.
// No request is made to a third-party service and no generated proposal is attributed to a participant.
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=x=>String(x??'');
const sourceNode=n=>n && !['architectural-proposition','reasoning-digest'].includes(n.meta?.artifactKind);
const live=n=>n.status!=='rejected';
const spatialRoles=new Set(['consequence','evaluation','interpretation','grounding','goal','note']);
const patterns={
  movement:/circulat|unobstruct|through.route|main route|pass through|movement|walkway|passage|spine|access|continuous route/i,
  privacy:/privac|screen|partition|recess|enclos|quiet|separat|exposur|surveill|acoustic|gradient/i,
  capacity:/additional (?:users|seats)|peak (?:capacity|period|demand)|deployable|perimeter seat|fixed seating|twenty|20 seats|footprint|overflow/i,
  climate:/ventilat|breeze|porous|visually open|open perimeter|sun|rain|shade|broad roof|roof|weather|climat|airflow|heat/i,
  duration:/duration|short paus|longer|two.minute|one.hour|quick.access|quick access|perch|waiting|deep(?:er)? in/i,
  social:/individual|small group|quieter edge|adaptable central|collective|study|conversation|gather|coexist|group use/i,
  pockets:/several small|occupation zones|multiple zones|eating|chatting|leaning|varied use|micro.space|pause/i,
  court:/courtyard|open core|central court|perimeter courtyard|internal garden/i,
  tier:/terrac|tier|stepped|amphi|raised platform|level change/i,
  adaptable:/movable|moveable|reconfigur|modular|transform|sliding|folding|rotating|adaptabl/i,
  greenery:/trees|landscape|garden|planting|greenery|existing vegetation/i
};
const named={movement:'Clear-spine pavilion',privacy:'Privacy-gradient pavilion',capacity:'Expandable-occupation pavilion',climate:'Porous climatic pavilion',duration:'Temporal-zoning pavilion',social:'Individual / collective pavilion',pockets:'Distributed-pause pavilion',court:'Courtyard pavilion',tier:'Terraced forum',adaptable:'Reconfigurable pavilion',generic:'Open shelter study'};
const formLabels={movement:'Clear route with edge occupation',privacy:'Graduated screens and recessed seating',capacity:'Fixed perimeter + deployable seats',climate:'Ventilated canopy, open perimeter and selective shade',duration:'Quick perches at entry, longer-stay seating deeper within',social:'Quiet individual edge with shared central forum',pockets:'Multiple small occupation pockets',court:'Roof surrounding an open central court',tier:'Tiered occupation',adaptable:'Loose-fit reconfigurable arrangement',generic:'Undetermined spatial arrangement'};
function decisive(nodes){return nodes.filter(n=>live(n)&&['consequence','interpretation','note'].includes(n.type));}
function scoreStrategies(nodes){
  const strategies=Object.keys(named).filter(k=>k!=='generic');
  const scores=Object.fromEntries(strategies.map(k=>[k,0]));
  const sources=Object.fromEntries(strategies.map(k=>[k,[]]));
  // Spatial CONSEQUENCES, not the project-wide brief, determine form. A trade-off cannot create a new architectural feature.
  for(const n of nodes.filter(live)){
    const weight= n.type==='consequence'?8:n.type==='interpretation'?4:n.type==='note'?3:n.type==='goal'?1.5:n.type==='grounding'?1:0;
    if(!weight)continue;
    for(const k of strategies){
      if(patterns[k].test(n.label||'') && !(k==='privacy' && /(?:without|avoid|never|no|do not use|don't use|instead of)\s+(?:any\s+)?(?:screens?|partitions?|walls?|enclosures?)/i.test(n.label||''))){
        scores[k]+=weight;
        if(n.type==='consequence'||n.type==='interpretation'||n.type==='note')sources[k].push(n);
      }
    }
  }
  // Priority is conditional on documentary specificity rather than aesthetic preference.
  const ordered=Object.keys(scores).sort((a,b)=>scores[b]-scores[a]||strategies.indexOf(a)-strategies.indexOf(b));
  const choice=ordered[0]&&scores[ordered[0]]>=3?ordered[0]:'generic';
  return {choice,scores,sources,ordered};
}
function buildingType(brief){const b=text(brief).toLowerCase();return /pavilion|canopy|shelter/.test(b)?'Pavilion':/library/.test(b)?'Library':/house|housing|dwelling/.test(b)?'Housing':/school|classroom/.test(b)?'Learning space':/plaza|public space|park/.test(b)?'Public realm':'Architectural project';}
function optionScore(nodes,edges){
  const kept=nodes.filter(n=>live(n)&&n.type!=='input');
  const types=new Set(kept.map(n=>n.type));
  const relevant=kept.filter(n=>n.type==='consequence');
  const scored={spatialMove:Math.min(6,relevant.length*3),grounding:types.has('grounding')?2:0,interpretation:types.has('interpretation')?1:0,evaluation:types.has('evaluation')?2:0,goal:types.has('goal')?1:0,links:Math.min(4,edges.filter(e=>e.status!=='rejected'&&!e.meta?.artifact).length),specificity:scoreStrategies(kept).choice==='generic'?0:2};
  return {score:Object.values(scored).reduce((a,b)=>a+b,0),criteria:scored};
}
function pathFromRoot(root,nodes,edges){
  const byId=new Map(nodes.map(n=>[n.id,n]));const parents=new Map(),children=new Map();
  for(const e of edges.filter(e=>e.status!=='rejected'&&!e.meta?.artifact&&byId.has(e.source)&&byId.has(e.target))){
    if(!parents.has(e.target))parents.set(e.target,[]);parents.get(e.target).push(e.source);
    if(!children.has(e.source))children.set(e.source,[]);children.get(e.source).push(e.target);
  }
  const ids=new Set([root.id]),q=[root.id];
  while(q.length){for(const p of parents.get(q.shift())||[])if(!ids.has(p)){ids.add(p);q.push(p);}}
  // Include downstream of the chosen move, but never propagate through shared input to unrelated branches.
  const d=[root.id];while(d.length){for(const child of children.get(d.shift())||[])if(!ids.has(child)){ids.add(child);d.push(child);}}
  const scoped=nodes.filter(n=>ids.has(n.id));return {nodes:scoped,edges:edges.filter(e=>ids.has(e.source)&&ids.has(e.target))};
}
export function supportedOptions(state,scoped,max=12,{selectedRootId=null}={}){
  const nodes=(scoped?.nodes||state.nodes||[]).filter(sourceNode),edges=(scoped?.edges||state.edges||[]).filter(e=>!e.meta?.artifact);
  const working=nodes.filter(n=>n.type!=='input'&&live(n));
  if(!working.length)return [];
  const branchMap=new Map();
  for(const n of working){const k=n.branchId||'untagged';if(!branchMap.has(k))branchMap.set(k,[]);branchMap.get(k).push(n);}
  let groups=[];
  // Branch IDs matter if they genuinely delineate different reasoning routes.
  if(branchMap.size>1){
    for(const [id,part] of branchMap){
      const ids=new Set(part.map(n=>n.id)),inputs=nodes.filter(n=>n.type==='input'&&edges.some(e=>e.source===n.id&&ids.has(e.target)));
      const selected=[...inputs,...part];const selIds=new Set(selected.map(n=>n.id));
      groups.push({id,nodes:selected,edges:edges.filter(e=>selIds.has(e.source)&&selIds.has(e.target))});
    }
  }else{
    // A user's real project may keep all nodes on a single branch. Then spatial consequence
    // nodes define candidate routes, through their own ancestors and successors.
    const roots=working.filter(n=>n.type==='consequence');
    if(roots.length>1){for(const root of roots){const path=pathFromRoot(root,nodes,edges);groups.push({id:`path-${root.id}`,...path,rootId:root.id});}}
    else groups=[{id:working[0]?.branchId||'visible-trace',nodes,edges}];
  }
  if(selectedRootId){
    const chosen=nodes.find(n=>n.id===selectedRootId);
    if(chosen){
      const matches=groups.filter(g=>g.nodes.some(n=>n.id===chosen.id));
      if(matches.length===1){groups=matches;}
      else if(chosen.type!=='input'){
        const own=matches.find(g=>g.id===chosen.branchId||g.rootId===chosen.id);
        if(own)groups=[own];
      }
      // An Input can initiate several paths: retain explicit choices instead of merging them.
    }
  }
  const results=groups.map(g=>{
    const included=g.nodes.filter(sourceNode);const valid=scoreStrategies(included.filter(n=>n.type!=='input')).choice!=='generic' && included.some(n=>n.type==='consequence'||n.type==='note');
    if(!valid)return null;
    const candidateNodes=included.filter(n=>n.type!=='input');
    const move=candidateNodes.find(n=>n.type==='consequence'&&live(n))||candidateNodes.find(live)||candidateNodes[0];
    const {score,criteria}=optionScore(included,g.edges);
    const strategy=scoreStrategies(candidateNodes);
    return {...g,title:(move?.label||'Unresolved route').slice(0,160),sourceIds:included.map(n=>n.id),score,criteria,strategy:strategy.choice,documentedNodes:candidateNodes.filter(live).length,rejected:!candidateNodes.some(live)};
  }).filter(Boolean).sort((a,b)=>b.score-a.score||b.documentedNodes-a.documentedNodes||a.id.localeCompare(b.id));
  return results.slice(0,max);
}

// D2.4: Keep whole-pavilion pathways and speculative project-scale translations distinct.
// Alternatives here are SYSTEM translations, never new participant-authored branches.
export function aggregateFormOptions(state,scoped,{min=3,max=5}={}){
  const routes=supportedOptions(state,scoped,40);
  if(!routes.length)return [];
  const distinct=[],seen=new Set();
  // Diversity is not equivalent to a numerical ranking: favour documented different
  // spatial intentions and preserve the original route as the evidence source.
  for(const route of routes){
    const kind=route.strategy;
    if(seen.has(kind))continue;
    seen.add(kind);distinct.push({...route,translation:'source-led',variation:0});
    if(distinct.length>=max)break;
  }
  const affinities={pockets:['cluster','petals','ribbon','ring','fold'],social:['ring','cluster','fold','petals','ribbon'],climate:['petals','ribbon','fold','ring','cluster'],movement:['ribbon','fold','ring','cluster','petals'],privacy:['fold','ring','cluster','petals','ribbon'],capacity:['cluster','fold','ring','ribbon','petals'],duration:['ribbon','cluster','fold','ring','petals'],court:['ring','petals','cluster','fold','ribbon'],tier:['fold','ring','ribbon','petals','cluster'],adaptable:['cluster','fold','petals','ring','ribbon']};
  const used=new Set();
  for(const option of distinct){
    const family=(affinities[option.strategy]||['fold','ribbon','ring','petals','cluster']).find(k=>!used.has(k))||'fold';
    option.formalVariant=family;used.add(family);
  }
  const strategies=['ribbon','petals','ring','fold','cluster'];
  let alt=1;
  // One recorded spatial move can be interpreted in more than one spatial geometry.
  // Those interpretations must be clearly called variants, not fictitious recordings.
  while(distinct.length<Math.min(min,max) && routes.length){
    const base=routes[(alt-1)%routes.length];
    const formalVariant=(affinities[base.strategy]||strategies).find(k=>!used.has(k))||strategies[(alt-1)%strategies.length];
    used.add(formalVariant);
    distinct.push({...base,id:`${base.id}-translation-${alt}`,translation:'speculative',variation:alt,formalVariant});
    alt++;
  }
  return distinct.slice(0,max);
}
function expressedMoves(nodes){
  const analysis=scoreStrategies(nodes.filter(live));
  return analysis.ordered.filter(k=>analysis.scores[k]>=3 && (analysis.sources[k]||[]).length)
    .map(k=>({key:k,score:analysis.scores[k],source:analysis.sources[k][0]}));
}
function strategicNotes(strategy,nodes){
  const pattern=patterns[strategy];
  const source=nodes.find(n=>live(n)&&n.type==='consequence'&&pattern?.test(n.label))||nodes.find(n=>live(n)&&n.type==='interpretation'&&pattern?.test(n.label));
  return source||nodes.find(n=>live(n)&&n.type==='consequence')||null;
}
export function makePropositionSpec({state,scoped,mode='focus-map',option=null,ordinal=1}){
  const all=(option?.nodes||scoped?.nodes||[]).filter(sourceNode);
  const nodes=all.filter(live);
  const analysis=scoreStrategies(nodes);const strategy=option?.strategy||analysis.choice;
  const moves=expressedMoves(nodes), secondary=moves.filter(m=>m.key!==strategy).slice(0,5);
  const lead=strategicNotes(strategy,nodes);
  const architecture=buildingType(state.brief);
  const brief=text(state.brief);
  const checks=[
    {key:'seating',label:'20 additional seats',active:/\b(?:20|twenty)\s+(?:additional|more|extra)?\s*seats|(?:add|additional|more)\s+(?:20|twenty)\s+seats/i.test(brief)},
    {key:'route',label:'Unobstructed main route',active:/unobstruct|main\s+(?:pedestrian\s+)?route|circulation.*clear|clear.*(?:route|passage)/i.test(brief)},
    {key:'shelter',label:'Sheltered footprint unchanged',active:/sheltered footprint|without increasing.*(?:footprint|shelter)|no larger sheltered/i.test(brief)},
    {key:'occupation',label:'Individual and group use',active:/individual.*group|group.*individual|both.*(?:individual|group)/i.test(brief)}
  ].filter(x=>x.active);
  const strategyName=architecture==='Pavilion'?named[strategy]:named[strategy].replace(' pavilion',' spatial study');
  const title=mode==='aggregate'
    ?`Form study ${String(ordinal).padStart(2,'0')} · ${named[strategy].replace(' pavilion','')}`
    :`${architecture} ${String(ordinal).padStart(2,'0')} · ${strategyName}`;
  const featureDefinitions={
    movement:[['Movement','Continuous through-route kept independent of occupation','movement'],['Occupation','Seating is concentrated in lateral pockets','movement'],['Shelter','Linear shelter spans route and edge pockets',null]],
    privacy:[['Gradient','Screens thicken from open edge to sheltered niches','privacy'],['Occupation','Partially recessed benches sit beyond screen layers','privacy'],['Shelter','Raised roof retains a collective spatial canopy',null]],
    capacity:[['Capacity','Fixed perimeter bench is supplemented by deployable seats','capacity'],['Movement','A dedicated clear passage limits loose furniture deployment','movement'],['Shelter','Increased occupation stays within the existing roof outline','capacity']],
    climate:[['Climate','Ventilated roof layers provide shade without sealing perimeter','climate'],['Porosity','Open edges and selective louvers admit air and sightlines','climate'],['Occupation','Seating remains protected below deep overhangs',null]],
    duration:[['Short stay','Entry perches offer rapid occupation adjacent to movement','duration'],['Long stay','Deeper work seating provides greater support','duration'],['Movement','Open middle strip mediates both time scales',null]],
    social:[['Individual','Quiet edge carrels are set apart from the group table','social'],['Collective','Large shared table sits within a flexible central zone','social'],['Threshold','Screens remain partial rather than forming separate rooms',null]],
    pockets:[['Occupation','Several independent occupation islands support varied activities','pockets'],['Threshold','Open strips separate pockets without corridors',null],['Shelter','Displaced roof plates respond to separate clusters',null]],
    court:[['Void','An unroofed centre makes an outdoor room','court'],['Movement','Covered ring mediates circulation around the void',null],['Occupation','Perimeter benches face the planted centre',null]],
    tier:[['Levels','Tiered seating gives multiple heights and collective outlook','tier'],['Circulation','Open side access avoids a stepped through-route',null],['Shelter','Canopy frames the terraced seating section',null]],
    adaptable:[['Adaptation','Freestanding movable modules permit reconfiguration','adaptable'],['Movement','A fixed movement corridor contains rearrangement',null],['Shelter','A stable roof covers alternative layouts',null]],
    generic:[['Unresolved form','The trace does not yet specify a spatial move',null]]
  };
  const annotations=featureDefinitions[strategy].map(([heading,form,key])=>{
    const supporting=key?nodes.find(n=>n.type==='consequence'&&patterns[key]?.test(n.label))||nodes.find(n=>n.type==='interpretation'&&patterns[key]?.test(n.label)):null;
    return {heading,form,sourceId:supporting?.id||null,sourceText:supporting?.label||'',grounded:!!supporting,
      status:supporting?'Interpretive geometry derived from stated spatial move':'System assumption — not specified by this pathway'};
  });
  // A whole pavilion also communicates sourced secondary moves, rather than only
  // the single primary visual taxonomy. Secondary features are drawn below.
  if(mode!=='aggregate'){
    for(const m of secondary.slice(0,4)){
      const form={privacy:'Graduated edge screening and seating intimacy',social:'Individual / collective occupation zones',movement:'An independent through-route',capacity:'Reconfigurable seating within shelter',climate:'Passive shade and ventilation layers',duration:'Short-stay perches versus deeper occupation',pockets:'Clustered smaller pause places',court:'Open planted centre',tier:'Changes of level for occupation',adaptable:'Moveable occupation modules'}[m.key];
      if(form)annotations.push({heading:named[m.key].replace(' pavilion',''),form,sourceId:m.source.id,sourceText:m.source.label,grounded:true,status:'Additional recorded spatial move translated into the complete scheme'});
    }
  }
  const {score,criteria}=option?{score:option.score,criteria:option.criteria}:optionScore(nodes,scoped?.edges||[]);
  return {id:`prop-${Date.now()}-${ordinal}`,title,mode,ordinal,architecture,strategy,concept:named[strategy],
    formalVariant:option?.formalVariant||(['movement','duration','adaptable'].includes(strategy)?'ribbon':['court','social','privacy'].includes(strategy)?'ring':['pockets','climate'].includes(strategy)?'petals':'fold'),
    translation:option?.translation||'source-led',secondaryMoves:secondary.map(x=>({key:x.key,sourceId:x.source.id,sourceText:x.source.label})),
    fullPavilion:mode!=='aggregate',briefChecks:checks,
    layout:formLabels[strategy],branchId:option?.id||null,branchTitle:option?.title||lead?.label||'Visible trace',
    documentedScore:score,scoreCriteria:criteria,annotations,sourceIds:[...new Set(all.map(n=>n.id))],
    recordedClaims:annotations.filter(a=>a.grounded).length,assumptions:annotations.filter(a=>!a.grounded).map(a=>a.form),
    sourceStatement:lead?.label||'',sourceStatementId:lead?.id||null,
    note:mode==='aggregate'?'Abstract spatial translation from recorded reasoning; a formal hypothesis, not a designed or validated building.':'Coordinated whole-pavilion option from this pathway. Roof, access route, spatial zoning and occupation are proposed together; seating, footprints, structural integrity, shelter and accessibility are NOT verified.',
    frameworkId:state.frameworkId||'tracework',evidenceStatus:analysis.choice==='generic'?'Insufficient documented spatial direction':'Source-led spatial interpretation'};
}
const f=x=>Number(x.toFixed(2));
const P=(x,y,z=0)=>[f(335+(x-y)*25.8),f(227+(x+y)*13.6-z*35)];
const polygon=(vertices,fill,stroke='#4d646b',w=1,more='')=>`<polygon points="${vertices.map(v=>P(...v).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" ${more}/>`;
const segment=(a,b,col='#657b81',w=1.5,extra='')=>`<path d="M${P(...a).join(',')} L${P(...b).join(',')}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
function prism(x,y,z,w,d,h,top='#c8b79c',side='#a2b5b1'){
  return polygon([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],top,'#687e83',.8)
    +polygon([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],side,'#66828b',.8)
    +polygon([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],'#e4ded0','#72858b',.75);
}
function pane(x1,y1,x2,y2,h,fill='#aec0c1',alpha=.83){return polygon([[x1,y1,.05],[x2,y2,.05],[x2,y2,h],[x1,y1,h]],fill,'#657e86',1,`opacity="${alpha}"`);}
function seat(x,y,w=1.4,d=.45,back=true){let s=prism(x,y,.08,w,d,.43,'#c5a77f','#b09a79');if(back)s+=prism(x,y+d-.11,.5,w,.12,.52,'#bd9f76','#a88e6f');return s;}
function tree(x,y){const pt=P(x,y,2.4),base=P(x,y,.1);return segment([x,y,.1],[x,y,2.45],'#719087',3)+`<ellipse cx="${pt[0]}" cy="${pt[1]}" rx="22" ry="18" fill="#a2b9a6" opacity=".9"/><circle cx="${pt[0]+8}" cy="${pt[1]-6}" r="13" fill="#c1d1bd" opacity=".85"/>`+`<ellipse cx="${base[0]+6}" cy="${base[1]+2}" rx="15" ry="6" fill="#adc4ac" opacity=".4"/>`;}
function pathStrip(x1,x2,y1=0,y2=10,fill='#dce7df'){return polygon([[x1,y1,.065],[x2,y1,.065],[x2,y2,.065],[x1,y2,.065]],fill,'#b8c9c1',.8);}
function roofPlate(x1,y1,x2,y2,z=3.2,{translucent=false,angle=.2,color='#c4d6d4'}={}){
  const lift=(x,y)=>z+(x-x1)*angle/Math.max(.1,x2-x1);
  return polygon([[x1,y1,lift(x1,y1)],[x2,y1,lift(x2,y1)],[x2,y2,lift(x2,y2)],[x1,y2,lift(x1,y2)]],color,'#587b82',2,translucent?'opacity=".40"':'opacity=".92"')+
    polygon([[x1,y2,lift(x1,y2)-.16],[x2,y2,lift(x2,y2)-.16],[x2,y2,lift(x2,y2)],[x1,y2,lift(x1,y2)]],'#7d9b9c','#5c7a81',.8);
}
function columns(coords,z=3.2){return coords.map(([x,y])=>segment([x,y,.08],[x,y,z],'#465f65',5)+segment([x+.09,y,.08],[x+.09,y,z],'#b1c6c2',1.6)).join('');}
function human(x,y){const [a,b]=P(x,y,1.6),[xx,yy]=P(x,y,.14);return `<circle cx="${a}" cy="${b-6}" r="5" fill="#5c7380"/><path d="M${a} ${b+1}L${xx} ${yy-10}m0 0l-5 10m5-10l6 10" fill="none" stroke="#5c7380" stroke-width="2.9" stroke-linecap="round"/>`;}
function routeDashes(x1,y1,x2,y2){return segment([x1,y1,.13],[x2,y2,.13],'#648e8c',2.8,'stroke-dasharray="7 6"');}

function ellipsePoints(cx,cy,rx,ry,z=0,segments=36,angle=0){
 return Array.from({length:segments},(_,i)=>{const a=i*2*Math.PI/segments;return [cx+rx*Math.cos(a)*Math.cos(angle)-ry*Math.sin(a)*Math.sin(angle),cy+rx*Math.cos(a)*Math.sin(angle)+ry*Math.sin(a)*Math.cos(angle),z];});
}
function halo(cx,cy,rx,ry,z,color='#bfd4cf',alpha=.8){
 return polygon(ellipsePoints(cx,cy,rx,ry,z),color,'#65838a',1.35,`opacity="${alpha}"`);
}
function curvingScreen(cx,cy,rx,ry,start,end,h=2,color='#a0b6b0'){
 const vertices=Array.from({length:13},(_,i)=>{const a=start+(end-start)*i/12;return [cx+rx*Math.cos(a),cy+ry*Math.sin(a)];});
 return vertices.slice(0,-1).map(([x,y],i)=>pane(x,y,...vertices[i+1],h,color,.7)).join('');
}
function petalCanopy(cx,cy,count=5,z=3.4,{radius=4,fill='#bed4d0'}={}){
 let shape='';const coords=[];
 for(let i=0;i<count;i++){
  const angle=i*2*Math.PI/count;
  const ox=cx+Math.cos(angle)*radius*.46,oy=cy+Math.sin(angle)*radius*.46;
  const pts=ellipsePoints(ox,oy,radius*.7,radius*.3,z,24,angle);
  shape+=polygon(pts,i%2===0?fill:'#e0d5bc','#66868b',1.45,'opacity=".78"');
  shape+=segment([cx,cy,z],[cx+radius*Math.cos(angle),cy+radius*Math.sin(angle),z+.25],'#75939a',1);
  coords.push([cx+Math.cos(angle)*radius*.80,cy+Math.sin(angle)*radius*.80]);
 }
 return {shape,coords};
}
function curvedRibbon(y0=4.5,span=8,z=3.5,width=2.2){
 const top=[],bottom=[];
 for(let i=0;i<=24;i++){
  const x=.5+9*i/24,y=y0+Math.sin(i/24*Math.PI*1.8)*1.2;
  top.push([x,y-width/2,z+Math.sin(i/24*Math.PI)*.45]);
  bottom.push([x,y+width/2,z+Math.sin(i/24*Math.PI)*.45]);
 }
 return polygon([...top,...bottom.reverse()],'#b8d2cf','#527d80',1.4,'opacity=".88"');
}
function arcBench(cx,cy,rx,ry,a1,a2){
 let form='';for(let i=0;i<12;i++){
  const a=a1+(a2-a1)*i/12,na=a1+(a2-a1)*(i+1)/12;
  form+=polygon([[cx+rx*Math.cos(a),cy+ry*Math.sin(a),.47],[cx+(rx+.42)*Math.cos(a),cy+(ry+.42)*Math.sin(a),.47],
    [cx+(rx+.42)*Math.cos(na),cy+(ry+.42)*Math.sin(na),.47],[cx+rx*Math.cos(na),cy+ry*Math.sin(na),.47]],'#ceb48e','#ad997b',.45);
 }
 return form;
}
function geometricTrace(kind){return {movement:'independent route and occupied edges',privacy:'layered crescent and nested threshold',capacity:'edge infrastructure and deployable field',climate:'open-air canopy and porous envelope',duration:'sequence of short and long stays',social:'shared forum with quieter perimeter',pockets:'dispersed inhabited islands',court:'occupied ring around open centre',tier:'stepped social terrain',adaptable:'mobile occupation fields'}[kind]||'open investigation';}
// Aggregate deliberately tests distinct formal hypotheses, rather than five
// variations of the same roof template. Its geometry is not a participant claim.
function abstractGraphicFor(spec){
 const kind=spec.formalVariant||'fold';let ground='',furn='',roof='',wall='',markers={};
 ground+=halo(5,5,5,4.75,-.19,'#e9efe9',.94);
 for(let r=2;r<=4;r++)ground+=`<ellipse cx="${P(5,5)[0]}" cy="${P(5,5)[1]}" rx="${r*37}" ry="${r*19}" fill="none" stroke="#cbd9d3" stroke-width="1" stroke-dasharray="4 6"/>`;
 if(kind==='cluster'){
  // Asymmetric archipelago: discrete sheltered places linked by a narrow connective tissue.
  const islands=[[2.3,3,1.5,1.05],[7.7,2.25,1.1,1.1],[3.3,7.5,2.2,1.15],[8.1,7.45,1.0,1.3]];
  for(const [i,[x,y,rx,ry]] of islands.entries()){
    ground+=halo(x,y,rx*1.25,ry*1.32,.05,'#e9ddc8',.84);
    furn+=arcBench(x,y,rx*.6,ry*.62,.15,2.8);
    roof+=halo(x,y,rx*1.3,ry*1.3,3.05+i*.22,i%2?'#d9d8c1':'#a9cdc5',.91);
    roof+=columns([[x-rx*.7,y-.2],[x+rx*.75,y+.15]],3.05+i*.22);
  }
  ground+=segment([3.8,3.6,.09],[6.8,2.75,.09],'#74a099',4,'stroke-dasharray="7 6"');
  ground+=segment([4.6,7.15,.09],[7.2,7.1,.09],'#74a099',4,'stroke-dasharray="7 6"');
 }else if(kind==='ring'){
  // Segmented annulus with a deliberate exposed centre and an occupied rim.
  ground+=halo(5,5,2.38,2.38,.06,'#c8dac6',1);
  for(let i=0;i<16;i++){
   const a=i*2*Math.PI/16,b=(i+1)*2*Math.PI/16;
   roof+=polygon([[5+2.55*Math.cos(a),5+2.55*Math.sin(a),3.65],[5+4.7*Math.cos(a),5+4.7*Math.sin(a),3.27],[5+4.7*Math.cos(b),5+4.7*Math.sin(b),3.27],[5+2.55*Math.cos(b),5+2.55*Math.sin(b),3.65]],i%4===0?'#d9c59c':'#b5d3cc','#63868a',1,'opacity=".88"');
  }
  wall+=curvingScreen(5,5,2.7,2.7,.23,2.3,1.6,'#b4c6bc');
  furn+=arcBench(5,5,2.9,2.9,2.1,5.8);
  roof+=columns([[1.15,5],[5,1.15],[8.85,5],[5,8.85]],3.2);
 }else if(kind==='petals'){
  // Radial fan: tapered, unequally-sized planes shelter a shared social nucleus.
  const count=6;
  for(let i=0;i<count;i++){
   const a=i*2*Math.PI/count+.25;
   const r=3.4+(i%3)*.52;
   const vertices=[[5,5,3.85],[5+Math.cos(a-.42)*r*.78,5+Math.sin(a-.42)*r*.78,3.4],
     [5+Math.cos(a)*r*1.27,5+Math.sin(a)*r*1.27,3.12],
     [5+Math.cos(a+.42)*r*.78,5+Math.sin(a+.42)*r*.78,3.4]];
   roof+=polygon(vertices,i%2===0?'#b4d6cf':'#e3d3b5','#658b89',1.8,'opacity=".88"');
   roof+=segment([5,5,3.85],vertices[2],'#73908d',1.4);
   const sx=5+Math.cos(a)*r*.75,sy=5+Math.sin(a)*r*.75;
   ground+=halo(sx,sy,.86,.68,.06,'#e6d9bd',.82);
   furn+=arcBench(sx,sy,.51,.45,.1,2.6);
   roof+=columns([[sx,sy]],3.2);
  }
  furn+=halo(5,5,1.05,.96,.43,'#d0b38b',1);
 }else if(kind==='ribbon'){
  // Continuous folded band with a void through its middle and cantilever-like ends.
  ground+=pathStrip(4.34,5.66,.2,9.8,'#d9e7db');
  ground+=routeDashes(5,0.3,5,9.7);
  roof+=curvedRibbon(2.65,8,3.38,2.25);
  roof+=curvedRibbon(7.3,8,3.08,1.55);
  for(const y of [1.5,4.7,7.6]){furn+=seat(1.1,y,2,.5,false)+seat(6.7,y,2,.5,false);}
  roof+=columns([[1.5,2.3],[8.5,3.65],[1.5,7.0],[8.4,8.25]],3.1);
 }else{
  // Oblique accordion roof with zig-zag section: deliberately NOT a radial flower.
  ground+=halo(5,5,4.35,3.5,.07,'#e8decc',.9);
  for(let i=0;i<5;i++){
   const v=.85+i*1.65,rise=i%2===0?4.2:3.7;
   roof+=polygon([[.85,v,3.25],[3.2,v-.20,rise],[5.1,v+.45,3.25],[2.9,v+1.15,3.3]],i%2===0?'#b1d2ca':'#e0cfad','#66868a',1.45,'opacity=".9"');
   roof+=polygon([[5.1,v+.45,3.25],[3.2,v-.20,rise],[8.8,v+.3,3.3],[8.45,v+1.5,3.02]],i%2===0?'#e1d3b7':'#a8c9c8','#66868a',1.45,'opacity=".9"');
  }
  wall+=pane(2.1,7.6,4.2,6.35,1.6,'#b4c9c6',.67);
  furn+=seat(1.8,4.1,2.0,.51,false)+seat(6.6,5.6,2,.51,false);
  roof+=columns([[1.25,1.55],[8.65,1.45],[1.7,8.25],[8.6,8.4]],3.35);
 }
 return {shapes:ground+furn+wall+roof,markers,geometry:geometricTrace(spec.strategy)};
}
// The orthographic inset and the axonometric draw from the same spatial strategy.
// It is a programme-and-access check diagram, not a scaled measured drawing.
function schemePlan(spec){
 const kind=spec.strategy,moves=new Set([kind,...(spec.secondaryMoves||[]).map(m=>m.key)]);
 const x=91,y=199,size=112,at=(u,v)=>[x+u/10*size,y+v/10*size];
 const ellipse=(u,v,rx,ry,fill)=>{const [cx,cy]=at(u,v);return `<ellipse cx="${cx}" cy="${cy}" rx="${rx*size/10}" ry="${ry*size/10}" fill="${fill}" stroke="#698e8d" stroke-width="1"/>`;};
 const line=(x1,y1,x2,y2,clr='#488787',width=2,dash='')=>{const p=at(x1,y1),q=at(x2,y2);return `<path d="M${p[0]} ${p[1]}L${q[0]} ${q[1]}" fill="none" stroke="${clr}" stroke-width="${width}" ${dash?'stroke-dasharray="'+dash+'"':''}/>`;};
 let art=`<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#f3f5f1" stroke="#97aead" stroke-width="1.2"/>`;
 const clusters={movement:[[2.3,2],[7.5,2],[2.3,7.5],[7.5,7.5]],privacy:[[2.4,2],[3,5],[2.2,8]],capacity:[[2,2],[7.7,2],[2,8],[7.7,8]],climate:[[3,2],[7.3,3.3],[3,7.4]],duration:[[2,2],[7.2,4],[2,7.8]],social:[[2.2,2.5],[7,5],[2.5,8]],pockets:[[2.2,2.5],[7.5,3],[3,8]],court:[[5,2],[8,5],[5,8],[2,5]],tier:[[3,2],[3,5],[3,8]],adaptable:[[2.4,2],[7,3.2],[3,7.7]]};
 if(kind==='court')art+=ellipse(5,5,2.15,2.15,'#d6e5d2');
 if(kind==='social')art+=ellipse(6.5,5,2,1.8,'#c8ded5');
 if(kind==='privacy'){for(const r of [2.6,3.5,4.6])art+=`<path d="M${at(1,5)[0]} ${at(1,5)[1]-r*size/20}Q${at(5,5)[0]} ${at(5,5)[1]} ${at(1,5)[0]} ${at(1,5)[1]+r*size/20}" fill="none" stroke="#93aeab" stroke-width="2"/>`;}
 if(kind==='tier')for(let i=0;i<4;i++)art+=line(1.2,1.8+i*1.65,7.7,1.8+i*1.65,'#c5a87d',6);
 for(const [i,[u,v]] of (clusters[kind]||clusters.movement).entries()){
  if(kind!=='court'&&kind!=='tier')art+=ellipse(u,v,kind==='pockets'?1.38:1.13,kind==='pockets'?1.0:.87,i%2?'#e7d3b0':'#bfd8d0');
 }
 // Always indicate a potential independent route when the pilot brief requires one.
 const central=['movement','capacity','duration','adaptable'].includes(kind);
 const route=moves.has('movement')||spec.briefChecks?.some(c=>c.key==='route');
 if(route)art+=line(central?5:9.15,0,central?5:9.15,10,'#337e82',3,'5 3');
 if(spec.briefChecks?.some(c=>c.key==='seating')){
   // Twenty loci on programme diagram; no claim that clearances or cover have passed.
   const xx=central?[1.4,2.5,7.25,8.3]:[1.25,2.6,5.9,7.35];
   let i=0;for(const u of xx)for(const v of [1.4,3.1,4.8,6.5,8.2]){
    const [px,py]=at(u,v);art+=`<circle cx="${px}" cy="${py}" r="2.45" fill="${i%2?'#aa8f6d':'#ccaf82'}"/>`;i++;
   }
 }
 return art;
}
function graphicFor(spec){
 if(spec.mode==='aggregate')return abstractGraphicFor(spec);
 const kind=spec.strategy;let ground='',furn='',wall='',roof='',humanParts='',markers={};
 ground+=polygon([[-.45,-.45,-.24],[10.45,-.45,-.24],[10.45,10.45,-.24],[-.45,10.45,-.24]],'#dce8e2','#aabbad',1);
 ground+=polygon([[0,0,0],[10,0,0],[10,10,0],[0,10,0]],'#eff0e7','#a8b4b0',1.7);
 for(let i=1;i<10;i++)ground+=segment([i,0,.014],[i,10,.014],'#dce1db',.6)+segment([0,i,.014],[10,i,.014],'#dce1db',.6);
 const cover=(x1=.4,y1=.4,x2=9.6,y2=9.6,z=3.25,options={translucent:true})=>{roof+=roofPlate(x1,y1,x2,y2,z,options);roof+=columns([[x1+.38,y1+.38],[x2-.38,y1+.38],[x2-.38,y2-.38],[x1+.38,y2-.38]],z);};
 switch(kind){
  case 'movement':
   ground+=pathStrip(4.25,5.75,0,10,'#c9dfda')+routeDashes(5,0,5,10);
   for(const y of [1.15,3.8,6.45]){ground+=polygon([[.6,y,.06],[3.5,y,.06],[3.5,y+2,.06],[.6,y+2,.06]],'#e9e2d0','#a8b1a7',.7);furn+=seat(.9,y+.5,2,.47);furn+=seat(6.65,y+.5,2.1,.47);}
   roof+=halo(2.25,5,1.8,4.8,3.2,'#e0d4ba',.85);
   roof+=halo(7.7,5,1.8,4.8,3.2,'#e0d4ba',.85);
   roof+=halo(5,5,1.3,4.8,3.8,'#b7d2d0',.9);
   roof+=columns([[.9,.8],[3.45,.8],[6.55,.8],[9.1,.8],[.9,9.1],[3.45,9.1],[6.55,9.1],[9.1,9.1]],3.15);
   markers={Movement:[5,5,.08],Occupation:[7.6,2,.8],Shelter:[5,1,3.8]};break;
  case 'privacy':
   ground+=pathStrip(8.35,9.45,0,10);ground+=routeDashes(8.95,.5,8.95,9.5);
   for(const [i,y] of [1.05,3.2,5.35].entries()){
     furn+=seat(2,y+.5,2.6,.56);
     wall+=pane(.7,y,5.6-i*.35,y,1.85+i*.26,i===2?'#9bb2b3':'#c2cccb',.68+i*.09);
     if(i>=1)wall+=pane(.7,y, .7,y+1.75,1.8,'#8caba8',.78);
   }
   roof+=halo(5,5,4.7,4.55,3.3,'#c8dfd9',.79)+columns([[1,1],[9,1],[1,9],[9,9]],3.3);
   roof+=curvingScreen(3.7,5.3,2.7,3.1,-.15,1.85,2,'#8da9a3');
   markers={Gradient:[2,5.4,1.7],Occupation:[3,6.1,.75],Shelter:[8,1,3.2]};break;
  case 'capacity':
   ground+=pathStrip(4.45,5.55,0,10);ground+=routeDashes(5,0,5,10);
   for(const y of [.25,8.85]){furn+=seat(.65,y,3,.45,false)+seat(6.5,y,2.85,.45,false);}
   // Twenty separate deployable stool modules (4 rows x 5); circulation is not filled.
   // Clearances, furniture deployment and safe occupancy remain expressly unverified.
   for(const y of [1.25,3.1,4.95,6.8])for(const x of [1.15,2.45,6.1,7.35,8.6]){furn+=prism(x,y,.05,.48,.48,.38,'#a3b6af','#849c96');}
   roof+=halo(5,5,4.8,4.8,3.35,'#becfd1',.82);roof+=columns([[.75,.75],[9.25,.75],[.75,9.25],[9.25,9.25]],3.35);
   markers={Capacity:[7.5,7,.5],Movement:[5,4,.1],Shelter:[1,1,3.35]};break;
  case 'climate':
   ground+=pathStrip(4.5,5.5,0,10);ground+=routeDashes(5,0,5,10);
   for(const y of [2,5.5]){furn+=seat(1.25,y,2.3,.65)+seat(6.55,y,2.2,.65);}
   for(const y of [2.2,4.4,6.6])wall+=pane(.55,y,2.5,y+.42,1.7,'#a9c5bf',.58);
   const climateRoof=petalCanopy(5,5,6,3.55,{radius:5.2});roof+=climateRoof.shape+columns(climateRoof.coords,3.55);
   humanParts+=tree(-.5,8.8);
   markers={Climate:[4.1,5.1,3.7],Porosity:[1.8,4.4,1.5],Occupation:[7.2,6,.8]};break;
  case 'duration':
   ground+=pathStrip(4.4,5.6,0,10);ground+=routeDashes(5,0,5,10);
   for(let k=0;k<4;k++)furn+=prism(1.3+k*.74,.85,.06,.43,.47,.75,'#c9aa86');
   for(const y of [4.9,7.25]){furn+=seat(1.15,y,2.6,.7)+seat(6.6,y,2.2,.7);furn+=prism(6.8,y+1.03,.05,1.6,.75,.65,'#e3cdb1');}
   wall+=pane(.75,6.7,3.9,6.7,1.5,'#b5c8c4',.58);
   roof+=curvedRibbon(2.1,8,3.75,3.4)+curvedRibbon(7,8,3.18,3.7)+columns([[.8,.8],[9,.8],[1,8.4],[9,9]],3.25);
   markers={'Short stay':[2,1,.8],'Long stay':[7.6,7.4,.8],Movement:[5,5,.1]};break;
  case 'social':
   ground+=polygon([[5.3,2,.05],[9.1,2,.05],[9.1,8,.05],[5.3,8,.05]],'#e9dfcb','#c3b7a9',.9);
   for(const y of [1.2,3.6,6]){wall+=pane(.55,y,3.9,y,1.65,'#b8c4bd',.67);furn+=seat(1.1,y+.5,2.2,.65);}
   furn+=prism(6.05,4,.1,2.9,1.5,.7,'#c7ad8c');for(const yy of [3.4,6])furn+=seat(6.3,yy,2.1,.4,false);
   roof+=halo(6.5,5,3.1,4.4,3.6,'#c2d7d0',.82)+halo(2.2,5,1.95,4.3,3.25,'#dfd0b6',.78);
   roof+=columns([[2.2,1],[2.2,9],[6.6,.9],[6.6,9],[9,5]],3.4);
   furn+=arcBench(6.3,5,1.75,2.1,-.6,1.7);
   markers={Individual:[2,4.2,.9],Collective:[7.5,4.8,.9],Threshold:[3.2,3.6,1.65]};break;
  case 'pockets':
   ground+=pathStrip(4.65,5.5,0,10);
   for(const [cx,cy] of [[2.1,2],[7.5,3],[2.4,7.7]]){
     ground+=halo(cx,cy,1.65,1.25,.06,'#e4dccc',.98);
     furn+=seat(cx-1.15,cy-.4,2.3,.55,false);
     roof+=halo(cx,cy,1.7,1.45,3.1+(cy/10)*.7,cy>7?'#d4ceb9':'#b9cecb',.84);
     roof+=columns([[cx-1.4,cy-1.15],[cx+1.4,cy+1.15]],3.1+(cy/10)*.7);
   }
   // Small occupation pockets still belong to one sheltering pavilion system.
   roof+=curvedRibbon(4.7,7.7,3.65,1.55);
   ground+=routeDashes(5.1,.4,5.1,9.65);
   humanParts+=tree(7.6,8.3);markers={Occupation:[2.1,2,.5],Threshold:[5,4,.1],Shelter:[7.5,3,3.3]};break;
  case 'court':
   ground+=halo(5,5,2.4,2.4,.06,'#c4d5be',1);
   humanParts+=tree(5,5);ground+=routeDashes(8.5,0,8.5,10);
   for(const y of [2,7.1])furn+=seat(2.4,y,4.1,.52,false);
   for(let i=0;i<18;i++){const a=i*2*Math.PI/18,b=(i+1)*2*Math.PI/18;roof+=polygon([[5+2.95*Math.cos(a),5+2.95*Math.sin(a),3.5],[5+4.8*Math.cos(a),5+4.8*Math.sin(a),3.35],[5+4.8*Math.cos(b),5+4.8*Math.sin(b),3.35],[5+2.95*Math.cos(b),5+2.95*Math.sin(b),3.5]],i%3===0?'#dfd4b8':'#bad2cd','#709096',.65,'opacity=".78"');}
   roof+=columns([[.8,.8],[9.2,.8],[.8,9.2],[9.2,9.2]],3.35);
   markers={Void:[5,5,.05],Movement:[8.5,5,.08],Occupation:[3.5,7,.5]};break;
  case 'tier':
   ground+=pathStrip(8.2,9.4,0,10);
   for(let k=0;k<5;k++)furn+=prism(.8,1+k*1.2,.05,6.2,.94,.26+k*.16,k%2?'#cdb492':'#ddc4a2');
   roof+=petalCanopy(5,5,5,4.1,{radius:5}).shape+columns([[1,1],[9,1],[1,9],[9,9]],4);
   markers={Levels:[4.3,5.8,1.1],Circulation:[8.65,5,.07],Shelter:[7.6,2.2,4.1]};break;
  case 'adaptable':
   ground+=pathStrip(4.65,5.65,0,10);ground+=routeDashes(5.15,0,5.15,10);
   for(const [x,y] of [[1.5,1.5],[2.7,4.2],[1.5,7.2],[6.8,2],[7.6,5.1],[6.8,7.4]])furn+=prism(x,y,.05,1.25,.8,.4,'#b4c8b3');
   for(const [x,y] of [[2.3,3.3],[7.6,6]])wall+=pane(x,y,x+1.6,y+1.1,1.5,'#c1caca',.72);
   roof+=curvedRibbon(3.0,8,3.4,2.4)+curvedRibbon(6.5,8,3.4,2.4)+columns([[1,1],[9,1],[1,9],[9,9]],3.4);
   markers={Adaptation:[2.5,4.5,.55],Movement:[5.15,5,.06],Shelter:[7,1,3.4]};break;
  default:
   ground+=pathStrip(4.4,5.6,0,10);roof+=roofPlate(.4,.4,9.6,9.6,3.4,{color:'#c8d8d3',translucent:true});roof+=columns([[.8,.8],[9.2,.8],[.8,9.2],[9.2,9.2]],3.4);
   markers={'Unresolved form':[5,5,.1]};break;
 }
 // Add only recorded secondary spatial intentions. The roof/furniture shown in
 // every full pavilion remains diagrammatic unless explicitly sourced.
 const secondary=new Set((spec.secondaryMoves||[]).map(m=>m.key));
 if(secondary.has('privacy')&&kind!=='privacy')wall+=curvingScreen(2.6,5.6,1.85,2.9,-1.15,1.05,1.75);
 if(secondary.has('social')&&kind!=='social')furn+=halo(6.85,5.0,1.1,1.1,.60,'#c4a481',1)+arcBench(6.85,5,1.15,1.05,0,2.2);
 if(secondary.has('movement')&&kind!=='movement'&&kind!=='capacity')ground+=routeDashes(8.9,.2,8.9,9.8);
 if(secondary.has('climate')&&kind!=='climate')roof+=curvedRibbon(6.5,5,3.65,.55);
 if((secondary.has('capacity')||spec.briefChecks?.some(c=>c.key==='seating'))&&kind!=='capacity')for(const y of [1.4,3.0,4.6,6.2,7.8])for(const x of [1.35,2.55,6.75,7.85])furn+=prism(x,y,.05,.30,.30,.32,'#afc4b3');
 if(secondary.has('adaptable')&&kind!=='adaptable')furn+=prism(1.4,3.0,.06,1.4,.7,.36,'#a1bbb1');
 humanParts+=human(9.6,9.1)+human(4.9,1.2);
 return {shapes:ground+furn+wall+roof+humanParts,markers};
}
function wraps(str,max=43,limit=3){let rows=[''];for(const word of text(str).split(/\s+/)){const i=rows.length-1;if((rows[i]+' '+word).trim().length>max&&rows[i]){if(rows.length===limit){rows[i]=rows[i].slice(0,max-2)+'…';break;}rows.push(word);}else rows[i]=(rows[i]+' '+word).trim();}return rows;}
function multi(str,x,y,{size=13,max=48,lines=2,line=17,color='#2b4853',weight='400'}={}){return `<text x="${x}" y="${y}" fill="${color}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${weight}">${wraps(str,max,lines).map((t,i)=>`<tspan x="${x}" dy="${i?line:0}">${escape(t)}</tspan>`).join('')}</text>`;}
export function renderPropositionSVG(spec,{width=1180,height=790}={}){
  const {shapes,markers}=graphicFor(spec);const anns=(spec.annotations||[]).slice(0,3);
  const pins=anns.map((a,i)=>{const p=P(...(markers[a.heading]||[5,5,.1]));return `<circle cx="${p[0]}" cy="${p[1]}" r="13" fill="#fff" stroke="#28586a" stroke-width="2.2"/><text x="${p[0]}" y="${p[1]+4.6}" text-anchor="middle" font-size="12" font-weight="700" fill="#28586a" font-family="Arial">${i+1}</text>`;}).join('');
  const notes=anns.map((a,i)=>{const y=190+i*152;return `<rect x="767" y="${y}" width="375" height="137" rx="11" fill="#fff" stroke="#d6e2e0"/><circle cx="788" cy="${y+24}" r="12" fill="#254d60"/><text x="788" y="${y+28.5}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" font-family="Arial">${i+1}</text>${multi(a.heading,810,y+28,{size:17,weight:'700',max:36,lines:1})}${multi(a.form,783,y+53,{size:12,max:53,lines:2,line:17})}${multi(a.grounded?'SOURCE: '+a.sourceText:'SYSTEM ASSUMPTION — verify before use',783,y+94,{size:10,max:65,lines:2,line:14,color:a.grounded?'#37706f':'#956b48'})}`;}).join('');
  const score=Number.isFinite(Number(spec.documentedScore))?`Trace completeness: ${spec.documentedScore} pts`:'Trace completeness: not scored';
  const isAggregate=spec.mode==='aggregate';
  const register=(spec.secondaryMoves||[]).slice(0,4).map((m,i)=>`<text x="${270+(i%2)*235}" y="${154+Math.floor(i/2)*19}" font-family="Arial" font-size="10" fill="#4f6b71">• ${escape(named[m.key].replace(' pavilion',''))}</text>`).join('');
  const plan=isAggregate?'':`<rect x="44" y="152" width="189" height="197" rx="12" fill="#fff" fill-opacity=".97" stroke="#d5e1df"/>
    <text x="58" y="175" font-size="11" font-family="Arial" font-weight="700" letter-spacing=".4" fill="#506974">PROGRAMME PLAN</text>
    ${schemePlan(spec)}
    <text x="57" y="334" font-size="9" font-family="Arial" fill="#5c797b">${spec.briefChecks?.some(c=>c.key==='seating')?'• 20 indicative seat loci':'• occupation + access zoning'}</text>
    <text x="57" y="345" font-size="8" font-family="Arial" fill="#82969b">Diagram · not dimensionally tested</text>`;
  const checks=(spec.briefChecks||[]).slice(0,4);
  const checkBand=!isAggregate&&checks.length?`<rect x="765" y="594" width="378" height="52" rx="9" fill="#f5f4ed" stroke="#e0dbce"/>
    <text x="778" y="610" font-family="Arial" font-size="10" fill="#735b42" font-weight="700">PILOT BRIEF · VERIFY IN DESIGN</text>
    ${checks.map((c,i)=>`<text x="${778+(i%2)*184}" y="${624+Math.floor(i/2)*15}" font-family="Arial" font-size="10" fill="#526c72">□ ${escape(c.label)}</text>`).join('')}`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1180 790" role="img" aria-label="${escape(spec.title)}: ${escape(spec.layout)}">
  <rect width="1180" height="790" fill="#f7f8f6"/>
  <text x="37" y="32" font-family="Arial" font-size="12" fill="#517080" letter-spacing="1.7">TRACEWORK / ${isAggregate?'ABSTRACT FORM TRANSLATION':'FULL PAVILION STUDY'} / ${spec.ordinal}</text>
  ${multi(spec.title,37,72,{size:26,max:66,lines:1,weight:'700',color:'#223e4c'})}
  ${multi(spec.layout,38,101,{size:13,max:90,lines:1,color:'#56717e'})}
  <rect x="24" y="132" width="725" height="557" rx="15" fill="#e8eeeb" stroke="#d3ddda"/>
  <path d="M38 589L742 250" fill="none" stroke="#fff" stroke-width="1" opacity=".5"/>
  <g transform="translate(44,85)">${shapes}${pins}</g>
  ${isAggregate?'':plan}
  ${isAggregate?'':register}
  <text x="47" y="666" font-family="Arial" font-size="11" fill="#526a77">${isAggregate?'ABSTRACT FORM HYPOTHESIS · DISTINCT MORPHOLOGY, NOT A FINISHED BUILDING':'PROGRAMME + SITE STUDY · ROUTES, SHELTER AND OCCUPANCY REQUIRE CHECKING'}</text>
  <text x="767" y="151" font-family="Arial" font-size="12" font-weight="700" fill="#536e78" letter-spacing=".8">ARCHITECTURAL FEATURES AND REASONING</text>
  ${notes}
  ${checkBand}
  <rect x="765" y="653" width="378" height="40" rx="7" fill="#e6eeeb"/>${multi(score+' · '+(spec.translation==='speculative'?'ALTERNATIVE TRANSLATION':'SOURCE-LED'),777,678,{size:12,max:57,lines:1,weight:'700'})}
  <path d="M28 719H1144" stroke="#d3dedb"/>
  ${multi('SOURCE MOVE: '+(spec.sourceStatement||'No specified spatial consequence'),38,740,{size:12,max:164,lines:2,line:17,color:'#405a63'})}
  <text x="39" y="778" font-family="Arial" font-size="10" fill="#70838a">System-generated study, not a participant drawing. Proposals and source reasoning must be evaluated by the designer.</text>
  </svg>`;
}
export function propositionMarkdown(spec){
  return `# ${spec.title}\n\n**Pilot-brief checks (NOT verified):** ${spec.briefChecks?.length?spec.briefChecks.map(c=>c.label).join('; '):'No stated measurable checks extracted'}\n\n**Map scope:** ${spec.mode.replaceAll('-',' ')}\n**Spatial direction:** ${spec.layout}\n**Documented branch:** ${spec.branchTitle}\n**Documentary support:** ${spec.documentedScore??'not scored'} (not architectural quality)\n**Status:** ${spec.fullPavilion?'Whole-pavilion pathway configuration':'Aggregate abstract form study'}; ${spec.translation==='speculative'?'speculative alternative geometry':'source-led spatial translation'}, not participant drawing or validated design\n\n## Primary source statement\n${spec.sourceStatement||'No sufficiently specific design move recorded'}\n\n## Architectural translation\n${spec.annotations.map((a,i)=>`${i+1}. **${a.heading}:** ${a.form}\n   - ${a.grounded?`Linked statement [${a.sourceId}]: ${a.sourceText}`:'System assumption, not recorded evidence'}`).join('\n')}\n\n## Scoring basis\n${Object.entries(spec.scoreCriteria||{}).map(([k,v])=>`- ${k}: ${v}`).join('\n')}\n\n## Verification required\n${spec.note}\n`;
}
