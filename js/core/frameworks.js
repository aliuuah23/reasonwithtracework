const PALETTE=['#64748b','#7456e8','#16847b','#d17a18','#bd4b77','#3c8f5e','#3f6fb5'];

const category=(id,label,canonicalType,description,phrases=[],words=[],canonicalBias=[])=>({
  id,label,canonicalType,description,phrases,words,canonicalBias:canonicalBias.length?canonicalBias:[canonicalType]
});

export const frameworks = [
  {
    id:'tracework',
    label:'TRACEWORK Grammar',
    shortLabel:'TRACEWORK',
    source:'TRACEWORK',
    description:'The project’s six-family operational grammar: Input → Interpretation → Grounding → Spatial Consequence → Evaluation → Goal.',
    arrangement:'sequence',
    connectionMode:'guided',
    categories:[
      category('input','Input','input','Given language, requirement, observation or other source material.'),
      category('interpretation','Interpretation','interpretation','A reading, implication or meaning taken from the source.'),
      category('grounding','Grounding','grounding','Context, evidence, association or reasoning that supports a move.'),
      category('consequence','Spatial Consequence','consequence','A spatial proposition or the effect a spatial move produces.'),
      category('evaluation','Evaluation','evaluation','A judgement, comparison, priority or trade-off.'),
      category('goal','Goal','goal','The design intention or aim the reasoning serves.')
    ]
  },
  {
    id:'requirements',
    label:'Requirements Elicitation',
    shortLabel:'Requirements',
    source:'van Lamsweerde (2001)',
    description:'TRACEWORK operationalises goal-oriented requirements work as elicitation, refinement and testing of stakeholder statements through goals, scenarios, constraints/obstacles and requirements. The categories below are an interface translation, not a verbatim ontology from the source.',
    arrangement:'sequence',
    connectionMode:'soft',
    categories:[
      category('statement','Stakeholder / source statement','input','The initially stated need, expectation or condition before refinement.', ['the brief','brief states','stakeholder','user says','given that','existing condition'], ['brief','statement','stakeholder','given','condition','expectation'], ['input']),
      category('refinement','Clarification / refinement','interpretation','A clarification or refinement that makes an initially informal statement more explicit.', ['what does','could mean','this means','clarify','refine','in this context'], ['clarify','refine','meaning','means','interpret','unclear'], ['interpretation']),
      category('goal','Goal / need','goal','The desired condition or need that explains why the requirement matters.', ['users need','we need','the goal is','the aim is','should support','should enable','why'], ['need','needs','goal','aim','support','enable','purpose','why'], ['goal','grounding']),
      category('scenario','Scenario','grounding','A concrete situation used to test or elaborate how a goal or requirement may operate.', ['when users','during','if ','scenario','in use','for example'], ['scenario','when','during','use','situation','case'], ['grounding','interpretation']),
      category('constraint','Constraint / obstacle','evaluation','A limit, obstacle, dependency or conflict that conditions whether a goal or requirement can be achieved.', ['must not','cannot','without increasing','fixed','remain unobstructed','obstacle','conflicts with'], ['constraint','limit','must','cannot','fixed','obstacle','conflict','unobstructed'], ['input','evaluation']),
      category('requirement','Operational requirement','consequence','A more explicit condition that can guide implementation or spatial response.', ['should provide','must allow','shall','requirement is','needs to provide','ensure'], ['provide','allow','require','requirement','ensure','must'], ['goal','consequence']),
      category('validation','Validation / negotiation','evaluation','A check, negotiation or comparison used to test whether goals and requirements remain coherent or satisfied.', ['check whether','test whether','does this','satisfy','validate','negotiate','works with'], ['check','test','validate','satisfy','negotiate','conflict','works'], ['evaluation'])
    ]
  },
  {
    id:'fivewhys',
    label:'Five Whys',
    shortLabel:'Five Whys',
    source:'Serrat (2017)',
    description:'A simple elicitation technique that repeatedly asks why to move from a surface statement toward an underlying cause or concern. TRACEWORK keeps the repeated levels deliberately light rather than treating Five Whys as a full design ontology.',
    arrangement:'sequence',
    connectionMode:'soft',
    categories:[
      category('surface','Surface statement','input','The visible issue, claim or condition that begins the enquiry.', ['the issue is','the problem is','currently','at first'], ['issue','problem','condition','statement'], ['input','interpretation']),
      category('reason','Why? / reason','grounding','An explicit reason offered in response to the current statement.', ['because','due to','since','so that'], ['because','reason','due','since','why'], ['grounding']),
      category('deeper','Deeper reason','grounding','A further reason reached by asking why again.', ['this happens because','which comes from','underlying','results from','because of'], ['underlying','cause','results','drives','deeper'], ['grounding']),
      category('root','Root concern','goal','The underlying concern or purpose that the repeated enquiry ultimately exposes.', ['ultimately','at the root','fundamentally','the core issue','what matters is'], ['ultimately','root','fundamental','core','purpose','value','matters'], ['goal','evaluation'])
    ]
  },
  {
    id:'laddering',
    label:'Laddering / Means–End',
    shortLabel:'Laddering',
    source:'Reynolds & Gutman (1988)',
    description:'Uses the source-supported means–end chain ATTRIBUTE → CONSEQUENCE → VALUE. TRACEWORK may spatialise the consequence later, but the framework itself remains this three-part ladder.',
    arrangement:'sequence',
    connectionMode:'soft',
    categories:[
      category('attribute','Attribute','interpretation','The concrete attribute, preference or quality being discussed.', ['i prefer','should feel','should be','needs to be','more flexible','more private'], ['flexible','open','private','quiet','visible','movable','accessible','attribute','preference'], ['input','interpretation']),
      category('consequence','Consequence','consequence','What that attribute enables, prevents, changes or produces for the user or situation.', ['allows','enables','prevents','makes it possible','leads to','results in','so that'], ['allow','enable','prevent','consequence','use','access','movement','experience'], ['consequence','evaluation']),
      category('value','Value','goal','The deeper value or end-state that makes the consequence important.', ['why this matters','ultimately','important because','the value is','so that'], ['value','important','aim','goal','ultimately','belonging','autonomy','dignity','control'], ['goal'])
    ]
  },
  {
    id:'framing',
    label:'Design Framing',
    shortLabel:'Framing',
    source:'Dorst (2011)',
    description:'Reads reasoning through the act of framing: an unclear situation is seen through a particular frame that makes a design response possible. TRACEWORK translates this into situation, frame, value/aim and response without claiming these labels are Dorst’s verbatim taxonomy.',
    arrangement:'sequence',
    connectionMode:'soft',
    categories:[
      category('situation','Situation / WHAT','input','The unresolved situation, need or issue being engaged.', ['the situation is','currently','we have','there is','the issue is'], ['situation','condition','context','issue','problem','what'], ['input','grounding']),
      category('frame','Frame / HOW','interpretation','The way of seeing the situation that makes a course of action conceivable.', ['frame this as','rather than','seen as','treat this as','the idea is','working principle'], ['frame','lens','reframe','principle','how','idea'], ['interpretation','grounding']),
      category('value','Value / WHY','goal','The desired value, outcome or aspiration that the frame is intended to achieve.', ['so that','the aim is','the value is','we want','should support','why'], ['value','aim','goal','outcome','purpose','why'], ['goal']),
      category('response','Design response','consequence','A possible design proposition made possible by the chosen frame.', ['respond by','could create','provide','use','arrange','place','design'], ['create','provide','use','arrange','place','move','space','spatial'], ['consequence'])
    ]
  },
  {
    id:'reflective',
    label:'Reflective Practice',
    shortLabel:'Reflection',
    source:'Schön (1983)',
    description:'Makes reflection-in-action visible through framing, a design move, the situation’s back-talk or consequence, reflection, and a revised frame or next move. These interface labels operationalise Schön’s account rather than reproducing a fixed source taxonomy.',
    arrangement:'cycle',
    connectionMode:'soft',
    categories:[
      category('frame','Current frame','interpretation','The present understanding of the situation that guides action.', ['i think','i read','the idea is','the problem is','i am treating'], ['frame','idea','understand','interpret','problem'], ['interpretation']),
      category('move','Move / experiment','consequence','A design action, proposition, drawing move or experiment made within the current frame.', ['i will','try','move','place','add','remove','rearrange','change','test'], ['move','place','add','remove','arrange','draw','model','test','experiment'], ['consequence']),
      category('backtalk','Back-talk / consequence','evaluation','What the situation reveals or does in response to the move.', ['this creates','this causes','the result is','now','it becomes','reveals'], ['result','creates','causes','effect','outcome','reveals','consequence'], ['evaluation','consequence']),
      category('reflection','Reflection-in-action','evaluation','A judgement about what the move and its consequences reveal.', ['i notice','this works','this does not','however','but','on reflection'], ['notice','works','fails','however','but','reflect','better','worse'], ['evaluation','grounding']),
      category('reframe','Reframe / next move','interpretation','A revised understanding or next action prompted by reflection.', ['instead','rethink','reframe','revise','change the idea','try another'], ['instead','reframe','revise','adjust','again','alternative','next'], ['interpretation','consequence'])
    ]
  },
  {
    id:'semantics',
    label:'Design Semantics',
    shortLabel:'Semantics',
    source:'Krippendorff (2006)',
    description:'A semantic lens rather than a fixed sequence. TRACEWORK uses it to inspect how an expression can carry contextual, relational and multiple meanings, and what those meanings imply for use, value, atmosphere and architectural consequence.',
    arrangement:'network',
    connectionMode:'soft',
    categories:[
      category('expression','Expression / term','input','The word, phrase, statement, preference, discomfort or artefact whose meaning is being examined.', ['the word','the phrase','the statement','the object','the brief'], ['word','phrase','statement','object','term','brief','preference'], ['input']),
      category('meaning','Possible meaning','interpretation','A possible interpretation carried by that expression rather than a fixed definition.', ['could mean','might mean','means','i interpret','suggests','implies'], ['meaning','means','interpret','reading','suggests','implies'], ['interpretation']),
      category('context','Context','grounding','The user, situation, culture, site or circumstance through which the meaning is constructed.', ['in this context','for these users','on this site','because','depending on'], ['context','user','site','culture','because','situation'], ['grounding']),
      category('use','Use / experience','evaluation','What the meaning implies for use, behaviour or lived experience.', ['when used','users experience','in use','behaviour','occupation','interaction'], ['use','experience','behaviour','occupy','interaction','activity'], ['evaluation','grounding']),
      category('value_relation','Value / relation','goal','The value, priority or relation that becomes significant through the interpretation.', ['what matters','value','relationship','between','priority','important because'], ['value','relation','relationship','priority','important','care'], ['goal','evaluation']),
      category('atmosphere','Atmosphere / quality','evaluation','The atmospheric, perceptual or qualitative implication carried by the meaning.', ['feels','atmosphere','sense of','quality','quiet','welcoming','open'], ['feel','atmosphere','quality','sense','comfort','welcoming','open'], ['evaluation','interpretation']),
      category('implication','Architectural consequence','consequence','A spatial or architectural implication produced by the interpreted meaning in context.', ['spatially','therefore','this suggests','design implication','create','provide'], ['spatial','implication','create','provide','arrange','space','form'], ['consequence'])
    ]
  },
  {
    id:'freeform',
    label:'Freeform / Low-Structure',
    shortLabel:'Freeform',
    source:'TRACEWORK working mode',
    description:'Suppresses a visible framework while keeping the same reasoning network. Use it when categories would get in the way.',
    arrangement:'network',
    connectionMode:'open',
    categories:[]
  }
];

export const provenanceOptions = [
  { id:'brief', label:'Brief / source document' },
  { id:'tutor', label:'Tutor comment' },
  { id:'designer', label:'Designer thought' },
  { id:'observation', label:'Observation / site condition' },
  { id:'precedent', label:'Precedent / case study' },
  { id:'other', label:'Other source' }
];

export function getFramework(id='tracework'){
  return frameworks.find(f=>f.id===id) || frameworks[0];
}

export function frameworkCategories(id='tracework'){
  return getFramework(id).categories||[];
}

export function getFrameworkCategory(frameworkId,roleId){
  return frameworkCategories(frameworkId).find(c=>c.id===roleId)||null;
}

export function canonicalTypeForFrameworkRole(frameworkId,roleId,fallback='interpretation'){
  if(roleId==='note')return 'note';
  if(frameworkId==='tracework')return roleId||fallback;
  return getFrameworkCategory(frameworkId,roleId)?.canonicalType||fallback;
}

export function frameworkRoleForNode(node,frameworkId='tracework'){
  if(!node)return null;
  if(node.type==='note')return {id:'note',label:'Note',color:'#8d93a0',canonicalType:'note',description:'An intentionally unclassified thought.'};
  if(frameworkId==='tracework'){
    const c=getFrameworkCategory('tracework',node.type);
    return c?{...c,color:PALETTE[Math.max(0,frameworkCategories('tracework').indexOf(c))]}:{id:node.type,label:node.type,color:'#8d93a0',canonicalType:node.type};
  }
  if(frameworkId==='freeform')return {id:node.type,label:canonicalLabel(node.type),color:'#9aa0aa',canonicalType:node.type,description:'Underlying TRACEWORK type shown only when structure is revealed.'};
  const stored=node.meta?.frameworkRoles?.[frameworkId];
  const category=stored?getFrameworkCategory(frameworkId,stored):null;
  const resolved=category||classifyFrameworkThought(node.label,frameworkId,{canonicalType:node.type}).category;
  if(!resolved)return {id:node.type,label:canonicalLabel(node.type),color:'#9aa0aa',canonicalType:node.type};
  return {...resolved,color:categoryColor(frameworkId,resolved.id)};
}

export function classifyFrameworkThought(text,frameworkId,{canonicalType=null,afterRole=null}={}){
  const framework=getFramework(frameworkId);
  const value=String(text||'').trim();
  if(framework.id==='tracework' || framework.id==='freeform' || !framework.categories?.length){
    return {role:null,category:null,confidence:0,reason:'',matches:[]};
  }
  if(!value){
    const first=framework.categories[0];
    return {role:first?.id||null,category:first||null,confidence:0,reason:`Start typing and ${framework.shortLabel} will suggest a role.`,matches:[]};
  }
  const scores=Object.fromEntries(framework.categories.map(c=>[c.id,0]));
  const reasons=Object.fromEntries(framework.categories.map(c=>[c.id,[]]));
  for(const c of framework.categories){
    for(const phrase of c.phrases||[]){ if(containsPhrase(value,phrase)){scores[c.id]+=3;reasons[c.id].push(`“${phrase}”`);} }
    for(const word of c.words||[]){ if(new RegExp(`\\b${escapeRegex(String(word).toLowerCase())}\\b`,'i').test(value)){scores[c.id]+=1;reasons[c.id].push(`“${word}”`);} }
    if(canonicalType && (c.canonicalBias||[]).includes(canonicalType)){scores[c.id]+=2.2;reasons[c.id].push('current TRACEWORK role');}
  }
  if(afterRole){
    const idx=framework.categories.findIndex(c=>c.id===afterRole);
    const next=framework.categories[idx+1];
    if(next){scores[next.id]+=.7;reasons[next.id].push('previous framework step');}
  }
  if(/[?]$/.test(value)){
    const question=framework.categories.find(c=>/question|clarification/i.test(c.label));
    if(question){scores[question.id]+=1.5;reasons[question.id].push('question form');}
  }
  let ranked=framework.categories.map(c=>({category:c,score:scores[c.id]})).sort((a,b)=>b.score-a.score);
  if(!ranked.length)return {role:null,category:null,confidence:0,reason:'',matches:[]};
  if(ranked[0].score===0){
    const fallback=canonicalType?framework.categories.find(c=>(c.canonicalBias||[]).includes(canonicalType)):null;
    scores[(fallback||framework.categories[0]).id]=.5;
    ranked=framework.categories.map(c=>({category:c,score:scores[c.id]})).sort((a,b)=>b.score-a.score);
  }
  const best=ranked[0],second=ranked[1]||{score:0};
  const margin=Math.max(0,best.score-second.score);
  const confidence=Math.max(.32,Math.min(.93,.42+(best.score*.07)+(margin*.05)));
  const maxScore=Math.max(best.score,.5);
  const matches=ranked.slice(0,4).map((item,index)=>({
    role:item.category.id,
    category:item.category,
    strength:item.score<=0?0:Math.max(0,Math.min(99,Math.round((confidence*100)*(item.score/maxScore)))),
    cues:[...new Set(reasons[item.category.id])].slice(0,2),
    strongest:index===0
  }));
  const cues=[...new Set(reasons[best.category.id])].slice(0,3);
  const cueText=cues.length?`Cues: ${cues.join(' + ')}.`:`Suggested from the overall wording.`;
  return {
    role:best.category.id,
    category:best.category,
    confidence,
    reason:`${cueText} Match percentages show relative fit within ${framework.label}, not certainty.`,
    matches
  };
}

export function categoryColor(frameworkId,roleId){
  const categories=frameworkCategories(frameworkId);
  const idx=categories.findIndex(c=>c.id===roleId);
  return PALETTE[idx>=0?idx%PALETTE.length:0];
}

export function frameworkLegend(frameworkId='tracework'){
  const framework=getFramework(frameworkId);
  if(framework.id==='freeform')return [];
  return framework.categories.map((c,i)=>({...c,color:PALETTE[i%PALETTE.length]}));
}

export function frameworkRoleDescription(frameworkId,roleId){
  return getFrameworkCategory(frameworkId,roleId)?.description||'';
}

export function provenanceLabel(id='designer'){
  return provenanceOptions.find(p=>p.id===id)?.label || 'Designer thought';
}

export function inferLegacyProvenance(node){
  if(!node) return 'designer';
  if(node.meta?.provenance) return node.meta.provenance;
  if(node.type==='input' && node.meta?.source==='brief') return 'brief';
  if(node.meta?.sourcePathway || node.meta?.sourceStatus) return 'precedent';
  if(node.meta?.freeform) return 'designer';
  return 'designer';
}

function canonicalLabel(type){
  return ({input:'Input',interpretation:'Interpretation',grounding:'Grounding',consequence:'Spatial consequence',evaluation:'Evaluation',goal:'Goal',note:'Note'})[type]||type||'Reasoning move';
}
function containsPhrase(text,phrase){
  const escaped=escapeRegex(String(phrase).trim()).replace(/\s+/g,'\\s+');
  return new RegExp(`(?:^|\\b)${escaped}(?:$|\\b)`,'i').test(text);
}
function escapeRegex(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
