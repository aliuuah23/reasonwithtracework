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
// Prompts are framed through the chosen method, while the recorded statement remains unaltered.
const methodLens={
 tracework:{label:'Trace the interpretation',question:'Which reading of this language leads to a testable spatial consequence?',draft:'A possible interpretation of the recorded requirement is that a different spatial arrangement may be necessary.',role:'interpretation'},
 freeform:{label:'Explore without categories',question:'What does this specific statement bring to mind, without choosing a node category yet?',draft:'This statement raises a possible design direction that I want to explore before classifying it.',role:'note'},
 'requirements-elicitation':{label:'Clarify and verify the requirement',question:'Who requires this, under what conditions, and what would count as satisfying it?',draft:'The requirement needs a stated stakeholder, a specific condition, and an observable acceptance check.',role:'grounding'},
 'five-whys':{label:'Question the underlying cause',question:'Why is this particular condition important? Which preceding cause explains it?',draft:'A possible underlying cause remains to be identified and checked rather than assumed.',role:'interpretation'},
 laddering:{label:'Connect attribute, consequence and value',question:'Which property matters, what consequence follows, and why is that consequence valued?',draft:'A candidate spatial attribute may produce a consequence which supports an explicit design value.',role:'goal'},
 'means-end':{label:'Connect means and desired ends',question:'What designed attribute leads to what consequence and human value?',draft:'A possible spatial means could serve a stated design end; the relationship should be tested.',role:'goal'},
 'design-framing':{label:'Reframe the problem',question:'What different design question emerges if the original assumption changes?',draft:'An alternative frame of the brief would prioritise a different relationship between users, site and activity.',role:'interpretation'},
 'reflective-practice':{label:'Reflect on an intervention',question:'What was tried, what response was observed, and what should change in the next move?',draft:'A proposed design action invites reflection on its observable spatial and social consequences.',role:'evaluation'},
 'design-semantics':{label:'Trace intended meaning into use',question:'What meaning should the designed element communicate and how might users interpret it?',draft:'This spatial feature may communicate a particular use or value, but that meaning requires user interpretation.',role:'interpretation'}
};
function lensFor(state){const id=(state?.frameworkId||'tracework').toLowerCase();if(methodLens[id])return methodLens[id];
 if(id.includes('require'))return methodLens['requirements-elicitation'];if(id.includes('why'))return methodLens['five-whys'];
 if(id.includes('ladder')||id.includes('means'))return methodLens.laddering;if(id.includes('fram'))return methodLens['design-framing'];
 if(id.includes('reflect'))return methodLens['reflective-practice'];if(id.includes('semantic'))return methodLens['design-semantics'];
 return methodLens.tracework;}
const methodQuestions={
 tracework:[
 ['Interrogate the language','Which words are ambiguous, and what alternative interpretations are possible?','This phrase may carry more than one meaning in this project.','interpretation'],
 ['Establish a basis','What evidence or project condition would distinguish those readings?','The relevant site or user evidence remains to be established.','grounding'],
 ['Make a spatial consequence','What architectural change follows from the preferred reading?','A possible spatial consequence can be drawn and tested against other readings.','consequence'],
 ['Evaluate the consequence','What might that move enable, exclude or compromise?','This spatial hypothesis needs explicit evaluation and comparison.','evaluation']],
 freeform:[
 ['Open association','What unexpected image, event or analogy does this bring to mind?','An emerging association suggests a direction worth exploring without fixing its category.','note'],
 ['Counterexample','What alternative thought could coexist with or contradict it?','A competing thought remains open without forcing a formal branch type.','note'],
 ['Follow a curiosity','What is worth sketching or observing next?','An exploratory drawing or observation may be informative.','note'],
 ['Return to the whole','How might the current thought change the wider design situation?','This thought might connect to other recorded ideas in an unforeseen way.','note']],
 requirements:[
 ['Identify stakeholders','Who requires this condition, and where is that documented?','The relevant stakeholder and original requirement source need to be identified.','grounding'],
 ['Specify an acceptance criterion','What observable evidence would demonstrate that the requirement is met?','An explicit, testable acceptance condition should be stated.','evaluation'],
 ['Find conflicts','Which other recorded requirement would this constrain or contradict?','Requirements may conflict and require a documented trade-off.','evaluation'],
 ['Separate solution from requirement','Does this sentence prescribe an outcome or prematurely select a form?','The intended performance should be separated from any assumed architectural solution.','interpretation']],
 fivewhys:[
 ['First cause','Why is the described problem happening, based on the recorded evidence?','A candidate immediate cause needs investigation.','grounding'],
 ['Next underlying cause','What condition might explain the preceding cause?','An underlying cause should be differentiated from a surface symptom.','grounding'],
 ['Challenge the causal chain','Which link in this explanation might be wrong or unobserved?','The causal reading needs evidence rather than an assumed straight-line chain.','evaluation'],
 ['Act on the root cause','What spatial intervention would change the cause, not merely its symptom?','A testable design action could address the identified underlying cause.','consequence']],
 laddering:[
 ['Identify a design attribute','Which exact property of the environment is under discussion?','A specific spatial attribute should be described before its wider value is assumed.','grounding'],
 ['Trace a consequence','What immediate experience would that attribute change for a user?','This attribute could produce a particular user consequence.','interpretation'],
 ['Name the value','Why would that consequence matter to the people concerned?','A design value needs to be attached to a documented human consequence.','goal'],
 ['Compare means','What different attribute might support the same valued consequence?','An alternative design means could be tested against the same value.','consequence']],
 framing:[
 ['Expose the present frame','What problem has been assumed, and by whom?','The present framing needs to be stated as a revisable interpretation.','interpretation'],
 ['Invert an assumption','How does the design question change if one assumption is reversed?','A competing problem frame may lead to a different architecture.','interpretation'],
 ['Redefine the design task','What different question would now deserve attention?','The redefined design problem needs an explicit statement.','goal'],
 ['Compare consequences of frames','What forms or decisions would differ under these two frames?','Competing frames can be tested through contrasting spatial strategies.','consequence']],
 reflective:[
 ['Identify an action','What was designed, drawn, changed or tested?','The prior design action should be documented before reflecting on it.','consequence'],
 ['Notice the response','What was actually observed in response to that action?','The resulting observation should be distinguished from an expectation.','grounding'],
 ['Reflect on the surprise','What consequence differs from what was intended?','A mismatch between expectation and outcome may warrant revision.','evaluation'],
 ['Re-enter the design','What next action would test the revised understanding?','An iterative design move can test the reflection.','consequence']],
 semantics:[
 ['State intended meaning','What use, identity or value is the design intended to communicate?','An intended spatial meaning should be stated explicitly.','goal'],
 ['Question user interpretation','How could someone else interpret the same form differently?','The meaning experienced by another user may differ from the designer intention.','interpretation'],
 ['Examine the signifier','Which physical quality of the place would communicate that meaning?','A shape, threshold, texture or affordance might act as a signifier.','consequence'],
 ['Test affordance and ambiguity','What action does the feature invite, and could that invitation be mistaken?','An affordance must be assessed from the user perspective.','evaluation']]
};
function methodId(state){const id=(state?.frameworkId||'tracework').toLowerCase();return ({fivewhys:'fivewhys',requirements:'requirements',laddering:'laddering',framing:'framing',reflective:'reflective',semantics:'semantics',freeform:'freeform'})[id]||'tracework';}
function methodSet(state,term,phase='start'){
 const fw=methodId(state),prefix=phase==='start'?'Begin with':'Develop the selected thought';
 return (methodQuestions[fw]||methodQuestions.tracework).map(([heading,question,draft,role],i)=>({
   id:`${fw}-${phase}-${i}`,heading,question:`${prefix} “${term}”. ${question}`,draft:`${draft} Regarding “${term}”.`,role,
   why:`Method-specific ${getFramework(state?.frameworkId||'tracework').label} reading; an editable proposal, not a recorded conclusion.`}));
}
export function startSuggestions(state,hotspot=null){
 const term=contextTerm({state,hotspot});
 const result=methodSet(state,term,'start');
 // Context-specific cues are supplementary in the default TRACEWORK grammar only.
 return methodId(state)==='tracework'?[...result,...guidanceForContext(state,hotspot).slice(0,1).map(p=>({...p,draft:p.draft.replace(/pavilion/gi,'project')}))].slice(0,5):result;
}
export function nextSuggestions(state,node=null,hotspot=null){
  if(!node)return [];
  const method=lensFor(state);
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
  // Method-specific alternatives are the main output, never the same canonical-role suggestions across modes.
  const methodPrompts=methodSet(state,term,'next');
  return methodId(state)==='tracework'?[...methodPrompts,...out.slice(0,1)].slice(0,5):methodPrompts;
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
  const html=`<div class="decision-brief-sheet"><div class="db-kicker">TRACEWORK · Project takeaway</div><h2>Reasoning Summary</h2><div class="db-project">${project}</div><p class="db-caution">A snapshot of recorded reasoning, not a verified decision or a reconstruction of unrecorded thinking. Analytical framework roles are readings, not historical proof.</p><div class="db-stats"><span><b>${digest.nodes.length}</b> thoughts</span><span><b>${digest.edges.length}</b> connections</span><span><b>${digest.choices.length}</b> spatial options</span><span><b>${digest.evaluations.length}</b> evaluations</span></div><div class="db-columns">${list(digest.choices,'Spatial options')}${list(digest.evaluations,'Evaluations and trade-offs')}${list(digest.goals,'Stated goals')}${list(recordList,'Supporting records')}</div><section class="db-section db-review"><h3>Questions to review</h3><p>${digest.disconnected.length} non-input thoughts have no recorded connections. This can be intentional.</p><p>${digest.ungrounded.length} spatial options lack a direct incoming Input, Interpretation or Grounding link. Review the trace rather than assuming those options are invalid.</p></section></div>`;
  const plainText=[`TRACEWORK — Reasoning Summary`,`Project: ${state?.projectName||'Untitled Trace'}`,`${digest.nodes.length} thoughts · ${digest.edges.length} connections · ${digest.choices.length} spatial options`, 'Recorded information only; not independently verified.', '', ...[['SPATIAL OPTIONS',digest.choices],['EVALUATIONS',digest.evaluations],['GOALS',digest.goals]].flatMap(([title,nodes])=>[title,...(nodes.length?nodes.map(n=>`• ${proposition(n)}`):['None recorded.']),'']), 'QUESTIONS TO REVIEW',`${digest.disconnected.length} non-input thoughts have no connections.`,`${digest.ungrounded.length} spatial options lack a direct supporting link.`].join('\n');
  return {html,plainText,digest};
}
export function roleRecognitionSamples(){
  return ['Introduce movable screens to divide the room.','This creates a quieter study area.','The aim is to support different study styles.','The screens narrow circulation, which compromises access.','I interpret flexibility as changing the spatial layout.'].map(text=>({text,...classifyThought(text)}));
}
