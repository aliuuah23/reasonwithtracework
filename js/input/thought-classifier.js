// C1.1: evidence-assisted lexical matching from the *coded node labels* in
// Pilot Experiment 01 (P01–P10). These are small qualitative examples, not a
// probability-trained model; their role is to check wording against observed
// design-intention, interpretation and spatial-proposition distinctions.
let pilotExamples=[];
let pilotIDF=new Map();
const PILOT_STOP=new Set('a an the and or of in on at to for by with is are was were be been being that which what when where who from this these those it its i we they them as about into through rather than but while without not more less should can could would will need needs do does did their there have has had after before along during my our your a few some even very'.split(' '));
function roleTokens(text){
  return [...new Set(String(text||'').toLowerCase().match(/[a-z]+/g)||[])]
    .map(word=>word.replace(/(ing|ments|ment|tion|sions|ed|es|s)$/,'')).filter(word=>word.length>2&&!PILOT_STOP.has(word));
}
export function setPilotRoleExamples(dataset){
  pilotExamples=(dataset?.examples||[]).filter(item=>TYPE_INFO[item.role]&&String(item.text||'').length>4).map(item=>({
    role:item.role,tokens:roleTokens(item.text),text:item.text,class:item.class
  })).filter(item=>item.tokens.length);
  const documentFrequency=new Map();
  for(const item of pilotExamples)for(const token of new Set(item.tokens))documentFrequency.set(token,(documentFrequency.get(token)||0)+1);
  pilotIDF=new Map([...documentFrequency].map(([word,n])=>[word,Math.log(1+(pilotExamples.length+1)/(n+1))]));
}
function pilotRoleCues(value){
  if(!pilotExamples.length)return [];
  const words=roleTokens(value);if(!words.length)return [];
  const set=new Set(words);
  const matches=pilotExamples.map(item=>{
    const overlap=item.tokens.filter(word=>set.has(word));
    const shared=overlap.reduce((sum,t)=>sum+(pilotIDF.get(t)||1),0);
    const lenA=words.reduce((sum,t)=>sum+(pilotIDF.get(t)||1),0);
    const lenB=item.tokens.reduce((sum,t)=>sum+(pilotIDF.get(t)||1),0);
    // Weighted Dice similarity; penalise a single common token matching a label.
    const sim=overlap.length>=2?2*shared/Math.max(1,lenA+lenB):0;
    return {...item,sim,overlap};
  }).filter(m=>m.sim>=.24).sort((a,b)=>b.sim-a.sim);
  const roleBest=new Map();
  for(const m of matches){
    if(!roleBest.has(m.role))roleBest.set(m.role,m);
  }
  return [...roleBest.entries()].map(([role,m])=>({role,score:Math.min(3.6,m.sim*5),label:m.text,sim:m.sim}));
}

const TYPE_INFO = {
  input: {
    label:'Input',
    definition:'Source material that enters the project: brief language, a stated requirement, a supplied condition, or another explicitly given/observed input.',
    distinction:'Use Input when the statement is being received as source material rather than when it is already explaining, judging, or spatialising that source.'
  },
  interpretation: {
    label:'Interpretation',
    definition:'A reading, implication, or meaning taken from source language or a situation.',
    distinction:'Interpretation answers “what could this mean?”; it does not yet explain why that reading is supported or what architecture should do.'
  },
  grounding: {
    label:'Grounding',
    definition:'Context, evidence, association, precedent, observation, or reasoning used to support a reading or design move.',
    distinction:'Grounding answers “why this reading/move?” through context or evidence rather than proposing architecture directly.'
  },
  consequence: {
    label:'Spatial Consequence',
    definition:'A spatial proposition, architectural move, arrangement, element, or the effect that such a move produces.',
    distinction:'Spatial Consequence needs an architectural/spatial action or effect; merely mentioning “space”, “seating”, or “circulation” is not enough.'
  },
  evaluation: {
    label:'Evaluation',
    definition:'A judgement, comparison, trade-off, priority, test, benefit, drawback, or recognised conflict.',
    distinction:'Evaluation weighs what works, fails, improves, compromises, conflicts, or should be prioritised.'
  },
  goal: {
    label:'Goal',
    definition:'A design intention, desired condition, value, purpose, or outcome the reasoning is trying to achieve.',
    distinction:'Goal answers “what are we trying to achieve?” rather than “what should we physically do?”'
  }
};

const RULES = {
  input: {
    phrases:['the brief','brief asks','brief requires','the requirement','given condition','given that','the client asks','the tutor said','the source states','must remain','shall remain'],
    words:['brief','requirement','given','source','instruction']
  },
  interpretation: {
    phrases:['i read this as','this means','could mean','might mean','may mean','does not necessarily mean','doesn\'t necessarily mean','in this context','understand this as','by this i mean','i interpret','can be read as','implies that'],
    words:['meaning','interpret','reading','understand','implies','suggests','means']
  },
  grounding: {
    phrases:['because','due to','based on','observed that','users need','site shows','the brief states','evidence suggests','precedent suggests','research shows','from observation','in response to the site'],
    words:['because','evidence','observation','precedent','research','context','rationale','basis','survey','pilot','site','climate','behaviour','behavior']
  },
  consequence: {
    phrases:['introduce','install','deploy','insert','place','locate','arrange','rearrange','reconfigure','open up','close off','create a','introduce','install','deploy','insert','add seating','widen','narrow','orient','cluster','separate','connect','provide a','use a canopy','edge seating','set back','raise','lower','screen','carve','stack','rotate','fold','layer'],
    words:['layout','seating','furniture','threshold','route','circulation','canopy','enclosure','edge','zone','opening','wall','roof','bench','table','cluster','form','section','plan']
  },
  evaluation: {
    phrases:['trade-off','trade off','but this','however','at the cost of','prioritises','prioritizes','compromises','benefit','drawback','risk','works better','works worse','less flexible','more flexible','may conflict','may interfere','creates a problem','would be better'],
    words:['tradeoff','trade-off','priority','prioritise','prioritize','compromise','benefit','risk','drawback','better','worse','efficient','adaptability','clarity','simplicity','conflict','interfere']
  },
  goal: {
    phrases:['the aim is','the goal is','in order to','so that','ultimately','design aim','should enable','should support','we want to','intended to','help users','encourage','ensure that','the intention is','the purpose is'],
    words:['aim','goal','purpose','support','enable','encourage','ensure','promote','intention','value']
  }
};

const ORDER=['input','interpretation','grounding','consequence','evaluation','goal'];
const NEXT={input:'interpretation',interpretation:'grounding',grounding:'consequence',consequence:'evaluation',evaluation:'goal'};

export function classifyThought(text,{afterType=null,provenance='designer'}={}){
  const value=String(text||'').trim();
  if(!value) return {type:null,confidence:0,reason:'Start typing and TRACEWORK will suggest a reasoning role.',scores:{},matches:[],ambiguity:null};

  const scores=Object.fromEntries(ORDER.map(t=>[t,0]));
  const reasons=Object.fromEntries(ORDER.map(t=>[t,[]]));
  const bump=(type,amount,reason)=>{ if(type in scores){ scores[type]+=amount; if(reason) reasons[type].push(reason); } };

  for(const type of ORDER){
    for(const phrase of RULES[type].phrases){
      if(containsPhrase(value,phrase)) bump(type,3,`“${phrase}”`);
    }
    for(const word of RULES[type].words){
      const re=new RegExp(`\\b${escapeRegex(word.toLowerCase())}\\b`,'i');
      if(re.test(value)) bump(type,type==='consequence'?0.55:0.8,`“${word}”`);
    }
  }

  // Examples are secondary evidence, with structural wording remaining decisive.
  for(const cue of pilotRoleCues(value))bump(cue.role,cue.score,`similar wording in coded ${TYPE_INFO[cue.role].label} examples`);

  const lower=value.toLowerCase();
  const has=re=>re.test(lower);

  // Structural cues are weighted more strongly than isolated nouns so the classifier
  // does not collapse everything architectural into Spatial Consequence.
  if(has(/\b(means?|could mean|might mean|may mean|read as|interpret|understand as|implies?)\b/)) bump('interpretation',6.4,'explicit meaning or interpretation language');
  if(has(/\b(because|since|due to|based on|from observation|evidence|precedent|research)\b/)) bump('grounding',4.4,'context, evidence or reason');
  if(has(/\b(students?|users?|people|visitors?|occupants?)\s+(need|require|benefit from|struggle with|tend to)\b/)) bump('grounding',5.2,'user need or behaviour used as reasoning');
  if(has(/\b(site|sun|wind|rain|heat|hot|shade|noise|crowding|peak periods?|time of day|morning|afternoon|evening|vegetation|slope|accessibility)\b/) && !has(/^\s*(create|provide|place|move|arrange|use|add|remove|orient|screen|raise|lower)\b/)) bump('grounding',1.8,'contextual condition');

  const actionVerb='introduce|install|deploy|insert|create|provide|place|locate|arrange|rearrange|orient|move|shift|open|close|cluster|separate|connect|add|remove|raise|lower|screen|carve|stack|rotate|fold|layer|widen|narrow|set back|reconfigure|use';
  const spatialAction=new RegExp(`^\\s*(?:${actionVerb})\\b|\\b(?:to|could|should|would|can|will|by)\\s+(?:${actionVerb})\\b`,'i').test(value);
  const spatialObject=has(/\b(space|spatial|layout|seating|furniture|threshold|route|circulation|canopy|enclosure|edge|zone|opening|wall|roof|bench|table|cluster|form|section|plan|screen|level)\b/);
  const spatialEffect=has(/\b(creates?|produces?|results? in|leads? to|makes .* possible|opens? up|blocks?|separates?|connects?|channels?|shades?|encloses?)\b/);
  const userMovement=has(/\b(students?|users?|people|visitors?|occupants?)\b[^.!?]{0,70}\b(?:can|could|should|would|will)?\s*(?:move|shift|walk|pass|circulate)\b/);
  if(has(/^\s*(?:(?:movable|fixed|folding|retractable|temporary)\s+)?(?:screens?|partitions?|walls?|benches?|seats?|furniture|canop(?:y|ies)|panels?|roofs?|layouts?)\b.{0,75}\b(?:provide|create|divide|separate|allow|support|shade|organis[ez]e|define|enclose|redirect|enable)\b/)) bump('consequence',7.3,'spatial element described through its operational effect');
  if(spatialAction && !userMovement) bump('consequence',4.5,'architectural or spatial action');
  if(spatialAction && spatialObject && !userMovement) bump('consequence',2.2,'action + spatial element');
  if(spatialEffect && spatialObject) bump('consequence',4.6,'effect of a spatial action');
  if(has(/^\s*(this|that|the proposal|the intervention)\s+(creates?|produces?|results? in|leads? to|opens? up)\b/) && has(/\b(study|spatial|zone|area|privacy|circulation|space|seat|room)\b/)) bump('consequence',7,'described effect of a spatial intervention');
  if(has(/^\s*(introduce|install|deploy|insert|provide|create|arrange|place|move|reconfigure)\b/)) bump('consequence',5.5,'direct design intervention stated as an action');
  if(spatialObject && !spatialAction && !spatialEffect) bump('consequence',0.35,'spatial vocabulary only');

  if(has(/\b(but|however|while|whereas|although|trade-?off|at the cost of|compromise|risk|drawback|better|worse|conflict|interfere|priority|prioriti[sz]e|works|fails?)\b/)) bump('evaluation',4.2,'comparison, judgement or conflict');
  if(has(/\b(more|less)\s+(effective|efficient|flexible|private|open|comfortable|predictable|accessible)\b/)) bump('evaluation',2.2,'comparative judgement');

  if(has(/\b(the aim is|the goal is|the intention is|the purpose is|we want to|ultimately|in order to|so that)\b/)) bump('goal',7,'explicit intention or purpose');
  if(has(/\b((my|our|the|design|project|main)\s+)?(goal|aim|intention|objective|purpose)s?\b/)) bump('goal',7.4,'explicit design-goal or intention wording');
  if(has(/\b(suppose|imagine|consider)\b/) && has(/\b(goal|aim|intention|objective|purpose)\b/)) bump('goal',3.2,'hypothetical stated as a goal');
  if(has(/^\s*(?:our|my|the|this|design|project|main)\s+(?:goal|aim|objective|intention|purpose)\b/)) bump('goal',11,'the statement frames a design aim before describing a possible means');
  if(has(/\b(should|must)\s+(feel|be|remain|experience|enjoy)\b/) && !spatialAction) bump('goal',3.4,'desired outcome rather than an architectural move');
  if(has(/\b(i|we)\s+(want|hope|intend|aim|would like|would prefer|need)\b/)) bump('goal',6.5,'stated designer intention');
  if(has(/^\s*(support|enable|encourage|ensure|promote|allow)\b/)) bump('goal',5.2,'goal-oriented verb');
  if(has(/\b(to|so that|in order to)\s+(support|enable|encourage|allow|ensure|promote|protect|maintain)\b/)) bump('goal',3,'purpose clause');

  // Source provenance helps distinguish source material from reasoning about it.
  if(provenance==='brief') bump('input',3.6,'brief or source provenance');
  else if(provenance==='tutor') bump('input',1.2,'tutor-comment provenance');
  else if(provenance==='observation') bump('grounding',1.4,'observation provenance');
  else if(provenance==='precedent') bump('grounding',1.4,'precedent provenance');

  if(has(/\b(the brief|brief asks|brief requires|the requirement|given condition|the source states)\b/)) bump('input',4.5,'explicit source statement');

  // Context from the selected node is a nudge, not a predetermined next step.
  const expected=NEXT[afterType];
  if(expected){ bump(expected,0.3,'selected-node context'); }

  let ranked=ORDER.map(type=>({type,score:scores[type]})).sort((a,b)=>b.score-a.score);
  if(ranked[0].score===0){
    const fallback=expected||'interpretation';
    bump(fallback,0.45,'weak default');
    ranked=ORDER.map(type=>({type,score:scores[type]})).sort((a,b)=>b.score-a.score);
  }

  const best=ranked[0],second=ranked[1];
  const margin=Math.max(0,best.score-second.score);
  const confidence=Math.max(.28,Math.min(.92,.34+(best.score*.055)+(margin*.035)));

  // Match strengths are independent fits, not shares of a 100% pie.
  const matches=ranked.map((item,index)=>{
    const cues=[...new Set(reasons[item.type])].slice(0,4);
    const strength=item.score<=0?0:Math.max(7,Math.min(94,Math.round(16+item.score*8.2)));
    return {
      type:item.type,
      score:item.score,
      strength,
      cues,
      strongest:index===0,
      definition:TYPE_INFO[item.type].definition,
      distinction:TYPE_INFO[item.type].distinction,
      explanation:cues.length?`Matched because of ${cues.join(', ')}.`:'No strong wording cue detected for this role.'
    };
  });

  const bestCues=matches[0]?.cues||[];
  const secondMatch=matches[1];
  const close=secondMatch && secondMatch.strength>0 && Math.abs(matches[0].strength-secondMatch.strength)<=12;
  const cueText=bestCues.length?`Strongest cues: ${bestCues.join(' + ')}.`:'Suggested from the sentence structure rather than a single keyword.';
  const ambiguity=close?`Close reading: ${TYPE_INFO[secondMatch.type].label} also fits at ${secondMatch.strength}%.`:'The strongest role is clearly ahead of the alternatives.';

  return {
    type:best.type,
    confidence,
    reason:`${cueText} ${ambiguity} Match strengths reflect language cues and a small illustrative reference set, not probabilities or correctness.`,
    scores,
    matches,
    alternatives:ranked.slice(1,3),
    ambiguity:close?secondMatch.type:null
  };
}

function containsPhrase(text,phrase){
  const escaped=escapeRegex(String(phrase).trim()).replace(/\s+/g,'\\s+');
  return new RegExp(`(?:^|\\b)${escaped}(?:$|\\b)`,'i').test(text);
}
function escapeRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
