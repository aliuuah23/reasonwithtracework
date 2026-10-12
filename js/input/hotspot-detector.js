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

const TOKEN_CHAR=/[\p{L}\p{N}_]/u;
function isTokenChar(ch=''){ return Boolean(ch && TOKEN_CHAR.test(ch)); }

export function normaliseHotspotSelection(text,start,end){
  const source=String(text||'');
  let a=Math.max(0,Math.min(start,end,source.length));
  let b=Math.max(0,Math.min(Math.max(start,end),source.length));
  while(a<b && /\s/.test(source[a])) a++;
  while(b>a && /\s/.test(source[b-1])) b--;
  if(a>=b) return {start:a,end:b,text:''};

  // If the drag began or ended inside a word, expand to the full token so a
  // hotspot never displays chopped letters such as “rivac” instead of “privacy”.
  if(a>0 && isTokenChar(source[a]) && isTokenChar(source[a-1])){
    while(a>0 && isTokenChar(source[a-1])) a--;
  }
  if(b<source.length && isTokenChar(source[b-1]) && isTokenChar(source[b])){
    while(b<source.length && isTokenChar(source[b])) b++;
  }

  // Keep internal apostrophes/hyphens with the word when both sides are lexical.
  while(a>1 && /['’\-]/.test(source[a-1]) && isTokenChar(source[a-2])) a--;
  while(b<source.length-1 && /['’\-]/.test(source[b]) && isTokenChar(source[b+1])) b++;

  return {start:a,end:b,text:source.slice(a,b)};
}

function comparable(value=''){
  return String(value).toLocaleLowerCase().replace(/\s+/g,' ').trim();
}

function findNearestText(source,needle,expected=0){
  const text=String(source||''), target=String(needle||'').trim();
  if(!text || !target) return null;
  const lower=text.toLocaleLowerCase(), wanted=target.toLocaleLowerCase();
  const hits=[];
  let cursor=0;
  while((cursor=lower.indexOf(wanted,cursor))>-1){ hits.push({start:cursor,end:cursor+target.length}); cursor+=Math.max(1,target.length); }
  if(!hits.length){
    const pattern=target.split(/\s+/).map(escapeRegex).join('\\s+');
    try{
      const re=new RegExp(pattern,'giu');
      let m; while((m=re.exec(text))){ hits.push({start:m.index,end:m.index+m[0].length}); if(!m[0].length)re.lastIndex++; }
    }catch{}
  }
  if(!hits.length)return null;
  return hits.sort((x,y)=>Math.abs(x.start-expected)-Math.abs(y.start-expected))[0];
}

export function repairHotspotRanges(text,hotspots=[]){
  const source=String(text||'');
  return (hotspots||[]).map(h=>{
    const start=Math.max(0,Math.min(Number(h.start)||0,source.length));
    const end=Math.max(start,Math.min(Number(h.end)||start,source.length));
    const slice=source.slice(start,end);
    let resolved={start,end};
    if(!h.text || comparable(slice)!==comparable(h.text)){
      resolved=findNearestText(source,h.text,start)||resolved;
    }
    const snapped=normaliseHotspotSelection(source,resolved.start,resolved.end);
    const nextText=snapped.text||h.text||slice;
    return {...h,start:snapped.start,end:snapped.end,text:nextText,kind:/\s/.test(nextText.trim())?'phrase':'word'};
  });
}

export async function detectHotspots(text){
  const data = await prompts();
  const candidates=[];
  Object.entries(data).forEach(([concept,item]) => item.aliases.forEach(alias => candidates.push([alias,concept])));
  extraPatterns.forEach(x=>candidates.push(x));

  const source=String(text||'');
  const lower=source.toLocaleLowerCase();
  const raw=[];
  const seen=new Set();
  for(const [phrase,concept] of candidates){
    let start=0;
    const needle=String(phrase||'').toLocaleLowerCase();
    while(needle && (start=lower.indexOf(needle,start))>-1){
      const end=start+String(phrase).length;
      const before=source[start-1], after=source[end];
      if((!before||!isTokenChar(before))&&(!after||!isTokenChar(after))){
        const snapped=normaliseHotspotSelection(source,start,end);
        const key=`${snapped.start}:${snapped.end}:${concept}`;
        if(!seen.has(key) && snapped.text){
          seen.add(key);
          raw.push({text:snapped.text,concept,start:snapped.start,end:snapped.end,kind:/\s/.test(snapped.text.trim())?'phrase':'word'});
        }
      }
      start=Math.max(end,start+1);
    }
  }

  // Preserve overlapping word + phrase readings. Selection in the source panel
  // decides which layer is shown when two readings occupy the same wording.
  raw.sort((a,b)=>a.start-b.start || (b.end-b.start)-(a.end-a.start));
  return raw.map((h,i)=>({...h,id:`hotspot-${i+1}`,reason:h.kind==='phrase'?'Phrase-level semantic reading; the complete wording is preserved because the phrase may carry more than its individual terms.':'Word-level reading retained because designers in the pilot also extracted single terms.'}));
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

function escapeRegex(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
