let promptData = null;
const extraPatterns = [
  ['safe','safety'], ['comfortable','comfort'], ['quiet','quiet'], ['active','activity'],
  ['shared','sharing'], ['public','publicness'], ['threshold','threshold'], ['clear','clarity'],
  ['unobstructed','movement'], ['peak periods','duration'], ['individual use','privacy'], ['group use','community']
];
async function prompts(){ if(promptData) return promptData; promptData = await (await fetch('./data/prompts.json')).json(); return promptData; }
export async function detectHotspots(text){
  const data = await prompts();
  const candidates=[];
  Object.entries(data).forEach(([concept,item]) => item.aliases.forEach(alias => candidates.push([alias,concept])));
  extraPatterns.forEach(x=>candidates.push(x));
  candidates.sort((a,b)=>b[0].length-a[0].length);
  const lower=text.toLowerCase(); const hits=[]; const occupied=[];
  for(const [phrase,concept] of candidates){
    let start=0;
    while((start=lower.indexOf(phrase.toLowerCase(),start))>-1){
      const end=start+phrase.length;
      const overlaps=occupied.some(([a,b])=>start<b&&end>a);
      if(!overlaps){
        const before=lower[start-1], after=lower[end];
        const wordish=/[a-z0-9]/;
        if((!before||!wordish.test(before))&&(!after||!wordish.test(after))){
          hits.push({id:`hotspot-${hits.length+1}`,text:text.slice(start,end),concept,start,end,reason:'Can support materially different spatial readings'});
          occupied.push([start,end]);
        }
      }
      start=end;
    }
  }
  return hits.sort((a,b)=>a.start-b.start).slice(0,12);
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
