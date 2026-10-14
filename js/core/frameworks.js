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
  { id:'brief_requirement', label:'Brief requirement' },
  { id:'brief_description', label:'Brief description / background' },
  { id:'participant', label:'Participant statement' },
  { id:'researcher', label:'Researcher interpretation / coding' },
  { id:'system', label:'System suggestion' },
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
  const bump=(id,amount,reason)=>{ if(id in scores){ scores[id]+=amount; if(reason)reasons[id].push(reason); } };
  for(const c of framework.categories){
    for(const phrase of c.phrases||[]){ if(containsPhrase(value,phrase)){bump(c.id,3,`“${phrase}”`);} }
    for(const word of c.words||[]){ if(new RegExp(`\\b${escapeRegex(String(word).toLowerCase())}\\b`,'i').test(value)){bump(c.id,1,`“${word}”`);} }
    // The underlying TRACEWORK role is supporting context only, never the dominant cue.
    if(canonicalType && (c.canonicalBias||[]).includes(canonicalType)){bump(c.id,.65,'underlying TRACEWORK role');}
  }
  applyFrameworkHeuristics(value,framework.id,{bump,afterRole});
  if(afterRole){
    const idx=framework.categories.findIndex(c=>c.id===afterRole);
    const next=framework.categories[idx+1];
    if(next) bump(next.id,.55,'previous framework step');
  }
  if(/[?]$/.test(value)){
    const question=framework.categories.find(c=>/question|clarification|refinement/i.test(c.label));
    if(question)bump(question.id,1.4,'question form');
  }
  let ranked=framework.categories.map(c=>({category:c,score:scores[c.id]})).sort((a,b)=>b.score-a.score);
  if(!ranked.length)return {role:null,category:null,confidence:0,reason:'',matches:[]};
  if(ranked[0].score===0){
    const fallback=canonicalType?framework.categories.find(c=>(c.canonicalBias||[]).includes(canonicalType)):null;
    bump((fallback||framework.categories[0]).id,.45,'weak default');
    ranked=framework.categories.map(c=>({category:c,score:scores[c.id]})).sort((a,b)=>b.score-a.score);
  }
  const best=ranked[0],second=ranked[1]||{score:0};
  const margin=Math.max(0,best.score-second.score);
  const confidence=Math.max(.28,Math.min(.9,.32+(best.score*.06)+(margin*.04)));
  const matches=ranked.slice(0,4).map((item,index)=>{
    // Match strengths are deliberately independent rather than shares of a 100% pie.
    // A sentence can strongly fit more than one role without making the strongest role
    // appear weaker simply because another useful reading also becomes visible.
    const strength=item.score<=0?0:Math.max(8,Math.min(92,Math.round(18+item.score*9)));
    const cues=[...new Set(reasons[item.category.id])].slice(0,3);
    return {
      role:item.category.id,category:item.category,strength,cues,strongest:index===0,
      definition:item.category.description,
      explanation:cues.length?`Matched because of ${cues.join(', ')}.`:'No strong wording cue detected for this role.'
    };
  });
  const cues=[...new Set(reasons[best.category.id])].slice(0,4);
  const cueText=cues.length?`Strongest cues: ${cues.join(' + ')}.`:`Suggested from the overall wording.`;
  const secondMatch=matches[1];
  const close=secondMatch && secondMatch.strength>0 && Math.abs(matches[0].strength-secondMatch.strength)<=12;
  const closeText=close?` Close reading: ${secondMatch.category.label} also fits at ${secondMatch.strength}%.`:'';
  return {
    role:best.category.id,
    category:best.category,
    confidence,
    reason:`${cueText}${closeText} Match strengths show how strongly the wording fits each role inside ${framework.label}; they are independent fits, not probabilities. Change the role whenever the framework reading does not match your intent.`,
    matches
  };
}

function applyFrameworkHeuristics(value,frameworkId,{bump,afterRole}){
  const t=value.toLowerCase();
  const has=re=>re.test(t);
  if(frameworkId==='requirements'){
    if(has(/\b(must|shall|required|requirement|ensure|needs? to|should)\b/) && has(/\b(keep|remain|provide|allow|accommodate|support|protect|maintain|route|space|seating|access|circulation)\b/)) bump('requirement',5,'operational “must/should” condition');
    if(has(/\b(cannot|can't|must not|without|fixed|limit|limited|obstacle|conflict|interfere|crowd|crowding|dependency|prevent)\b|may conflict|may interfere/)) bump('constraint',5,'limitation or conflict');
    if(has(/\b(when|during|if|whenever|peak period|scenario|in use)\b/)) bump('scenario',3.5,'situational condition');
    if(has(/\b(goal|aim|purpose|users? need|need for|support|enable|desired)\b/) && !has(/\bmust|shall|required\b/)) bump('goal',3.5,'need or desired condition');
    if(has(/\b(clarify|clarification|what does|what is meant|define|refine|refinement|unclear)\b/)) bump('refinement',4,'clarification/refinement language');
    if(has(/\b(test|check|validate|validation|satisfy|satisfied|verify|negotiate|whether it works)\b/)) bump('validation',4.5,'testing or negotiation language');
    if(has(/\b(stakeholder|brief|client|user says|given condition)\b/)) bump('statement',3,'source/stakeholder statement');
  }
  if(frameworkId==='fivewhys'){
    if(has(/\b(ultimately|fundamentally|at the root|root concern|core issue|what matters|underlying concern)\b/)) bump('root',6,'root-concern language');
    if(has(/\b(because|due to|since|results from|comes from|driven by)\b/)){
      if(afterRole==='reason'||afterRole==='deeper') bump('deeper',5,'another “why” answer'); else bump('reason',5,'explicit reason');
    } else if(afterRole==='reason'||afterRole==='deeper') bump('deeper',2.8,'continuing the why chain');
    else bump('surface',1.5,'starting statement');
  }
  if(frameworkId==='laddering'){
    if(has(/\b(allows?|enables?|prevents?|leads? to|results? in|makes it possible|so that)\b/)) bump('consequence',5,'means–end consequence language');
    if(has(/\b(value|ultimately|important because|what matters|autonomy|dignity|belonging|control|agency|comfort|security|identity)\b/)) bump('value',4.5,'underlying value/end-state');
    if(has(/\b(flexible|open|private|quiet|visible|movable|accessible|compact|shaded|permeable|attribute|preference|quality)\b/)) bump('attribute',3.5,'concrete attribute or quality');
  }
  if(frameworkId==='framing'){
    if(has(/\b(rather than|not .* but|reframe|frame this|seen as|treat .* as|working principle|way of seeing)\b/)) bump('frame',6,'reframing/lens language');
    if(has(/\b(problem|issue|situation|condition|currently|there is|we have)\b/)) bump('situation',3.5,'problematic situation');
    if(has(/\b(aim|purpose|value|we want|should support|so that|why it matters)\b/)) bump('value',3.5,'desired value or aim');
    if(has(/^(create|provide|use|arrange|place|move|add|remove|design|make)\b|\b(could create|respond by|spatial response)\b/)) bump('response',4.5,'design response');
  }
  if(frameworkId==='reflective'){
    if(has(/\b(instead|rather than|rethink|reframe|revise|try another|change .* instead|move .* instead)\b/)) bump('reframe',7,'revised frame or next move');
    if(has(/\b(this|that)\s+(makes?|creates?|causes?|reveals?|means?|results?)\b|\b(but may|however|interfere|unintended|consequence|result)\b/)) bump('backtalk',6,'situation talking back to the move');
    if(has(/\b(i notice|i realise|i realize|on reflection|this works|does not work|doesn't work|better|worse|successful|fails?|reflect)\b/)) bump('reflection',6,'reflection on the result');
    if(has(/^(place|move|add|remove|arrange|try|use|shift|rotate|open|close|make|draw|model|test)\b|\b(i will|let's try|try to)\b/)) bump('move',5,'design move/experiment');
    if(has(/\b(the problem is|the idea is|i think|i am treating|current frame|understand this as)\b/)) bump('frame',4,'current framing');
  }
  if(frameworkId==='semantics'){
    if(has(/\b(could mean|might mean|may mean|does not necessarily mean|doesn't necessarily mean|means|i interpret|reading of|implies)\b/)) bump('meaning',5.2,'explicit meaning/interpretation language');
    if(has(/\b(in this context|for these users|on this site|depending on|culture|situated|circumstance)\b/)) bump('context',4,'contextual construction of meaning');
    if(has(/\b(use|experience|behavio|occupation|occupy|interaction|activity|how people)\b/)) bump('use',3.8,'use/experience implication');
    if(has(/\b(value|relationship|relation|priority|what matters|important because|between)\b/)) bump('value_relation',3.8,'value or relation');
    if(has(/\b(feels?|atmosphere|sense of|quality|welcoming|quiet|comfort|character)\b/)) bump('atmosphere',3.8,'atmospheric/qualitative meaning');
    if(has(/\b(spatial|architect|enclos|visual connection|partial enclosure|threshold|screen|layout|seating|route|circulation|opening|wall|edge|centre|center|form|section|plan)\b/)) bump('implication',6.5,'architectural/spatial implication');
    if(has(/\b(maintain(?:ing)? visual connection|partial(?:ly)? enclos|screen(?:ing)?|threshold|spatially|architectural consequence)\b/)) bump('implication',3.5,'developed architectural consequence');
    if(afterRole==='meaning' && has(/\b(enclos|visual|threshold|screen|layout|seating|route|circulation|form|space)\b/)) bump('implication',3,'meaning developing toward architecture');
    if(!afterRole && !has(/\bmean|context|use|experience|value|atmosphere|spatial|architect|enclos|visual|threshold|layout|seating|route|form\b/)) bump('expression',1.5,'unresolved expression/term');
  }
}

export function frameworkGuidance(frameworkId,currentRoleId,{sourceText=''}={}){
  const f=getFramework(frameworkId);
  if(!f || f.id==='tracework' || f.id==='freeform') return null;
  const guidance={
    requirements:{
      statement:{nextRole:'refinement',question:'What is still unclear, assumed or underspecified in this statement?',placeholder:'Clarify who, when, what condition, or what meaning needs refinement…',choices:['Who is affected?','When does it apply?','What must remain true?']},
      refinement:{nextRole:'goal',question:'What underlying need or goal does this clarification point to?',placeholder:'State the need or desired condition this clarification serves…',choices:['User need','Design goal','Performance aim']},
      goal:{nextRole:'scenario',question:'In what concrete situation should this goal hold?',placeholder:'Describe a use condition, moment, actor or scenario that tests the goal…',choices:['Normal use','Peak condition','Edge case']},
      scenario:{nextRole:'constraint',question:'What could limit, obstruct or conflict with this goal in that scenario?',placeholder:'Name the obstacle, dependency, limit or conflict…',choices:['Physical limit','Competing requirement','Operational conflict']},
      constraint:{nextRole:'requirement',question:'What operational requirement could respond to this obstacle without hiding it?',placeholder:'State a condition the design should satisfy…',choices:['Must allow…','Must maintain…','Must avoid…']},
      requirement:{nextRole:'validation',question:'How could this requirement be checked, negotiated or tested?',placeholder:'Describe what would count as satisfying or challenging the requirement…',choices:['Test against scenario','Check conflict','Negotiate priority']},
      validation:{nextRole:'refinement',question:'What needs to be refined after this check?',placeholder:'Revise or clarify the requirement based on what the test revealed…',choices:['Clarify wording','Adjust requirement','Revisit goal']}
    },
    fivewhys:{
      surface:{nextRole:'reason',question:'Why is this issue, condition or need happening — or why does it matter?',placeholder:'Because…',choices:['Because…']},
      reason:{nextRole:'deeper',question:'Why is that the case?',placeholder:'Because…',choices:['Ask why again']},
      deeper:{nextRole:'deeper',question:'Why does that underlying reason exist?',placeholder:'Because…',choices:['Ask why again','This may be the root concern'],roleOptions:['deeper','root']},
      root:{nextRole:null,question:'A root concern has been reached. Start another Why chain if another cause may also matter.',placeholder:'',choices:[]}
    },
    laddering:{
      attribute:{nextRole:'consequence',question:'What does this attribute enable, prevent or change for the user?',placeholder:'This allows / prevents / changes…',choices:['Functional consequence','Experiential consequence']},
      consequence:{nextRole:'value',question:'Why is that consequence important?',placeholder:'This matters because…',choices:['Control / agency','Comfort / security','Belonging / identity']},
      value:{nextRole:null,question:'This ladder has reached a value. Start another attribute or compare how the value could become architectural.',placeholder:'',choices:[]}
    },
    framing:{
      situation:{nextRole:'frame',question:'What way of seeing this situation would make it designable?',placeholder:'Rather than treating this as…, frame it as…',choices:['Change the question','Change the relationship','Change what counts as the problem']},
      frame:{nextRole:'value',question:'What value or outcome makes this frame worth pursuing?',placeholder:'This frame matters because it could…',choices:['User value','Spatial aim','Performance outcome']},
      value:{nextRole:'response',question:'What design response becomes possible through this frame?',placeholder:'Respond by…',choices:['Spatial organisation','Element / system','Sequence / threshold']},
      response:{nextRole:'frame',question:'What alternative frame could produce a different response?',placeholder:'Another way to frame the situation is…',choices:['Reframe the situation','Keep response and change frame']}
    },
    reflective:{
      frame:{nextRole:'move',question:'What move or experiment would test this current frame?',placeholder:'Try / place / move / draw / model…',choices:['Make a move','Test an alternative']},
      move:{nextRole:'backtalk',question:'What does the situation do in response to this move?',placeholder:'This creates / reveals / causes…',choices:['Unexpected effect','Spatial consequence','Constraint becomes visible']},
      backtalk:{nextRole:'reflection',question:'What does that back-talk make you notice or reconsider?',placeholder:'I notice / this works because / this fails because…',choices:['What worked?','What failed?','What changed?']},
      reflection:{nextRole:'reframe',question:'How should the frame or next move change because of that reflection?',placeholder:'Instead / revise / reframe / try another…',choices:['Reframe','Revise the move','Try an alternative']},
      reframe:{nextRole:'move',question:'What next move would test the revised frame?',placeholder:'Try / move / change…',choices:['Test the reframe','Make the next move']}
    },
    semantics:{
      expression:{nextRole:'meaning',question:'What possible meaning does this expression carry here?',placeholder:'In this project, this could mean…',choices:['Possible meaning','Alternative reading']},
      meaning:{nextRole:'context',question:'What makes this meaning matter: context, use, relation, atmosphere or an architectural implication?',placeholder:'Develop the meaning through context, use, value, quality or spatial implication…',choices:['Context','Use / experience','Value / relation','Atmosphere / quality','Architectural consequence'],roleOptions:['context','use','value_relation','atmosphere','implication']},
      context:{nextRole:'meaning',question:'How does this context change or qualify the meaning?',placeholder:'In this context, the expression becomes…',choices:['Qualify the meaning','Surface another meaning'],roleOptions:['meaning','use','implication']},
      use:{nextRole:'implication',question:'What architectural implication follows from this use or experience?',placeholder:'Spatially, this suggests…',choices:['Spatial consequence','Relationship / threshold'],roleOptions:['implication','value_relation']},
      value_relation:{nextRole:'implication',question:'How might this value or relation become spatially consequential?',placeholder:'This could be expressed through…',choices:['Architectural consequence','Atmospheric quality'],roleOptions:['implication','atmosphere']},
      atmosphere:{nextRole:'implication',question:'What architectural condition could support or challenge this quality?',placeholder:'This quality could be shaped through…',choices:['Architectural consequence','Use / experience'],roleOptions:['implication','use']},
      implication:{nextRole:'meaning',question:'What meaning does this architectural consequence reinforce, challenge or reveal?',placeholder:'This consequence changes the reading because…',choices:['Re-read the expression','Add context'],roleOptions:['meaning','context']}
    }
  };
  const byRole=guidance[f.id]||{};
  const current=byRole[currentRoleId]||byRole[f.categories?.[0]?.id]||null;
  if(!current)return null;
  const roleOptions=(current.roleOptions||[current.nextRole]).filter(Boolean);
  const source=String(sourceText||'').trim();
  const quoted=source ? `“${source.length>92?`${source.slice(0,89)}…`:source}”` : 'this thought';
  const backwardMap={
    requirements:{refinement:'statement',goal:'refinement',scenario:'goal',constraint:'scenario',requirement:'constraint',validation:'requirement'},
    fivewhys:{reason:'surface',deeper:'reason',root:'deeper'},
    laddering:{consequence:'attribute',value:'consequence'},
    framing:{frame:'situation',value:'frame',response:'value'},
    reflective:{move:'frame',backtalk:'move',reflection:'backtalk',reframe:'reflection'},
    semantics:{meaning:'expression',context:'meaning',use:'meaning',value_relation:'meaning',atmosphere:'meaning',implication:'meaning'}
  };
  const backwardRole=backwardMap[f.id]?.[currentRoleId]||null;
  const backwardQuestions={
    requirements:`What earlier statement, goal or situation makes ${quoted} necessary?`,
    fivewhys:`What claim or reason immediately led to ${quoted}?`,
    laddering:`What earlier attribute or consequence gives rise to ${quoted}?`,
    framing:`What situation or frame makes ${quoted} a meaningful move?`,
    reflective:`What frame, move or back-talk immediately produced ${quoted}?`,
    semantics:`What expression or prior meaning is ${quoted} developing from?`
  };
  const forwardQuestion=source ? contextualForwardQuestion(f.id,currentRoleId,current.question,quoted) : current.question;
  return {
    ...current,
    question:forwardQuestion,
    roleOptions,sourceText:source,framework:f,
    backward:backwardRole?{role:backwardRole,question:backwardQuestions[f.id]||`What led to ${quoted}?`,placeholder:`Write what led to ${quoted}…`}:null,
    forward:{role:current.nextRole,question:forwardQuestion,placeholder:current.placeholder,roleOptions}
  };
}

function contextualForwardQuestion(frameworkId,currentRoleId,fallback,quoted){
  const map={
    requirements:{
      statement:`What in ${quoted} is still unclear, assumed or underspecified?`,
      refinement:`What need or goal does ${quoted} reveal?`,
      goal:`In what concrete situation should ${quoted} still hold?`,
      scenario:`What could obstruct or conflict with ${quoted}?`,
      constraint:`What operational requirement could answer ${quoted}?`,
      requirement:`How could ${quoted} be tested or negotiated?`,
      validation:`What should be revised after what ${quoted} revealed?`
    },
    fivewhys:{
      surface:`Why is ${quoted} happening — or why does it matter?`,
      reason:`Why is ${quoted} the case?`,
      deeper:`Why does ${quoted} exist?`,
      root:`Does ${quoted} feel like the root concern, or is there another “why” beneath it?`
    },
    laddering:{
      attribute:`What does ${quoted} enable, prevent or change?`,
      consequence:`Why is ${quoted} important to the user?`,
      value:`What other attribute or consequence could also serve ${quoted}?`
    },
    framing:{
      situation:`What way of seeing ${quoted} would make it designable?`,
      frame:`What does ${quoted} make newly visible — and what might it hide?`,
      value:`What design response becomes possible if ${quoted} is prioritised?`,
      response:`What alternative frame could produce a genuinely different response to ${quoted}?`
    },
    reflective:{
      frame:`What move would actually test ${quoted}?`,
      move:`What did the situation do back in response to ${quoted}?`,
      backtalk:`What does ${quoted} make worth reconsidering?`,
      reflection:`How should the frame or next move change because of ${quoted}?`,
      reframe:`What next move would test ${quoted} rather than merely restating it?`
    },
    semantics:{
      expression:`What possible meaning does ${quoted} carry here?`,
      meaning:`What context, use, value, atmosphere or architectural consequence develops ${quoted}?`,
      context:`How does ${quoted} qualify or change the meaning?`,
      use:`What architectural implication follows from ${quoted}?`,
      value_relation:`How could ${quoted} become spatially consequential?`,
      atmosphere:`What architectural condition could support or challenge ${quoted}?`,
      implication:`What meaning does ${quoted} reinforce, challenge or reveal?`
    }
  };
  return map[frameworkId]?.[currentRoleId]||fallback;
}

export function frameworkTutorialSteps(frameworkId='tracework'){
  const f=getFramework(frameworkId);
  const common={title:f.label,source:f.source,description:f.description};
  const roles=(f.categories||[]).map(c=>({label:c.label,description:c.description}));
  const notes={
    tracework:'TRACEWORK is the project’s base operational grammar. It can remain visible, be hidden, or be compared with other lenses without changing the designer’s underlying reasoning.',
    requirements:'Use this lens to progressively clarify needs, goals, scenarios, obstacles and operational requirements. It is especially useful when a brief or stakeholder statement needs refinement before becoming actionable.',
    fivewhys:'Use repeated “why?” questions to move beneath a surface statement. TRACEWORK keeps this intentionally light because Five Whys is an elicitation technique, not a full design ontology.',
    laddering:'Follow Attribute → Consequence → Value. This reveals why a stated spatial quality matters before deciding how architecture should respond.',
    framing:'Use framing to change how an unclear situation is seen so that a design response becomes possible. The framework is a lens for constructing the problem, not merely categorising an answer.',
    reflective:'Use the cycle Current frame → Move → Back-talk → Reflection → Reframe / next move. The right panel follows the conversation between the designer and the developing situation.',
    semantics:'Treat meaning as contextual, relational and potentially multiple. The map is intentionally network-like: expression, meaning, context, use, value, atmosphere and architectural implication can connect in several directions.',
    freeform:'Use this mode when visible categories get in the way. The same reasoning remains available for later inspection through TRACEWORK or a literature framework.'
  };
  return {...common,note:notes[f.id]||'',roles};
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
