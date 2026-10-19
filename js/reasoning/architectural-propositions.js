// TRACEWORK D2.3 — pathway-specific architectural proposition engine.
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
function strategicNotes(strategy,nodes){
  const pattern=patterns[strategy];
  const source=nodes.find(n=>live(n)&&n.type==='consequence'&&pattern?.test(n.label))||nodes.find(n=>live(n)&&n.type==='interpretation'&&pattern?.test(n.label));
  return source||nodes.find(n=>live(n)&&n.type==='consequence')||null;
}
export function makePropositionSpec({state,scoped,mode='focus-map',option=null,ordinal=1}){
  const all=(option?.nodes||scoped?.nodes||[]).filter(sourceNode);
  const nodes=all.filter(live);
  const analysis=scoreStrategies(nodes);const strategy=option?.strategy||analysis.choice;
  const lead=strategicNotes(strategy,nodes);
  const architecture=buildingType(state.brief);
  const strategyName=architecture==='Pavilion'?named[strategy]:named[strategy].replace(' pavilion',' spatial study');
  const title=`${architecture} ${String(ordinal).padStart(2,'0')} · ${strategyName}`;
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
  const {score,criteria}=option?{score:option.score,criteria:option.criteria}:optionScore(nodes,scoped?.edges||[]);
  return {id:`prop-${Date.now()}-${ordinal}`,title,mode,ordinal,architecture,strategy,concept:named[strategy],
    layout:formLabels[strategy],branchId:option?.id||null,branchTitle:option?.title||lead?.label||'Visible trace',
    documentedScore:score,scoreCriteria:criteria,annotations,sourceIds:[...new Set(all.map(n=>n.id))],
    recordedClaims:annotations.filter(a=>a.grounded).length,assumptions:annotations.filter(a=>!a.grounded).map(a=>a.form),
    sourceStatement:lead?.label||'',sourceStatementId:lead?.id||null,
    note:'Design-study geometry only. Dimensions, construction, comfort, capacity, access and all uncited features require verification.',
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
function graphicFor(spec){
 const kind=spec.strategy;let ground='',furn='',wall='',roof='',humanParts='',markers={};
 ground+=polygon([[-.45,-.45,-.24],[10.45,-.45,-.24],[10.45,10.45,-.24],[-.45,10.45,-.24]],'#dce8e2','#aabbad',1);
 ground+=polygon([[0,0,0],[10,0,0],[10,10,0],[0,10,0]],'#eff0e7','#a8b4b0',1.7);
 for(let i=1;i<10;i++)ground+=segment([i,0,.014],[i,10,.014],'#dce1db',.6)+segment([0,i,.014],[10,i,.014],'#dce1db',.6);
 const cover=(x1=.4,y1=.4,x2=9.6,y2=9.6,z=3.25,options={translucent:true})=>{roof+=roofPlate(x1,y1,x2,y2,z,options);roof+=columns([[x1+.38,y1+.38],[x2-.38,y1+.38],[x2-.38,y2-.38],[x1+.38,y2-.38]],z);};
 switch(kind){
  case 'movement':
   ground+=pathStrip(4.25,5.75,0,10,'#c9dfda')+routeDashes(5,0,5,10);
   for(const y of [1.15,3.8,6.45]){ground+=polygon([[.6,y,.06],[3.5,y,.06],[3.5,y+2,.06],[.6,y+2,.06]],'#e9e2d0','#a8b1a7',.7);furn+=seat(.9,y+.5,2,.47);furn+=seat(6.65,y+.5,2.1,.47);}
   roof+=roofPlate(3.7,.4,6.3,9.6,3.85,{angle:.35,color:'#bbd4d4',translucent:false});
   roof+=roofPlate(.5,.5,3.65,9.5,3.15,{angle:.1,color:'#e0d4ba',translucent:true});
   roof+=roofPlate(6.35,.5,9.5,9.5,3.15,{angle:.1,color:'#e0d4ba',translucent:true});
   roof+=columns([[.9,.8],[3.45,.8],[6.55,.8],[9.1,.8],[.9,9.1],[3.45,9.1],[6.55,9.1],[9.1,9.1]],3.15);
   markers={Movement:[5,5,.08],Occupation:[7.6,2,.8],Shelter:[5,1,3.8]};break;
  case 'privacy':
   ground+=pathStrip(8.35,9.45,0,10);ground+=routeDashes(8.95,.5,8.95,9.5);
   for(const [i,y] of [1.05,3.2,5.35].entries()){
     furn+=seat(2,y+.5,2.6,.56);
     wall+=pane(.7,y,5.6-i*.35,y,1.85+i*.26,i===2?'#9bb2b3':'#c2cccb',.68+i*.09);
     if(i>=1)wall+=pane(.7,y, .7,y+1.75,1.8,'#8caba8',.78);
   }
   cover(.6,.45,9.5,9.5,3.2,{color:'#d0e0de'});
   markers={Gradient:[2,5.4,1.7],Occupation:[3,6.1,.75],Shelter:[8,1,3.2]};break;
  case 'capacity':
   ground+=pathStrip(4.45,5.55,0,10);ground+=routeDashes(5,0,5,10);
   for(const y of [.25,8.85]){furn+=seat(.65,y,3,.45,false)+seat(6.5,y,2.85,.45,false);}
   // Twenty separate deployable stool modules (4 rows x 5); circulation is not filled.
   // Clearances, furniture deployment and safe occupancy remain expressly unverified.
   for(const y of [1.25,3.1,4.95,6.8])for(const x of [1.15,2.45,6.1,7.35,8.6]){furn+=prism(x,y,.05,.48,.48,.38,'#a3b6af','#849c96');}
   roof+=roofPlate(.4,.4,9.6,9.6,3.35,{color:'#becfd1',translucent:true});roof+=columns([[.75,.75],[9.25,.75],[.75,9.25],[9.25,9.25]],3.35);
   markers={Capacity:[7.5,7,.5],Movement:[5,4,.1],Shelter:[1,1,3.35]};break;
  case 'climate':
   ground+=pathStrip(4.5,5.5,0,10);ground+=routeDashes(5,0,5,10);
   for(const y of [2,5.5]){furn+=seat(1.25,y,2.3,.65)+seat(6.55,y,2.2,.65);}
   for(const y of [2.2,4.4,6.6])wall+=pane(.55,y,2.5,y+.42,1.7,'#a9c5bf',.58);
   roof+=roofPlate(.15,.2,9.85,3.2,3.25,{color:'#b4ced0',translucent:false});
   roof+=roofPlate(.15,3.7,9.85,6.4,3.7,{color:'#dce5d5',translucent:false});
   roof+=roofPlate(.15,6.9,9.85,9.8,3.28,{color:'#b4ced0',translucent:false});
   roof+=columns([[.65,.65],[9.35,.65],[.65,9.3],[9.35,9.3]],3.3);
   humanParts+=tree(-.5,8.8);
   markers={Climate:[4.1,5.1,3.7],Porosity:[1.8,4.4,1.5],Occupation:[7.2,6,.8]};break;
  case 'duration':
   ground+=pathStrip(4.4,5.6,0,10);ground+=routeDashes(5,0,5,10);
   for(let k=0;k<4;k++)furn+=prism(1.3+k*.74,.85,.06,.43,.47,.75,'#c9aa86');
   for(const y of [4.9,7.25]){furn+=seat(1.15,y,2.6,.7)+seat(6.6,y,2.2,.7);furn+=prism(6.8,y+1.03,.05,1.6,.75,.65,'#e3cdb1');}
   wall+=pane(.75,6.7,3.9,6.7,1.5,'#b5c8c4',.58);
   roof+=roofPlate(.35,.35,9.65,4.4,3.75,{color:'#d4dad0',angle:.6,translucent:true});
   roof+=roofPlate(.4,4.45,9.6,9.6,3.12,{color:'#b1cbd0',translucent:true});
   roof+=columns([[.75,.75],[9.25,.75],[.75,9.25],[9.25,9.25]],3.2);
   markers={'Short stay':[2,1,.8],'Long stay':[7.6,7.4,.8],Movement:[5,5,.1]};break;
  case 'social':
   ground+=polygon([[5.3,2,.05],[9.1,2,.05],[9.1,8,.05],[5.3,8,.05]],'#e9dfcb','#c3b7a9',.9);
   for(const y of [1.2,3.6,6]){wall+=pane(.55,y,3.9,y,1.65,'#b8c4bd',.67);furn+=seat(1.1,y+.5,2.2,.65);}
   furn+=prism(6.05,4,.1,2.9,1.5,.7,'#c7ad8c');for(const yy of [3.4,6])furn+=seat(6.3,yy,2.1,.4,false);
   cover(.4,.4,9.6,9.6,3.45,{color:'#c9d6d1'});
   markers={Individual:[2,4.2,.9],Collective:[7.5,4.8,.9],Threshold:[3.2,3.6,1.65]};break;
  case 'pockets':
   ground+=pathStrip(4.65,5.5,0,10);
   for(const [cx,cy] of [[2.1,2],[7.5,3],[2.4,7.7]]){
     ground+=polygon([[cx-1.7,cy-1.15,.07],[cx+1.7,cy-1.15,.07],[cx+1.7,cy+1.15,.07],[cx-1.7,cy+1.15,.07]],'#e4dccc','#a6b4aa',.8);
     furn+=seat(cx-1.15,cy-.4,2.3,.55,false);
     roof+=roofPlate(cx-1.55,cy-1.3,cx+1.55,cy+1.3,3.1+(cy/10)*.7,{color:cy>7?'#d4ceb9':'#b9cecb',translucent:true,angle:.28});
     roof+=columns([[cx-1.4,cy-1.15],[cx+1.4,cy+1.15]],3.1+(cy/10)*.7);
   }
   humanParts+=tree(7.6,8.3);markers={Occupation:[2.1,2,.5],Threshold:[5,4,.1],Shelter:[7.5,3,3.3]};break;
  case 'court':
   ground+=polygon([[3.05,3.05,.06],[6.95,3.05,.06],[6.95,6.95,.06],[3.05,6.95,.06]],'#c4d5be','#8caa98',1);
   humanParts+=tree(5,5);ground+=routeDashes(8.5,0,8.5,10);
   for(const y of [2,7.1])furn+=seat(2.4,y,4.1,.52,false);
   for(const [a,b,c,d] of [[.45,.45,9.55,2.9],[.45,7.1,9.55,9.55],[.45,2.9,2.8,7.1],[7.2,2.9,9.55,7.1]])roof+=roofPlate(a,b,c,d,3.35,{color:'#c5d8cf',translucent:true});
   roof+=columns([[.8,.8],[9.2,.8],[.8,9.2],[9.2,9.2]],3.35);
   markers={Void:[5,5,.05],Movement:[8.5,5,.08],Occupation:[3.5,7,.5]};break;
  case 'tier':
   ground+=pathStrip(8.2,9.4,0,10);
   for(let k=0;k<5;k++)furn+=prism(.8,1+k*1.2,.05,6.2,.94,.26+k*.16,k%2?'#cdb492':'#ddc4a2');
   roof+=roofPlate(.45,.5,8.25,9.55,4,{color:'#c9d5d2',translucent:true,angle:.4});roof+=columns([[.75,.75],[8.1,.75],[.75,9.15],[8.1,9.15]],4);
   markers={Levels:[4.3,5.8,1.1],Circulation:[8.65,5,.07],Shelter:[7.6,2.2,4.1]};break;
  case 'adaptable':
   ground+=pathStrip(4.65,5.65,0,10);ground+=routeDashes(5.15,0,5.15,10);
   for(const [x,y] of [[1.5,1.5],[2.7,4.2],[1.5,7.2],[6.8,2],[7.6,5.1],[6.8,7.4]])furn+=prism(x,y,.05,1.25,.8,.4,'#b4c8b3');
   for(const [x,y] of [[2.3,3.3],[7.6,6]])wall+=pane(x,y,x+1.6,y+1.1,1.5,'#c1caca',.72);
   cover(.4,.4,9.6,9.6,3.4,{color:'#c0d3d1'});
   markers={Adaptation:[2.5,4.5,.55],Movement:[5.15,5,.06],Shelter:[7,1,3.4]};break;
  default:
   ground+=pathStrip(4.4,5.6,0,10);roof+=roofPlate(.4,.4,9.6,9.6,3.4,{color:'#c8d8d3',translucent:true});roof+=columns([[.8,.8],[9.2,.8],[.8,9.2],[9.2,9.2]],3.4);
   markers={'Unresolved form':[5,5,.1]};break;
 }
 humanParts+=human(9.6,9.1)+human(4.9,1.2);
 return {shapes:ground+furn+wall+roof+humanParts,markers};
}
function wraps(str,max=43,limit=3){let rows=[''];for(const word of text(str).split(/\s+/)){const i=rows.length-1;if((rows[i]+' '+word).trim().length>max&&rows[i]){if(rows.length===limit){rows[i]=rows[i].slice(0,max-2)+'…';break;}rows.push(word);}else rows[i]=(rows[i]+' '+word).trim();}return rows;}
function multi(str,x,y,{size=13,max=48,lines=2,line=17,color='#2b4853',weight='400'}={}){return `<text x="${x}" y="${y}" fill="${color}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${weight}">${wraps(str,max,lines).map((t,i)=>`<tspan x="${x}" dy="${i?line:0}">${escape(t)}</tspan>`).join('')}</text>`;}
export function renderPropositionSVG(spec,{width=1180,height=790}={}){
  const {shapes,markers}=graphicFor(spec);const anns=(spec.annotations||[]).slice(0,3);
  const pins=anns.map((a,i)=>{const p=P(...(markers[a.heading]||[5,5,.1]));return `<circle cx="${p[0]}" cy="${p[1]}" r="13" fill="#fff" stroke="#28586a" stroke-width="2.2"/><text x="${p[0]}" y="${p[1]+4.6}" text-anchor="middle" font-size="12" font-weight="700" fill="#28586a" font-family="Arial">${i+1}</text>`;}).join('');
  const notes=anns.map((a,i)=>{const y=190+i*152;return `<rect x="767" y="${y}" width="375" height="137" rx="11" fill="#fff" stroke="#d6e2e0"/><circle cx="788" cy="${y+24}" r="12" fill="#254d60"/><text x="788" y="${y+28.5}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" font-family="Arial">${i+1}</text>${multi(a.heading,810,y+28,{size:17,weight:'700',max:36,lines:1})}${multi(a.form,783,y+53,{size:12,max:53,lines:2,line:17})}${multi(a.grounded?'SOURCE: '+a.sourceText:'SYSTEM ASSUMPTION — verify before use',783,y+94,{size:10,max:65,lines:2,line:14,color:a.grounded?'#37706f':'#956b48'})}`;}).join('');
  const score=Number.isFinite(Number(spec.documentedScore))?`Documentary support: ${spec.documentedScore} points`:'Documentary support: not scored';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1180 790" role="img" aria-label="${escape(spec.title)}: ${escape(spec.layout)}">
  <rect width="1180" height="790" fill="#f7f8f6"/>
  <text x="37" y="32" font-family="Arial" font-size="12" fill="#517080" letter-spacing="1.7">TRACEWORK / ARCHITECTURAL PROPOSITION / PATHWAY ${spec.ordinal}</text>
  ${multi(spec.title,37,72,{size:26,max:66,lines:1,weight:'700',color:'#223e4c'})}
  ${multi(spec.layout,38,101,{size:13,max:90,lines:1,color:'#56717e'})}
  <rect x="24" y="132" width="725" height="557" rx="15" fill="#e8eeeb" stroke="#d3ddda"/>
  <path d="M38 589L742 250" fill="none" stroke="#fff" stroke-width="1" opacity=".5"/>
  <g transform="translate(44,85)">${shapes}${pins}</g>
  <text x="47" y="666" font-family="Arial" font-size="11" fill="#526a77">AXONOMETRIC CONCEPT STUDY · NOT TO SCALE · SPATIAL RULES REQUIRE DESIGNER REVIEW</text>
  <text x="767" y="151" font-family="Arial" font-size="12" font-weight="700" fill="#536e78" letter-spacing=".8">ARCHITECTURAL FEATURES AND REASONING</text>
  ${notes}
  <rect x="765" y="653" width="378" height="40" rx="7" fill="#e6eeeb"/>${multi(score,777,678,{size:13,max:49,lines:1,weight:'700'})}
  <path d="M28 719H1144" stroke="#d3dedb"/>
  ${multi('SOURCE MOVE: '+(spec.sourceStatement||'No specified spatial consequence'),38,740,{size:12,max:164,lines:2,line:17,color:'#405a63'})}
  <text x="39" y="778" font-family="Arial" font-size="10" fill="#70838a">System interpretation is NOT a documented designer drawing, performance test or buildable model. Do not use as a final design without verification.</text>
  </svg>`;
}
export function propositionMarkdown(spec){
  return `# ${spec.title}\n\n**Map scope:** ${spec.mode.replaceAll('-',' ')}\n**Spatial direction:** ${spec.layout}\n**Documented branch:** ${spec.branchTitle}\n**Documentary support:** ${spec.documentedScore??'not scored'} (not architectural quality)\n**Status:** Procedural concept, not participant drawing or validated design\n\n## Primary source statement\n${spec.sourceStatement||'No sufficiently specific design move recorded'}\n\n## Architectural translation\n${spec.annotations.map((a,i)=>`${i+1}. **${a.heading}:** ${a.form}\n   - ${a.grounded?`Linked statement [${a.sourceId}]: ${a.sourceText}`:'System assumption, not recorded evidence'}`).join('\n')}\n\n## Scoring basis\n${Object.entries(spec.scoreCriteria||{}).map(([k,v])=>`- ${k}: ${v}`).join('\n')}\n\n## Verification required\n${spec.note}\n`;
}
