// D2: optional, trace-preserving interpretation aids. None of these functions mutate a trace.
import { getFramework, frameworkRoleForNode } from '../core/frameworks.js';
import { classifyThought } from '../input/thought-classifier.js';

const cut=(t,n=100)=>String(t||'').trim().replace(/\s+/g,' ').slice(0,n);
const typeNames={input:'Input',interpretation:'Interpretation',grounding:'Grounding',consequence:'Spatial Consequence',evaluation:'Evaluation',goal:'Goal',note:'Unclassified Note'};
function contextTerm({state,hotspot,node}={}){
  const h=hotspot||state?.hotspots?.find(x=>x.id===state?.selectedHotspotId);
  return cut(h?.text||node?.label||state?.brief||'the brief',65);
}
function distinct(prompts){const used=new Set();return prompts.filter(p=>{if(used.has(p.id))return false;used.add(p.id);return true;});}
function semanticSignals(text){
  const t=String(text||'').toLowerCase();
  return {movement:/circulat|route|walk|pedestrian|passage|access|movement|unobstruct/.test(t),
    seating:/seats?|bench|sit|occupan|capacity|group/.test(t),
    privacy:/privac|separat|quiet|individual|visual|focus/.test(t),
    flexible:/flexib|adapt|movable|reconfigur|change/.test(t),
    climate:/shelter|shade|heat|rain|sun|wind|canopy/.test(t)};
}
function guidanceForContext(state,hotspot,node){
  const term=contextTerm({state,hotspot,node});
  const fullText=[term,state?.brief,node?.label].filter(Boolean).join(' ');
  const signals=semanticSignals(fullText);
  const prompts=[];
  const add=(id,heading,question,draft,role,why)=>prompts.push({id,heading,question,draft,role,why});
  if(signals.privacy)add('privacy','Visual separation',`What would “${term}” mean for visibility between different users?`,`Visual separation could be achieved by `,'interpretation','Distinguishes a desired degree of privacy from an architectural proposal.');
  if(signals.seating)add('capacity','Capacity and occupancy',`What user activity and capacity does “${term}” need to support?`,`The seating arrangement needs to account for `,'grounding','Makes the use condition explicit before a seating move is evaluated.');
  if(signals.movement)add('circulation','Movement and access',`How might “${term}” affect the main circulation route?`,`The proposed arrangement must preserve `,'evaluation','Tests a possible spatial consequence against access.');
  if(signals.flexible)add('change','Degrees of change',`Does “${term}” require movable components or different uses of a fixed space?`,`This flexibility could mean `,'interpretation','Separates an ambiguous quality from an assumed physical solution.');
  if(signals.climate)add('shelter','Environmental condition',`Where does “${term}” imply shade, shelter or weather protection?`,`The spatial response could position `,'consequence','Makes an environmental requirement spatially testable.');
  add('meaning','Clarify the language',`Which interpretation of “${term}” is being followed, and what alternative remains possible?`,`In this project, “${term}” could mean `,'interpretation','Records an interpretation rather than assuming a shared meaning.');
  add('support','Document the basis',`What observation, source or assumption supports this reading of “${term}”?`,`This reading is supported by `,'grounding','Distinguishes evidence from interpretation.');
  add('move','Make a spatial move',`What arrangement, element or movement could make “${term}” architectural?`,`One possible spatial move is to `,'consequence','Turns language into a design proposition that can be drawn or compared.');
  return distinct(prompts);
}
export function startSuggestions(state,hotspot=null){
  const base=guidanceForContext(state,hotspot,null);
  return base.slice(0,5);
}
export function nextSuggestions(state,node=null,hotspot=null){
  const base=guidanceForContext(state,hotspot,node);
  if(!node)return base.slice(0,5);
  const type=node.type;
  const questions={
    input:[{id:'read',heading:'Interpret the statement',question:`What does “${cut(node.label,75)}” mean in this project?`,draft:'This could mean ',role:'interpretation',why:'Elicit one possible reading, without assuming it is the only reading.'}],
    interpretation:[{id:'justify',heading:'Support this interpretation',question:`Why is this reading of “${cut(node.label,75)}” appropriate here?`,draft:'The basis for this interpretation is ',role:'grounding',why:'Identify what would support or challenge the reading.'}],
    grounding:[{id:'spatialise',heading:'Translate into space',question:`If this reasoning holds, what specific spatial element or arrangement might follow?`,draft:'One spatial consequence is to ',role:'consequence',why:'Make the effect observable and testable.'}],
    consequence:[{id:'test',heading:'Test the consequence',question:`What does “${cut(node.label,70)}” help, constrain or compromise?`,draft:'This option improves ',role:'evaluation',why:'Compare use, access and trade-offs instead of assuming the design succeeds.'}],
    evaluation:[{id:'value',heading:'Identify the priority',question:`Which design value does this judgement prioritise?`,draft:'The design priority is to ',role:'goal',why:'Make the stated trade-off accountable to a goal.'}],
    goal:[{id:'revisit',heading:'Check the proposed goal',question:`Which spatial moves actually support “${cut(node.label,70)}”, and which remain untested?`,draft:'This goal remains to be tested through ',role:'evaluation',why:'A goal does not itself establish that it has been achieved.'}],
    note:[{id:'open',heading:'Develop this thought',question:`What does “${cut(node.label,70)}” imply, and should it remain unclassified?`,draft:'',role:'note',why:'Freeform does not require an assigned role.'}]
  };
  const connected=(state?.edges||[]).filter(e=>e.source===node.id||e.target===node.id).length;
  const prompts=[...(questions[type]||[])];
  if(connected===0) prompts.push({id:'connect',heading:'Trace a relationship',question:'Does this thought depend on a brief requirement or another existing thought?',draft:'This thought relates to ',role:'grounding',why:'A disconnected node may have a missing relationship, but being disconnected is not necessarily an error.'});
  if(type==='consequence'||type==='evaluation') prompts.push({id:'alternative',heading:'Explore an alternative',question:'What different spatial strategy could pursue the same aim?',draft:'An alternative approach would be to ',role:'consequence',why:'Creates a comparable option rather than treating a first solution as final.'});
  return distinct([...prompts,...base]).slice(0,6);
}
export function compareFrameworkReadings(state,frameworkA,frameworkB,visibleIds=null){
  const a=getFramework(frameworkA),b=getFramework(frameworkB);
  const selected=(state?.nodes||[]).filter(n=>!visibleIds||visibleIds.has(n.id));
  const rows=selected.map(n=>{
    const read=(framework)=>{
      if(framework.id==='freeform')return {label:'Unclassified until revealed',kind:'open'};
      if(n.type==='note')return {label:'Unclassified Note',kind:'recorded'};
      const role=frameworkRoleForNode(n,framework.id);
      const recorded=framework.id==='tracework'||Boolean(n.meta?.frameworkRoles?.[framework.id]);
      return {label:role?.label||typeNames[n.type]||'Not assigned',kind:recorded?'recorded':'inferred'};
    };
    return {id:n.id,label:n.label,type:n.type,origin:n.meta?.provenance||'Not recorded',a:read(a),b:read(b)};
  });
  return {a,b,rows,differences:rows.filter(x=>x.a.label!==x.b.label).length};
}
const provenanceNames={designer:'Designer',collaborator:'Collaborator',tutor:'Reviewer',organisation:'Organisation',system:'Software Tool',other:'Other or Unspecified',participant:'Previously Recorded Participant',researcher:'Previously Recorded Researcher'};
export function decisionDigest(state){
  const nodes=state?.nodes||[],edges=state?.edges||[];
  const counts={};for(const n of nodes){const key=n.status||'active';counts[key]=(counts[key]||0)+1;}
  const group=type=>nodes.filter(n=>n.type===type);
  const choices=group('consequence');
  const evaluations=group('evaluation');
  const goals=group('goal');
  const branches=[...new Set(nodes.map(n=>n.branchId).filter(Boolean))];
  const disconnected=nodes.filter(n=>n.type!=='input'&&!edges.some(e=>e.source===n.id||e.target===n.id));
  const ungrounded=nodes.filter(n=>n.type==='consequence'&&!edges.some(e=>e.target===n.id && ['grounding','interpretation','input'].includes(nodes.find(x=>x.id===e.source)?.type)));
  const withRecords=nodes.filter(n=>n.meta?.recordTitle||n.meta?.sourceReference||n.meta?.evidenceKind && n.meta.evidenceKind!=='unspecified');
  const lines=['# TRACEWORK — Decision Digest','',`Project: ${state?.projectName||'Untitled Trace'}`,'Generated from recorded nodes and connections; no outcomes or authorship independently verified.','',
    `## Snapshot`,`${nodes.length} nodes, ${edges.length} connections, ${branches.length} branch IDs.`,
    `Statuses: ${Object.entries(counts).map(([k,v])=>`${k}: ${v}`).join(', ')||'none'}.`,'',
    '## Spatial Propositions',...(choices.length?choices.map(n=>`- [${n.status||'active'}] ${cut(n.label,350)} — Attribution: ${provenanceNames[n.meta?.provenance]||n.meta?.provenance||'Not specified'}${n.meta?.attributionName?` (${n.meta.attributionName})`:''}`):['- None recorded.']),'',
    '## Evaluations and Trade-offs',...(evaluations.length?evaluations.map(n=>`- [${n.status||'active'}] ${cut(n.label,350)}`):['- None recorded.']),'',
    '## Stated Design Goals',...(goals.length?goals.map(n=>`- ${cut(n.label,350)}`):['- None recorded.']),'',
    '## Supporting Records',...(withRecords.length?withRecords.map(n=>`- ${cut(n.label,120)} — ${n.meta?.recordTitle||n.meta?.sourceReference||n.meta?.evidenceKind||'Unspecified'}${n.meta?.sourceReference?` (${n.meta.sourceReference})`:''}`):['- No supporting records recorded.']),'',
    '## Questions for Review',`- ${disconnected.length} non-input nodes have no recorded connections. This may be intentional.`,`- ${ungrounded.length} spatial propositions lack a direct incoming link from an Input, Interpretation or Grounding node. This is a trace check, not a judgement of validity.`,'',
    '## Interpretation Limitations','- Categories assigned by a selected framework are analytical readings, not proof of a designer or participant’s historical method.','- Rejected and provisional ideas are retained in the digest; they should not be presented as accepted final decisions.'];
  return {markdown:lines.join('\n'),nodes,edges,counts,branches,choices,evaluations,goals,disconnected,ungrounded,withRecords};
}
export function roleRecognitionSamples(){
  return ['Introduce movable screens to divide the room.','This creates a quieter study area.','The aim is to support different study styles.','The screens narrow circulation, which compromises access.','I interpret flexibility as changing the spatial layout.'].map(text=>({text,...classifyThought(text)}));
}
