let promptData = null;
const extraPatterns = [
  ['individual and group use','mixed use'],
  ['main pedestrian route','movement'],
  ['sheltered footprint','shelter'],
  ['20 more seats','capacity'],
  ['safe','safety'], ['comfortable','comfort'], ['quiet','quiet'], ['active','activity'],
  ['shared','sharing'], ['public','publicness'], ['threshold','threshold'], ['clear','clarity'],
  ['unobstructed','movement'], ['peak periods','duration'], ['individual use','privacy'], ['group use','community'],
  ['individual','privacy'], ['group','community'], ['peak','duration'], ['route','movement'], ['seats','capacity'], ['seating','capacity']
];
async function prompts(){ if(promptData) return promptData; promptData = await (await fetch('./data/prompts.json')).json(); return promptData; }

export async function detectHotspots(text){
  const data = await prompts();
  const candidates=[];
  Object.entries(data).forEach(([concept,item]) => item.aliases.forEach(alias => candidates.push([alias,concept])));
  extraPatterns.forEach(x=>candidates.push(x));

  const lower=text.toLowerCase();
  const raw=[];
  const seen=new Set();
  for(const [phrase,concept] of candidates){
    let start=0;
    while((start=lower.indexOf(phrase.toLowerCase(),start))>-1){
      const end=start+phrase.length;
      const before=lower[start-1], after=lower[end];
      const wordish=/[a-z0-9]/;
      if((!before||!wordish.test(before))&&(!after||!wordish.test(after))){
        const key=`${start}:${end}:${concept}`;
        if(!seen.has(key)){
          seen.add(key);
          raw.push({text:text.slice(start,end),concept,start,end,kind:/\s/.test(phrase.trim())?'phrase':'word'});
        }
      }
      start=end;
    }
  }

  // Preserve overlapping word + phrase readings. This intentionally differs from
  // the previous signifier-first detector, which kept only the longest hit.
  raw.sort((a,b)=>a.start-b.start || (b.end-b.start)-(a.end-a.start));
  return raw.slice(0,18).map((h,i)=>({...h,id:`hotspot-${i+1}`,reason:h.kind==='phrase'?'Phrase-level semantic reading; the combined wording may carry more than the individual terms.':'Word-level reading retained because designers in the pilot also extracted single terms.'}));
}

export async function getPromptConfig(term,conceptHint){
  const data=await prompts();
  if(conceptHint && data[conceptHint]) return data[conceptHint];
  const lc=term.toLowerCase();
  return Object.values(data).find(item=>item.aliases.some(a=>lc.includes(a))) || {
    aliases:[term], interpretation:{question:`When you say ‘{term}’, what condition are you actually trying to create?`,choices:['A spatial condition','A user experience','A programme relationship','A performance requirement']},
    who:['Primary users','A specific user group','Mixed users','People moving through'],
    when:['Continuously','At specific times','Under specific conditions','As needs change']
  };
}
