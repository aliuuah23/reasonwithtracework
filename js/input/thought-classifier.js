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
    phrases:['because','due to','based on','observed that','users need','site shows','the brief states','evidence','precedent suggests','research shows','so far we know'],
    words:['because','evidence','observation','precedent','research','need','needs','condition','rationale','basis','survey','pilot']
  },
  consequence: {
    phrases:['place','locate','arrange','rearrange','reconfigure','moveable','movable','open up','close off','create a','add seating','widen','narrow','orient','cluster','separate','connect','provide a','use a canopy','edge seating'],
    words:['space','spatial','layout','seating','furniture','threshold','route','circulation','canopy','enclosure','edge','zone','opening','wall','roof','bench','table','cluster','arrange','rearrange','locate','place','move','reconfigure']
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
  if(!value) return {type:null,confidence:0,reason:'Start typing and TRACEWORK will suggest a reasoning role.',scores:{},matches:[]};

  const lower=` ${value.toLowerCase()} `;
  const scores=Object.fromEntries(ORDER.map(t=>[t,0]));
  const reasons=Object.fromEntries(ORDER.map(t=>[t,[]]));

  for(const type of ORDER){
    for(const phrase of RULES[type].phrases){
      if(containsPhrase(value,phrase)){ scores[type]+=3; reasons[type].push(`“${phrase}”`); }
    }
    for(const word of RULES[type].words){
      const re=new RegExp(`\\b${escapeRegex(word.toLowerCase())}\\b`,'i');
      if(re.test(value)){ scores[type]+=1; reasons[type].push(`“${word}”`); }
    }
  }

  if(/[?]$/.test(value)) scores.interpretation+=0.5;
  if(/\b(because|since|as a result of)\b/i.test(value)) scores.grounding+=2;
  if(/\b(students?|users?|people|visitors?|occupants?)\s+(need|require|benefit from)\b/i.test(value)){ scores.grounding+=3; reasons.grounding.push('user need'); }
  if(/\b(but|however|while|whereas|although)\b/i.test(value)) scores.evaluation+=1.5;
  if(/\b(to|so that|in order to)\b/i.test(value) && /\b(support|enable|encourage|allow|ensure|promote)\b/i.test(value)) scores.goal+=2;
  if(/\b(place|locate|arrange|orient|move|open|close|cluster|separate|connect|provide|add|remove)\b/i.test(value)) scores.consequence+=1.5;
  if(/\b(means?|interpret|reading|understand)\b/i.test(value)) scores.interpretation+=1.5;

  const expected=NEXT[afterType];
  if(expected){ scores[expected]+=0.65; reasons[expected].push('selected node context'); }

  let ranked=ORDER.map(type=>({type,score:scores[type]})).sort((a,b)=>b.score-a.score);
  if(ranked[0].score===0){
    const fallback=expected||'interpretation';
    scores[fallback]=0.5;
    ranked=ORDER.map(type=>({type,score:scores[type]})).sort((a,b)=>b.score-a.score);
  }

  const best=ranked[0],second=ranked[1];
  const margin=Math.max(0,best.score-second.score);
  const confidence=Math.max(.35,Math.min(.94,.44+(best.score*.07)+(margin*.05)));
  const bestCues=[...new Set(reasons[best.type])].slice(0,3);
  const cueText=bestCues.length?`Cues: ${bestCues.join(' + ')}.`:'Suggested from the overall wording.';

  const maxScore=Math.max(best.score,.5);
  const matches=ranked.slice(0,4).map((item,index)=>{
    const relative=item.score<=0?0:item.score/maxScore;
    const strength=Math.max(0,Math.min(99,Math.round((confidence*100)*relative)));
    return {
      type:item.type,
      score:item.score,
      strength,
      cues:[...new Set(reasons[item.type])].slice(0,2),
      strongest:index===0
    };
  });

  return {
    type:best.type,
    confidence,
    reason:`${cueText} Match percentages show relative fit, not certainty.`,
    scores,
    matches,
    alternatives:ranked.slice(1,3)
  };
}

function containsPhrase(text,phrase){
  const escaped=escapeRegex(String(phrase).trim()).replace(/\s+/g,'\\s+');
  return new RegExp(`(?:^|\\b)${escaped}(?:$|\\b)`,'i').test(text);
}
function escapeRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
