const RULES = {
  input: {
    phrases:['the brief','brief asks','brief requires','must','requirement','constraint','site condition','user requirement','given that','20 more seats','sheltered footprint','pedestrian route'],
    words:['brief','requires','requirement','constraint','site','user','programme','program','area','footprint']
  },
  interpretation: {
    phrases:['i read this as','this means','could mean','might mean','in this context','understand this as','by this i mean','we mean','means that'],
    words:['meaning','interpret','reading','understand','implies','suggests','means']
  },
  grounding: {
    phrases:['because','due to','based on','according to','observed that','users need','site shows','the brief states','evidence','precedent suggests','research shows','so far we know'],
    words:['because','evidence','observation','precedent','research','need','needs','condition','rationale','basis','survey','pilot']
  },
  consequence: {
    phrases:['place','locate','arrange','reconfigure','moveable','movable','open up','close off','create a','add seating','widen','narrow','orient','cluster','separate','connect','provide a','use a canopy','edge seating'],
    words:['space','spatial','layout','seating','furniture','threshold','route','circulation','canopy','enclosure','edge','zone','opening','wall','roof','bench','table','cluster','arrange','locate','place','move','reconfigure']
  },
  evaluation: {
    phrases:['trade-off','trade off','but this','however','at the cost of','prioritises','prioritizes','compromises','allows','limits','benefit','drawback','risk','works better','less flexible','more flexible'],
    words:['tradeoff','trade-off','priority','prioritise','prioritize','compromise','benefit','risk','drawback','better','worse','efficient','adaptability','comfort','clarity','simplicity']
  },
  goal: {
    phrases:['the aim is','the goal is','in order to','so that','ultimately','design aim','should enable','should support','we want to','intended to','help users','encourage','ensure that'],
    words:['aim','goal','purpose','support','enable','encourage','ensure','promote','allow','serve']
  }
};

const ORDER=['input','interpretation','grounding','consequence','evaluation','goal'];
const NEXT={input:'interpretation',interpretation:'grounding',grounding:'consequence',consequence:'evaluation',evaluation:'goal'};

export function classifyThought(text,{afterType=null}={}){
  const value=String(text||'').trim();
  if(!value) return {type:null,confidence:0,reason:'Start typing and TRACEWORK will suggest a reasoning role.',scores:{}};
  const lower=` ${value.toLowerCase()} `;
  const scores=Object.fromEntries(ORDER.map(t=>[t,0]));
  const reasons=Object.fromEntries(ORDER.map(t=>[t,[]]));

  for(const type of ORDER){
    for(const phrase of RULES[type].phrases){
      if(lower.includes(phrase.toLowerCase())){ scores[type]+=3; reasons[type].push(`“${phrase}”`); }
    }
    for(const word of RULES[type].words){
      const re=new RegExp(`\\b${escapeRegex(word.toLowerCase())}\\b`,'i');
      if(re.test(value)){ scores[type]+=1; reasons[type].push(`“${word}”`); }
    }
  }

  // Sentence shape adds a little semantic structure without forcing a linear answer.
  if(/[?]$/.test(value)) scores.interpretation+=0.5;
  if(/\b(because|since|as a result of)\b/i.test(value)) scores.grounding+=2;
  if(/\b(but|however|while|whereas|although)\b/i.test(value)) scores.evaluation+=1.5;
  if(/\b(to|so that|in order to)\b/i.test(value) && /\b(support|enable|encourage|allow|ensure|promote)\b/i.test(value)) scores.goal+=2;
  if(/\b(place|locate|arrange|orient|move|open|close|cluster|separate|connect|provide|add|remove)\b/i.test(value)) scores.consequence+=1.5;
  if(/\b(means?|interpret|reading|understand)\b/i.test(value)) scores.interpretation+=1.5;

  // The selected node is context, not a command. It only nudges the expected next role.
  const expected=NEXT[afterType];
  if(expected){ scores[expected]+=0.65; reasons[expected].push('follows the selected reasoning move'); }

  let ranked=ORDER.map(type=>({type,score:scores[type]})).sort((a,b)=>b.score-a.score);
  if(ranked[0].score===0){
    const fallback=expected||'interpretation';
    scores[fallback]=0.5;
    ranked=ORDER.map(type=>({type,score:scores[type]})).sort((a,b)=>b.score-a.score);
  }
  const best=ranked[0],second=ranked[1];
  const margin=Math.max(0,best.score-second.score);
  const confidence=Math.max(.35,Math.min(.94,.44+(best.score*.07)+(margin*.05)));
  const cue=reasons[best.type][0];
  const reason=cue ? `Suggested from ${cue}${expected===best.type?' and the selected node context':''}.` : expected===best.type ? 'Suggested from the selected node context.' : 'Suggested from the wording of this thought.';
  return {type:best.type,confidence,reason,scores,alternatives:ranked.slice(1,3)};
}

function escapeRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
