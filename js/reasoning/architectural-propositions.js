// TRACEWORK D2.7 — evidence-led design studies: aggregate synthesis across the full reasoning network.
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
// Whole-map synthesis: combinations come from the entire visible Aggregate network,
// not just a hotspot or a single branch. This is deterministic procedural inference;
// it does NOT impersonate free-form model generation or claim participant authorship.
export function aggregateFormOptions(state,scoped,{min=3,max=5}={}){
 const nodes=(scoped?.nodes||state.nodes||[]).filter(sourceNode).filter(live);
 const edges=(scoped?.edges||state.edges||[]).filter(e=>e.status!=='rejected'&&!e.meta?.artifact);
 if(!nodes.some(n=>n.type==='consequence'||n.type==='interpretation'||n.type==='note'))return [];
 const analysis=scoreStrategies(nodes), themes=analysis.ordered.filter(k=>analysis.scores[k]>=3&&(analysis.sources[k]||[]).length);
 if(!themes.length)return [];
 const byId=new Map(nodes.map(n=>[n.id,n]));
 const neighbours=new Map(nodes.map(n=>[n.id,new Set()]));
 for(const e of edges){if(neighbours.has(e.source)&&neighbours.has(e.target)){neighbours.get(e.source).add(e.target);neighbours.get(e.target).add(e.source);}}
 const primaryNodes=k=>nodes.filter(n=>['consequence','interpretation','note'].includes(n.type)&&patterns[k].test(n.label||''));
 const linksBetween=(a,b)=>{
  if(!b)return false;
  const targets=new Set(primaryNodes(b).map(n=>n.id));
  for(const source of primaryNodes(a)){
   const visited=new Set([source.id]), queue=[[source.id,0]];
   while(queue.length){const [id,depth]=queue.shift();if(depth>0&&targets.has(id))return true;
    if(depth>=3)continue;
    for(const next of neighbours.get(id)||[])if(!visited.has(next)){visited.add(next);queue.push([next,depth+1]);}
   }
  }
  return false;
 };
 // Five genuinely different morphological investigations. The formal families
 // are assigned AFTER identifying dominant and linked intentions in the map.
 const affinities={
  movement:['ribbon','fold','cluster','ring','petals'],privacy:['fold','cluster','ring','petals','ribbon'],
  capacity:['cluster','fold','ring','ribbon','petals'],climate:['petals','ribbon','fold','cluster','ring'],
  duration:['ribbon','cluster','fold','petals','ring'],social:['ring','petals','cluster','fold','ribbon'],
  pockets:['cluster','petals','fold','ring','ribbon'],court:['ring','petals','fold','ribbon','cluster'],
  tier:['fold','ring','cluster','petals','ribbon'],adaptable:['cluster','ribbon','fold','petals','ring'],
  greenery:['petals','cluster','ring','ribbon','fold']};
 const count=Math.max(3,Math.min(5,max,Math.max(min,Math.min(5,themes.length+2))));
 const used=new Set(), result=[];
 for(let i=0;i<count;i++){
  const primary=themes[i%themes.length];
  // Promote independent pathways with high evidence coverage, but allow creative
  // cross-branch synthesis; never pretend an unconnected synthesis was recorded.
  const other=themes.filter(k=>k!==primary).sort((a,b)=>
   Number(linksBetween(primary,b))-Number(linksBetween(primary,a)) ||
   analysis.scores[b]-analysis.scores[a] || a.localeCompare(b));
  const secondary=other.length?other[Math.floor(i/themes.length)%Math.min(other.length,3)]:null;
  const pairedConnected=linksBetween(primary,secondary);
  const prefer=[...(affinities[primary]||['fold','ribbon','cluster','ring','petals']),...(affinities[secondary]||[])];
  const family=prefer.find(x=>!used.has(x))||['cluster','ring','petals','ribbon','fold'].find(x=>!used.has(x))||'fold';
  used.add(family);
  const supporting=new Set();
  for(const k of [primary,secondary].filter(Boolean)){
   for(const n of primaryNodes(k).slice(0,12)){
    supporting.add(n.id);
    for(const id of neighbours.get(n.id)||[])supporting.add(id);
   }
  }
  const evidence=nodes.filter(n=>supporting.has(n.id));
  const evidenceIds=new Set(evidence.map(n=>n.id));
  const relevantEdges=edges.filter(e=>evidenceIds.has(e.source)&&evidenceIds.has(e.target));
  const {score,criteria}=optionScore(evidence,relevantEdges);
  const components=[primary,secondary].filter(Boolean).map(k=>({key:k,score:analysis.scores[k],
   sourceId:primaryNodes(k).find(n=>n.type==='consequence')?.id||primaryNodes(k)[0]?.id||null,
   sourceText:primaryNodes(k).find(n=>n.type==='consequence')?.label||primaryNodes(k)[0]?.label||''}));
  result.push({id:`aggregate-combination-${i+1}`,strategy:primary,
   title:secondary?`${formLabels[primary]} + ${formLabels[secondary]}`:formLabels[primary],
   formalVariant:family,aggregateThemes:components,aggregateNetworkCount:nodes.length,
   linkedEvidence:pairedConnected,sourceIds:[...evidenceIds],
   translation:secondary&&!pairedConnected?'speculative':'source-led',
   nodes:evidence,edges:relevantEdges,score,criteria,variation:i});
 }
 return result;
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
  const aggregateThemes=mode==='aggregate'?(option?.aggregateThemes||[]):[];
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
    ?`Form study ${String(ordinal).padStart(2,'0')} · ${formLabels[strategy].split(' and ')[0]}`
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
  // Aggregate is a system-made FORM hypothesis, not a completed building.
  // Do not attach the Focus typology's implied building pieces to abstract forms.
  if(mode==='aggregate'){
    const family=option?.formalVariant||'fold';
    const familyLogic={
      cluster:'A distributed set of activity islands shares circulation and selective thresholds',
      ring:'A connected occupied perimeter frames a central void and controlled access',
      petals:'Directional wings respond differently around an identifiable common focus',
      ribbon:'Continuous bands organise routes, stopping places and intervening zones',
      fold:'A succession of folded planes differentiates open, screened and occupied edges'
    };
    annotations.length=0;
    const first=aggregateThemes[0];const second=aggregateThemes[1];
    annotations.push({heading:'Recorded intention A',form:formLabels[first?.key||strategy],
      sourceId:first?.sourceId||lead?.id||null,sourceText:first?.sourceText||lead?.label||'',
      grounded:Boolean(first?.sourceId||lead),status:'Recorded spatial intention; formalisation remains interpretive'});
    annotations.push({heading:second?'Recorded intention B':'Alternative interpretation',
      form:second?formLabels[second.key]:'A different spatial organisation explored from the available evidence',
      sourceId:second?.sourceId||null,sourceText:second?.sourceText||'',grounded:Boolean(second?.sourceId),
      status:second?'Recorded additional intention across the wider map':'Additional spatial relation is system-proposed'});
    annotations.push({heading:'Combined architectural hypothesis',form:familyLogic[family]||familyLogic.fold,
      sourceId:null,sourceText:'',grounded:false,
      status:option?.linkedEvidence?'Linked intentions within the trace; geometry is inferred':'Cross-branch synthesis; spatial relationship is proposed, not recorded'});
  }
  // A whole pavilion also communicates sourced secondary moves, rather than only
  // the single primary visual taxonomy. Secondary features are drawn below.
  if(mode!=='aggregate'){
    for(const m of secondary.slice(0,4)){
      const form={privacy:'Graduated edge screening and seating intimacy',social:'Individual / collective occupation zones',movement:'An independent through-route',capacity:'Reconfigurable seating within shelter',climate:'Passive shade and ventilation layers',duration:'Short-stay perches versus deeper occupation',pockets:'Clustered smaller pause places',court:'Open planted centre',tier:'Changes of level for occupation',adaptable:'Moveable occupation modules'}[m.key];
      if(form)annotations.push({heading:named[m.key].replace(' pavilion',''),form,sourceId:m.source.id,sourceText:m.source.label,grounded:true,status:'Additional recorded spatial move translated into the complete scheme'});
    }
  }
  const {score,criteria}=option?{score:option.score,criteria:option.criteria}:optionScore(nodes,scoped?.edges||[]);
  return {id:`prop-${Date.now()}-${ordinal}`,title,mode,ordinal,architecture,strategy,concept:mode==='aggregate'?formLabels[strategy]:strategyName,
    formalVariant:option?.formalVariant||(['movement','duration','adaptable'].includes(strategy)?'ribbon':['court','social','privacy'].includes(strategy)?'ring':['pockets','climate'].includes(strategy)?'petals':'fold'),
    translation:option?.translation||'source-led',aggregateThemes,aggregateNetworkCount:option?.aggregateNetworkCount||0,
    linkedEvidence:!!option?.linkedEvidence,
    secondaryMoves:secondary.map(x=>({key:x.key,sourceId:x.source.id,sourceText:x.source.label})),
    fullPavilion:mode!=='aggregate',briefChecks:checks,
    layout:mode==='aggregate'&&aggregateThemes[1]?`${formLabels[strategy]} × ${formLabels[aggregateThemes[1].key]}`:formLabels[strategy],branchId:option?.id||null,branchTitle:option?.title||lead?.label||'Visible trace',
    documentedScore:score,scoreCriteria:criteria,annotations,sourceIds:[...new Set(all.map(n=>n.id))],
    recordedClaims:annotations.filter(a=>a.grounded).length,assumptions:annotations.filter(a=>!a.grounded).map(a=>a.form),
    sourceStatement:lead?.label||'',sourceStatementId:lead?.id||null,
    note:mode==='aggregate'?`Whole-map synthesis from ${option?.aggregateNetworkCount||nodes.length} considered reasoning nodes. Recorded intentions are evidence; their spatial combination and form are hypotheses, not validated plans, participant drawings or free-form AI output.`:'Coordinated whole-project design option from this pathway. Roof, access route, spatial zoning and occupation are proposed together; seating, footprints, structural integrity, shelter and accessibility are NOT verified.',
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
 const kind=spec.formalVariant||'fold';let ground='',furn='',roof='',wall='',humanParts='',markers={};
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
 // Compose secondary/tertiary programme directly from BOTH recorded intentions.
 const moves=new Set([spec.strategy,...(spec.aggregateThemes||[]).map(m=>m.key),...(spec.secondaryMoves||[]).map(m=>m.key)]);
 if(['movement','duration','adaptable'].some(k=>moves.has(k))){
   const trace=kind==='ring'?[[1.3,5,.07],[3,8.4,.07],[7.3,8.4,.07],[8.7,5,.07]]:
     kind==='cluster'?[[1.4,1.8,.07],[3.8,4.5,.07],[6,5.2,.07],[8.6,8.6,.07]]:
     [[1.1,5,.07],[3.5,5,.07],[6.1,5,.07],[8.9,5,.07]];
   for(let i=1;i<trace.length;i++)ground+=segment(trace[i-1],trace[i],'#288991',3.1,'stroke-dasharray="7 5"');
 }
 if(moves.has('privacy')){
   wall+=curvingScreen(4.7,5.5,2.4,3.1,-1.7,-.35,2.05,'#94afa7');
   wall+=curvingScreen(4.7,5.5,3.5,4.0,-1.7,-.6,1.25,'#c6d0bc');
 }
 if(moves.has('capacity')||moves.has('adaptable')){
   for(const [x,y] of [[2.1,2.15],[3.0,6.7],[7.6,3.1],[7.1,7.3]])furn+=prism(x,y,.09,.54,.59,.38,'#b6b08c');
 }
 if(moves.has('social')){
   furn+=arcBench(5.1,5.0,1.3,1.03,.15,2.2);
   ground+=halo(5,5,.85,.8,.04,'#d3c39f',.55);
 }
 if(moves.has('climate')){
   for(let i=0;i<4;i++)roof+=segment([1+i*2,1.1,3.62],[1+i*2,8.8,3.62],'#5e9c9b',.95,'stroke-dasharray="3 5"');
 }
 if(moves.has('tier')){
   for(let i=0;i<3;i++)furn+=prism(.9+i*.75,8.4-i*.2,.04,2.2,.44,.17+i*.18,'#bdba9d');
 }
 if(moves.has('greenery')){
   humanParts+=tree(.35,.5)+tree(9.55,9.25);
 }
 if(moves.has('duration')){
   for(const [x,y] of [[1.2,1.25],[7.5,8.1]])furn+=seat(x,y,1.3,.36,false);
 }
 if(moves.has('court')&&kind!=='ring')ground+=halo(5,5,1.5,1.35,.04,'#cadfce',.70);
 // Human scale and a translucent site datum are useful, but do not pretend
 // that approximate geometry proves access, engineering or occupancy.
 ground+=human(10.2,8.2)+human(-.1,5.2);
 return {shapes:ground+furn+wall+roof+humanParts,markers,geometry:geometricTrace(spec.strategy)};
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
// Explicit aggregate diagram: morphology and occupation paths are presented
// beside the axonometric so a formal hypothesis can be evaluated in plan.
function aggregateFormPlan(spec){
 const family=spec.formalVariant||'fold',x=72,y=222,s=137;
 const dot=(u,v,r=4)=>`<circle cx="${x+u*s}" cy="${y+v*s}" r="${r}" fill="#c4a37c" stroke="#90785b" stroke-width=".7"/>`;
 const p=(u,v)=>`${(x+u*s).toFixed(1)},${(y+v*s).toFixed(1)}`;
 let shape=`<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="7" fill="#f5f7f3" stroke="#adc0be" stroke-width="1.1"/>`;
 const area='fill="#b7d7d0" stroke="#49838a" stroke-width="1.7"';
 const lane='fill="none" stroke="#438a8d" stroke-width="2.5" stroke-dasharray="5 4"';
 if(family==='cluster'){
   for(const [u,v,rx,ry] of [[.23,.24,.16,.12],[.72,.20,.12,.14],[.31,.73,.2,.13],[.77,.76,.12,.17]]){
     shape+=`<ellipse cx="${x+u*s}" cy="${y+v*s}" rx="${rx*s}" ry="${ry*s}" ${area}/>`+dot(u,v);
   }
   shape+=`<path d="M${p(.34,.31)} L${p(.62,.23)} M${p(.4,.67)} L${p(.66,.75)} M${p(.31,.38)} L${p(.32,.6)}" ${lane}/>`;
 }else if(family==='ring'){
   shape+=`<circle cx="${x+s*.5}" cy="${y+s*.5}" r="${s*.36}" fill="#b7d7d0" stroke="#43858b" stroke-width="2"/>`;
   shape+=`<circle cx="${x+s*.5}" cy="${y+s*.5}" r="${s*.18}" fill="#f5f7f3" stroke="#8ba69b" stroke-width="1.4"/>`;
   shape+=`<path d="M${p(.5,.1)} A${s*.4},${s*.4} 0 0 1 ${p(.89,.5)} M${p(.5,.9)} A${s*.4},${s*.4} 0 0 1 ${p(.11,.5)}" ${lane}/>`;
   for(const a of [0,Math.PI/2,Math.PI,3*Math.PI/2])shape+=dot(.5+.28*Math.cos(a),.5+.28*Math.sin(a));
 }else if(family==='petals'){
   for(let i=0;i<6;i++){
     const a=i*Math.PI/3+.2;
     const cx=.5+.22*Math.cos(a),cy=.5+.22*Math.sin(a);
     shape+=`<ellipse cx="${x+cx*s}" cy="${y+cy*s}" rx="${s*.27}" ry="${s*.095}" transform="rotate(${a*180/Math.PI} ${x+cx*s} ${y+cy*s})" ${area}/>`;
   }
   shape+=`<circle cx="${x+s*.5}" cy="${y+s*.5}" r="${s*.12}" fill="#c4a37c"/>`;
 }else if(family==='ribbon'){
   for(const offset of [-.17,.17])shape+=`<path d="M${p(.07,.42+offset)} C${p(.29,.08+offset)} ${p(.55,.85+offset)} ${p(.93,.47+offset)}" fill="none" stroke="#9cc7bd" stroke-width="18" stroke-linecap="round"/>`;
   shape+=`<path d="M${p(.04,.5)} C${p(.35,.15)} ${p(.55,.86)} ${p(.97,.5)}" ${lane}/>`;
   shape+=dot(.23,.3)+dot(.76,.67);
 }else{
   const pts=[[.1,.8],[.26,.25],[.42,.66],[.57,.17],[.72,.62],[.9,.2]];
   shape+=`<polygon points="${pts.map(([u,v])=>p(u,v)).join(' ')} ${p(.9,.8)} ${p(.1,.88)}" ${area}/>`;
   shape+=`<path d="${pts.map(([u,v],i)=>`${i?'L':'M'}${p(u,v)}`).join(' ')}" fill="none" stroke="#4c8283" stroke-width="2"/>`;
   for(const [u,v] of [[.21,.78],[.53,.77],[.82,.76]])shape+=dot(u,v);
 }
 // Distinguish the two evidenced intentions as graphically independent moves.
 // Both marks are derived from the same aggregateThemes used in the axon.
 const combo=new Set((spec.aggregateThemes||[]).map(m=>m.key));
 if(combo.has('pockets'))for(const [u,v] of [[.16,.24],[.78,.30],[.25,.72],[.77,.72]])shape+=`<circle cx="${x+u*s}" cy="${y+v*s}" r="${s*.085}" fill="none" stroke="#b19060" stroke-width="1.5" stroke-dasharray="3 2"/>`;
 if(combo.has('tier'))for(let i=0;i<3;i++)shape+=`<path d="M${p(.10,.68+i*.085)}L${p(.40,.68+i*.085)}" stroke="#b99667" stroke-width="2.6"/>`;
 if(combo.has('privacy'))for(let i=0;i<2;i++)shape+=`<path d="M${p(.14+i*.11,.19)}Q${p(.37+i*.09,.45)} ${p(.14+i*.11,.81)}" fill="none" stroke="#9b8a64" stroke-width="2" stroke-dasharray="3 2"/>`;
 if(combo.has('climate'))for(let i=0;i<4;i++)shape+=`<path d="M${p(.2+i*.17,.05)}l${s*.06} ${s*.10}" fill="none" stroke="#5e9c9b" stroke-width="1.4"/>`;
 if(combo.has('social'))shape+=`<circle cx="${x+s*.5}" cy="${y+s*.5}" r="${s*.12}" fill="#e2d2b4" stroke="#b4956e" stroke-width="1"/>`;
 if(combo.has('capacity')||combo.has('adaptable'))for(let i=0;i<3;i++)shape+=dot(.24+i*.23,.76,2.7);
 // Secondary abstract analysis: the drawing is a testable proposition.
 const strategy=spec.strategy;
 const movement=['movement','duration','adaptable'].includes(strategy);
 if(movement){
   const a=family==='ribbon'?'M'+p(.15,.5)+' C'+p(.33,.12)+' '+p(.63,.88)+' '+p(.85,.48):'M'+p(.10,.54)+' Q'+p(.45,.35)+' '+p(.92,.6);
   shape+=`<path d="${a}" fill="none" stroke="#237e8b" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="4 3"/>`;
   shape+=`<path d="M${p(.86,.55)}L${p(.93,.6)}L${p(.85,.64)}" fill="none" stroke="#237e8b" stroke-width="2"/>`;
 }
 if(strategy==='privacy'){
   for(let i=0;i<3;i++)shape+=`<path d="M${p(.13+i*.065,.17)} Q${p(.28+i*.065,.50)} ${p(.11+i*.065,.84)}" fill="none" stroke="#9b8a64" stroke-width="${2.7-i*.5}" stroke-dasharray="2 2"/>`;
 }
 if(strategy==='social'){
   shape+=`<circle cx="${x+.5*s}" cy="${y+.49*s}" r="${.115*s}" fill="#ddc8a2" stroke="#ab8a65" stroke-width="1.3"/>`;
   for(let i=0;i<6;i++){const a=i*Math.PI/3;shape+=dot(.5+.20*Math.cos(a),.49+.20*Math.sin(a),2.1);}
 }
 if(strategy==='climate'){
   for(let i=0;i<5;i++)shape+=`<path d="M${p(.1+i*.17,.08)}l${s*.09} ${s*.10}" fill="none" stroke="#5e9c9b" stroke-width="1.4" stroke-linecap="round"/>`;
 }
 if(strategy==='capacity'||strategy==='adaptable'){
   for(let i=0;i<3;i++)for(let j=0;j<3;j++)shape+=dot(.23+i*.26,.28+j*.23,2.2);
 }
 const title={cluster:'DISTRIBUTED',ring:'CENTRAL VOID',petals:'RADIAL',ribbon:'CONTINUOUS',fold:'FOLDED FIELD'}[family]||'FORM';
 return `<rect x="44" y="150" width="189" height="238" rx="12" fill="#fff" fill-opacity=".97" stroke="#d5e1df"/>
 <text x="58" y="172" font-size="11" font-family="Arial" font-weight="700" letter-spacing=".3" fill="#506974">FORM RELATIONSHIP / PLAN</text>
 <text x="58" y="191" font-size="10" font-family="Arial" fill="#547581">${title}</text>
 ${shape}
 <circle cx="68" cy="374" r="3.5" fill="#c4a37c"/><text x="78" y="378" font-size="9" font-family="Arial" fill="#617883">potential occupation</text>
 <text x="59" y="402" font-size="9" font-family="Arial" fill="#80969b">Unscaled relationship diagram</text>`;
}
// Section through the speculative family, separate from the plan and axonometric.
// The section is a tectonic suggestion, not a construction drawing.
function aggregateFormSection(spec){
 const family=spec.formalVariant||'fold', x=58,y=444, w=159,h=105;
 const X=u=>x+w*u,Y=v=>y+h*v;
 const L=(pts,color='#62888a',sw=2,fill='none')=>`<path d="${pts.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)).join(' ')}" stroke="${color}" stroke-width="${sw}" fill="${fill}" stroke-linejoin="round" stroke-linecap="round"/>`;
 let art=`<rect x="44" y="418" width="189" height="162" rx="11" fill="#fff" fill-opacity=".97" stroke="#d5e1df"/><text x="57" y="437" font-family="Arial" font-size="11" font-weight="700" letter-spacing=".5" fill="#536e77">SPATIAL SECTION</text>`;
 art+=L([[0,.86],[1,.86]],'#778e88',1.4);
 if(family==='cluster'){
   art+=L([[.04,.46],[.23,.38],[.33,.43]],'#5e9590',5)+L([[.44,.27],[.60,.23],[.69,.29]],'#789ca6',5)+L([[.79,.52],[.97,.43]],'#638f88',5);
   for(const v of [.12,.49,.84])art+=L([[v,.40],[v,.86]],'#7c9d99',1.5);
 }else if(family==='ring'){
   art+=L([[.03,.40],[.20,.29],[.36,.35]],'#5e9590',5)+L([[.64,.35],[.80,.29],[.97,.40]],'#5e9590',5);
   for(const v of [.09,.32,.68,.91])art+=L([[v,.37],[v,.86]],'#7c9d99',1.3);
   art+=`<text x="${X(.5)}" y="${Y(.62)}" text-anchor="middle" font-size="7" fill="#7b928a" font-family="Arial">open centre</text>`;
 }else if(family==='petals'){
   art+=L([[.03,.59],[.24,.27],[.46,.44],[.53,.18],[.74,.42],[.98,.52]],'#58968e',4.2);
   for(const v of [.16,.49,.88])art+=L([[v,.54],[v,.86]],'#7c9d99',1.4);
 }else if(family==='ribbon'){
   art+=`<path d="M${X(.02)} ${Y(.57)} Q${X(.22)} ${Y(.15)} ${X(.43)} ${Y(.41)}T${X(.98)} ${Y(.36)}" fill="none" stroke="#5d9b96" stroke-width="5"/>`;
   art+=L([[.08,.50],[.08,.86]],'#7c9d99',1.6)+L([[.89,.43],[.89,.86]],'#7c9d99',1.6);
 }else{
   art+=L([[.02,.48],[.15,.17],[.31,.51],[.48,.12],[.66,.49],[.83,.17],[.98,.50]],'#5d9791',4.4);
   for(const v of [.08,.31,.66,.94])art+=L([[v,.49],[v,.86]],'#7c9d99',1.6);
 }
 const paired=new Set((spec.aggregateThemes||[]).map(m=>m.key));
 if(paired.has('climate'))for(let i=0;i<5;i++)art+=L([[.12+i*.17,.10],[.08+i*.17,.20]],'#6a9a99',1.3);
 if(paired.has('privacy'))for(const u of [.18,.48,.79])art+=L([[u,.49],[u,.79]],'#9aab9f',1.8);
 if(paired.has('tier'))for(let i=0;i<3;i++)art+=L([[.16+i*.24,.83-i*.07],[.37+i*.24,.83-i*.07]],'#b49b7c',2.4);
 if(paired.has('capacity')||paired.has('adaptable'))for(const u of [.11,.41,.63,.88])art+=L([[u,.80],[u+.04,.80]],'#b49b7c',4);
 // Occupation datum and human scale, intentionally undimensioned.
 for(const v of [.26,.72]){
   art+=L([[v-.045,.79],[v+.045,.79]],'#b59c77',3);
   art+=`<circle cx="${X(v)}" cy="${Y(.65)}" r="3.3" fill="#70858c"/><path d="M${X(v)} ${Y(.69)}v${h*.12}m0 -${h*.045}l-${w*.025} ${h*.05}m${w*.025} -${h*.05}l${w*.025} ${h*.05}" fill="none" stroke="#70858c" stroke-width="1.7"/>`;
 }
 art+=`<text x="57" y="570" font-size="8.6" font-family="Arial" fill="#788d91">Diagrammatic envelope + occupation</text>`;
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
  // In Aggregate each evidence pin has its own position; D2.6 previously
  // piled all three atop one another, obscuring the architectural geometry.
  const pinPlaces=spec.mode==='aggregate'?({
    cluster:[[2.3,3.0,1.0],[8.1,7.5,.55],[5.1,5,3.0]],
    ring:[[1.3,5,.4],[8.2,5,.7],[5,8.0,3.3]],
    petals:[[2.2,2.1,.7],[8,7,.6],[5,5,3.85]],
    ribbon:[[2.2,2.65,.5],[7.7,7.3,.5],[5,3.5,3.2]],
    fold:[[1.7,3,.6],[8,6.8,.6],[4.7,5,4.0]]
   })[spec.formalVariant]||[[2.3,3,.6],[8,7,.6],[5,5,3.5]]:null;
  const pins=anns.map((a,i)=>{const p=P(...(pinPlaces?.[i]||markers[a.heading]||[5,5,.1]));return `<circle cx="${p[0]}" cy="${p[1]}" r="11" fill="#fff" stroke="#28586a" stroke-width="2"/><text x="${p[0]}" y="${p[1]+4.3}" text-anchor="middle" font-size="11" font-weight="700" fill="#28586a" font-family="Arial">${i+1}</text>`;}).join('');
  const notes=anns.map((a,i)=>{const y=190+i*152;return `<rect x="767" y="${y}" width="375" height="137" rx="11" fill="#fff" stroke="#d6e2e0"/><circle cx="788" cy="${y+24}" r="12" fill="#254d60"/><text x="788" y="${y+28.5}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" font-family="Arial">${i+1}</text>${multi(a.heading,810,y+28,{size:17,weight:'700',max:36,lines:1})}${multi(a.form,783,y+53,{size:12,max:53,lines:2,line:17})}${multi(a.grounded?'SOURCE: '+a.sourceText:'SYSTEM ASSUMPTION — verify before use',783,y+94,{size:10,max:65,lines:2,line:14,color:a.grounded?'#37706f':'#956b48'})}`;}).join('');
  const score=Number.isFinite(Number(spec.documentedScore))?`Trace completeness: ${spec.documentedScore} pts`:'Trace completeness: not scored';
  const isAggregate=spec.mode==='aggregate';
  const register=(spec.secondaryMoves||[]).slice(0,4).map((m,i)=>`<text x="${270+(i%2)*235}" y="${154+Math.floor(i/2)*19}" font-family="Arial" font-size="10" fill="#4f6b71">• ${escape(named[m.key].replace(' pavilion',''))}</text>`).join('');
  const plan=isAggregate?aggregateFormPlan(spec):`<rect x="44" y="152" width="189" height="197" rx="12" fill="#fff" fill-opacity=".97" stroke="#d5e1df"/>
    <text x="58" y="175" font-size="11" font-family="Arial" font-weight="700" letter-spacing=".4" fill="#506974">PROGRAMME PLAN</text>
    ${schemePlan(spec)}
    <text x="57" y="334" font-size="9" font-family="Arial" fill="#5c797b">${spec.briefChecks?.some(c=>c.key==='seating')?'• 20 indicative seat loci':'• occupation + access zoning'}</text>
    <text x="57" y="345" font-size="8" font-family="Arial" fill="#82969b">Diagram · not dimensionally tested</text>`;
  const checks=(spec.briefChecks||[]).slice(0,4);
  const checkBand=!isAggregate&&checks.length?`<rect x="765" y="594" width="378" height="52" rx="9" fill="#f5f4ed" stroke="#e0dbce"/>
    <text x="778" y="610" font-family="Arial" font-size="10" fill="#735b42" font-weight="700">BRIEF REQUIREMENTS · VERIFY</text>
    ${checks.map((c,i)=>`<text x="${778+(i%2)*184}" y="${624+Math.floor(i/2)*15}" font-family="Arial" font-size="10" fill="#526c72">□ ${escape(c.label)}</text>`).join('')}`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1180 790" role="img" aria-label="${escape(spec.title)}: ${escape(spec.layout)}">
  <rect width="1180" height="790" fill="#f7f8f6"/>
  <text x="37" y="32" font-family="Arial" font-size="12" fill="#517080" letter-spacing="1.7">TRACEWORK / ${isAggregate?'ABSTRACT FORM TRANSLATION':'COMPLETE DESIGN STUDY'} / ${spec.ordinal}</text>
  ${multi(spec.title,37,72,{size:26,max:66,lines:1,weight:'700',color:'#223e4c'})}
  ${multi(spec.layout,38,101,{size:13,max:90,lines:1,color:'#56717e'})}
  <rect x="24" y="132" width="725" height="557" rx="15" fill="#e8eeeb" stroke="#d3ddda"/>
  <path d="M38 589L742 250" fill="none" stroke="#fff" stroke-width="1" opacity=".5"/>
  <g transform="${isAggregate?'translate(121,83)':'translate(44,85)'}">${shapes}${pins}</g>
  ${plan}
  ${isAggregate?aggregateFormSection(spec):''}
  ${isAggregate?'':register}
  ${isAggregate?`<rect x="248" y="601" width="483" height="86" rx="9" fill="#f9fbf9" fill-opacity=".97" stroke="#c9d8d4"/>
    <text x="263" y="619" font-family="Arial" font-size="10" font-weight="700" letter-spacing=".8" fill="#46636b">COMBINED ARCHITECTURAL INTENTIONS</text>
    ${multi('A  '+(spec.aggregateThemes?.[0]?formLabels[spec.aggregateThemes[0].key]:'Spatial intention to be specified'),263,634,{size:10,max:79,lines:1,color:'#406675'})}
    ${multi('B  '+(spec.aggregateThemes?.[1]?formLabels[spec.aggregateThemes[1].key]:'Alternative spatial reading'),263,649,{size:10,max:79,lines:1,color:'#406675'})}
    ${multi('FORM  '+(spec.annotations?.[2]?.form||'Form relationship requires testing'),263,663,{size:9.5,max:83,lines:1,color:'#406675'})}
    <text x="263" y="678" font-family="Arial" font-size="8.5" fill="#906f4c">Spatial synthesis is inferred · access and performance untested</text>`:''}
  <text x="47" y="697" font-family="Arial" font-size="11" fill="#526a77">${isAggregate?'FORM + PLAN + SECTION · SPECULATIVE SPATIAL TRANSLATION':'PROGRAMME + SITE STUDY · ROUTES, SHELTER AND OCCUPANCY REQUIRE CHECKING'}</text>
  <text x="767" y="151" font-family="Arial" font-size="12" font-weight="700" fill="#536e78" letter-spacing=".8">ARCHITECTURAL FEATURES AND REASONING</text>
  ${notes}
  ${checkBand}
  <rect x="765" y="653" width="378" height="40" rx="7" fill="#e6eeeb"/>${multi(score+' · '+(spec.translation==='speculative'?'ALTERNATIVE TRANSLATION':'SOURCE-LED'),777,678,{size:12,max:57,lines:1,weight:'700'})}
  <path d="M28 719H1144" stroke="#d3dedb"/>
  ${multi(isAggregate?'SYNTHESIS: '+(spec.aggregateThemes||[]).map(m=>formLabels[m.key]).join(' + '):'SOURCE MOVE: '+(spec.sourceStatement||'No specified spatial consequence'),38,740,{size:12,max:164,lines:2,line:17,color:'#405a63'})}
  <text x="39" y="778" font-family="Arial" font-size="10" fill="#70838a">System-generated study, not a participant drawing. Proposals and source reasoning must be evaluated by the designer.</text>
  </svg>`;
}
export function propositionMarkdown(spec){
  return `# ${spec.title}\n\n**Whole-map synthesis:** ${spec.mode==='aggregate'?(spec.aggregateThemes||[]).map(m=>`${m.key}: ${m.sourceText} [${m.sourceId}]`).join(' + '):'Not applicable to selected Focus route'}\n**Aggregate network considered:** ${spec.aggregateNetworkCount||'—'} nodes\n**Evidence relation:** ${spec.linkedEvidence?'Connected within the source network':'Cross-branch or single-direction speculative composition'}\n\n**Brief checks (NOT verified):** ${spec.briefChecks?.length?spec.briefChecks.map(c=>c.label).join('; '):'No stated measurable checks extracted'}\n\n**Map scope:** ${spec.mode.replaceAll('-',' ')}\n**Spatial direction:** ${spec.layout}\n**Documented branch:** ${spec.branchTitle}\n**Documentary support:** ${spec.documentedScore??'not scored'} (not architectural quality)\n**Status:** ${spec.fullPavilion?'Complete pathway design configuration':'Aggregate abstract form study'}; ${spec.translation==='speculative'?'speculative alternative geometry':'source-led spatial translation'}, not participant drawing or validated design\n\n## Primary source statement\n${spec.sourceStatement||'No sufficiently specific design move recorded'}\n\n## Architectural translation\n${spec.annotations.map((a,i)=>`${i+1}. **${a.heading}:** ${a.form}\n   - ${a.grounded?`Linked statement [${a.sourceId}]: ${a.sourceText}`:'System assumption, not recorded evidence'}`).join('\n')}\n\n## Scoring basis\n${Object.entries(spec.scoreCriteria||{}).map(([k,v])=>`- ${k}: ${v}`).join('\n')}\n\n## Verification required\n${spec.note}\n`;
}
