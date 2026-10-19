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
// First-use prompts and downstream prompts are intentionally separate experiences.
// Every draft is a complete, editable *possibility*, never a verified observation.
function guidanceForContext(state,hotspot){
  const term=contextTerm({state,hotspot});
  const brief=String(state?.brief||'');
  const signals=semanticSignals(`${term} ${brief}`);
  const quotes=`“${term}”`;
  const prompts=[];
  const add=(id,heading,question,draft,role,why)=>prompts.push({id,heading,question,draft,role,why});
  if(signals.flexible)add('start-change','Meaning of flexibility',`What kind of change does ${quotes} require?`,`In this project, ${quotes} could describe a space that supports different activities without necessarily moving its physical elements.`,'interpretation','A possible reading of an ambiguous requirement; change it if the brief means something else.');
  if(signals.privacy)add('start-privacy','Individual and group use',`Whose privacy might ${quotes} involve?`,`The pavilion may need different degrees of visual separation between individual study and group activity.`,'interpretation','A possible interpretation to test, not an observed user preference.');
  if(signals.seating)add('start-seating','Seating requirement',`How might ${quotes} affect seating?`,`The seating arrangement could support individual and small-group occupation while allowing the number of users to change.`,'interpretation','Separates the intended pattern of occupation from a specific seating solution.');
  if(signals.movement)add('start-access','Movement and access',`What circulation condition is relevant to ${quotes}?`,`A spatial proposal should be checked against the routes people need to move through the site.`,'grounding','Flags a possible constraint without claiming a circulation test was performed.');
  if(signals.climate)add('start-shelter','Shelter and exposure',`What shelter condition might ${quotes} raise?`,`A possible architectural response would be to organise shaded and sheltered areas without assuming every activity needs the same enclosure.`,'consequence','Offers an architectural option to develop or reject.');
  add('start-meaning','Clarify the selected language',`How could ${quotes} be interpreted in this specific brief?`,`One possible reading of ${quotes} is that the arrangement of space should respond to different patterns of use.`,'interpretation','Interpretation is explicitly provisional, not a hidden conclusion.');
  add('start-contrast','Consider another reading',`What alternative meaning of ${quotes} should remain open?`,`An alternative reading of ${quotes} may lead to a different spatial arrangement and should be compared before selecting one.`,'interpretation','Keeps multiple interpretations available to the designer.');
  return distinct(prompts).slice(0,5);
}
export function startSuggestions(state,hotspot=null){return guidanceForContext(state,hotspot);}
export function nextSuggestions(state,node=null,hotspot=null){
  if(!node)return [];
  const term=cut(node.label,90);
  const quoted=`“${term}”`;
  const signals=semanticSignals(`${node.label} ${state?.brief||''}`);
  const out=[];
  const add=(id,heading,question,draft,role,why)=>out.push({id,heading,question,draft,role,why});
  switch(node.type){
    case 'input':
      add('next-read','Interpret this requirement',`What does ${quoted} imply for the project's spatial use?`,`The requirement ${quoted} could mean that the design needs to accommodate more than one pattern of occupation.`,'interpretation','Interpret the actual source wording before assuming a design solution.');break;
    case 'interpretation':
      add('next-basis','Question the interpretation',`What would support or challenge ${quoted}?`,`The interpretation ${quoted} still needs to be checked against the brief, observations or other project evidence.`,'grounding','Explicitly marks supporting evidence as missing until recorded.');
      add('next-spatial','Try a spatial translation',`What spatial move might test ${quoted}?`,`One possible way to test ${quoted} is through a spatial arrangement that can be drawn and compared with alternatives.`,'consequence','Translates the selected thought into a proposed experiment.');break;
    case 'grounding':
      add('next-move','Make the implication spatial',`If ${quoted} matters, what could physically change?`,`The condition ${quoted} could be explored through a revised layout, component position or boundary.`,'consequence','Suggests an architectural experiment rather than treating a condition as a solution.');break;
    case 'consequence':
      add('next-test','Test this spatial proposition',`What might ${quoted} improve or compromise?`,`The proposal ${quoted} needs to be evaluated for its effect on access, capacity and use before it is accepted.`,'evaluation','Records an evaluation task; it does not claim the proposal succeeds.');
      add('next-alternative','Compare a different move',`What alternative could meet a similar aim?`,`An alternative to ${quoted} would be to test a different arrangement or degree of enclosure against the same requirements.`,'consequence','Creates a competing possible move.');break;
    case 'evaluation':
      add('next-priority','Make a design priority explicit',`Which value is implied by ${quoted}?`,`The evaluation ${quoted} suggests a design priority that should be stated and compared with any competing priorities.`,'goal','Clarifies the aim that a trade-off serves.');break;
    case 'goal':
      add('next-verify','Check whether the goal is met',`Which actual proposal tests ${quoted}?`,`The goal ${quoted} is not yet evidence of success; it should be tested against a specific spatial proposition.`,'evaluation','A stated intention should be evaluated rather than assumed to be achieved.');break;
    default:
      add('next-free','Develop this thought',`What could follow from ${quoted}?`,`The thought ${quoted} might lead to an interpretation, spatial proposal or question worth developing further.`,'note','Keeps an unclassified thought open rather than imposing a role.');
  }
  if(!state?.edges?.some(e=>e.source===node.id||e.target===node.id))
    add('next-link','Explore a relationship',`Which existing thought could explain or follow from ${quoted}?`,`The thought ${quoted} may relate to another recorded requirement or design move; that connection should be checked before it is drawn.`,'grounding','A disconnected node is not automatically an error.');
  if(signals.movement && !out.some(x=>x.id==='next-test'))
    add('next-route','Check access',`How could ${quoted} change movement?`,`The implications of ${quoted} for circulation and an unobstructed route remain to be tested.`,'evaluation','Makes an access consequence explicit without claiming a result.');
  return distinct(out).slice(0,5);
}
export function compareFrameworkReadings(state,frameworkA,frameworkB,visibleIds=null){
  const a=getFramework(frameworkA),b=getFramework(frameworkB);
  const selected=(state?.nodes||[]).filter(n=>!visibleIds||visibleIds.has(n.id));
  const rows=selected.map(n=>{
    const read=(framework)=>{
      if(framework.id==='freeform')return {label:'Unclassified until revealed',kind:'open'};
      if(n.type==='note' && framework.id==='tracework')return {label:'Unclassified Note',kind:'recorded'};
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
// Printable, human-readable takeaway. Computed from recorded information only.
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function decisionBrief(state){
  const digest=decisionDigest(state);
  const status=n=>n.status==='rejected'?'Rejected':n.meta?.provisional?'Provisional':n.status==='alternative'?'Alternative':'Active';
  const proposition=n=>`${n.label} [${status(n)}]`;
  const list=(nodes,label)=>`<section class="db-section"><h3>${safe(label)}</h3>${nodes.length?`<ol>${nodes.map(n=>`<li><span>${safe(n.label)}</span><small>${safe(status(n))}${n.meta?.attributionName?' · '+safe(n.meta.attributionName):''}</small></li>`).join('')}</ol>`:'<p class="db-empty">Nothing recorded in this category yet.</p>'}</section>`;
  const project=safe(state?.projectName||'Untitled Trace');
  const recordList=digest.withRecords.map(n=>({label:n.meta?.recordTitle||n.meta?.sourceReference||n.meta?.evidenceKind||'Supporting record',status:'Record',meta:n.meta}));
  const html=`<div class="decision-brief-sheet"><div class="db-kicker">TRACEWORK · Project takeaway</div><h2>Decision Brief</h2><div class="db-project">${project}</div><p class="db-caution">A snapshot of recorded reasoning, not a verified decision or a reconstruction of unrecorded thinking. Analytical framework roles are readings, not historical proof.</p><div class="db-stats"><span><b>${digest.nodes.length}</b> thoughts</span><span><b>${digest.edges.length}</b> connections</span><span><b>${digest.choices.length}</b> spatial options</span><span><b>${digest.evaluations.length}</b> evaluations</span></div><div class="db-columns">${list(digest.choices,'Spatial options')}${list(digest.evaluations,'Evaluations and trade-offs')}${list(digest.goals,'Stated goals')}${list(recordList,'Supporting records')}</div><section class="db-section db-review"><h3>Questions to review</h3><p>${digest.disconnected.length} non-input thoughts have no recorded connections. This can be intentional.</p><p>${digest.ungrounded.length} spatial options lack a direct incoming Input, Interpretation or Grounding link. Review the trace rather than assuming those options are invalid.</p></section></div>`;
  const plainText=[`TRACEWORK — Decision Brief`,`Project: ${state?.projectName||'Untitled Trace'}`,`${digest.nodes.length} thoughts · ${digest.edges.length} connections · ${digest.choices.length} spatial options`, 'Recorded information only; not independently verified.', '', ...[['SPATIAL OPTIONS',digest.choices],['EVALUATIONS',digest.evaluations],['GOALS',digest.goals]].flatMap(([title,nodes])=>[title,...(nodes.length?nodes.map(n=>`• ${proposition(n)}`):['None recorded.']),'']), 'QUESTIONS TO REVIEW',`${digest.disconnected.length} non-input thoughts have no connections.`,`${digest.ungrounded.length} spatial options lack a direct supporting link.`].join('\n');
  return {html,plainText,digest};
}
export function roleRecognitionSamples(){
  return ['Introduce movable screens to divide the room.','This creates a quieter study area.','The aim is to support different study styles.','The screens narrow circulation, which compromises access.','I interpret flexibility as changing the spatial layout.'].map(text=>({text,...classifyThought(text)}));
}
