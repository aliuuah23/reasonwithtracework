let cache=null;
export async function loadCaseStudies(){
  if(cache)return cache;
  cache=await (await fetch('./data/case-studies.json')).json();
  return cache;
}

export async function findCaseStudies({text='',type='',limit=3}={}){
  const items=await loadCaseStudies();
  const words=expand(tokenise(text));
  const typeTags={
    input:[],
    interpretation:['threshold','openness','community','flexibility'],
    grounding:['community','climate','identity','user need'],
    consequence:['movement','shelter','edge','circulation','enclosure','seating','reconfiguration'],
    evaluation:['flexibility','openness','community','trade-off','adaptability'],
    goal:['community','shelter','flexibility','capacity','occupation']
  };

  return items.map(item=>{
    let score=0;
    const hay=[
      item.name,item.designer,item.feature,item.note,item.whyRelevant,
      ...(item.tags||[]),...(item.moves||[])
    ].join(' ').toLowerCase();

    words.forEach(w=>{ if(hay.includes(w))score+=2; });
    (typeTags[type]||[]).forEach(tag=>{ if((item.tags||[]).includes(tag))score+=.45; });

    // Prefer feature-level relevance over simply being another pavilion.
    if(type==='consequence' && /(seating|move|reconfig|route|shelter|canopy|edge|wall|partition|threshold)/i.test(hay)) score+=.8;
    return {...item,_score:score};
  }).filter(x=>x._score>0)
    .sort((a,b)=>b._score-a._score||a.year-b.year)
    .slice(0,limit);
}

function expand(words){
  const map={
    flexible:['flexibility','reconfiguration'],adaptable:['flexibility','reconfiguration'],adaptability:['flexibility','reconfiguration'],
    communal:['community'],social:['community'],group:['community'],gathering:['community'],
    sheltered:['shelter','canopy'],covered:['shelter','canopy'],route:['movement','circulation'],pedestrian:['movement','circulation'],
    entry:['threshold'],open:['openness'],porous:['openness'],private:['enclosure'],individual:['enclosure'],
    weather:['shelter','climate'],seat:['seating'],seats:['seating'],busy:['capacity'],peak:['capacity']
  };
  const out=new Set(words);
  words.forEach(w=>(map[w]||[]).forEach(x=>out.add(x)));
  return [...out];
}

function tokenise(text){
  const stop=new Set(['this','that','with','from','into','than','then','they','them','their','there','where','which','should','could','would','have','will','space','design']);
  return [...new Set(String(text).toLowerCase().match(/[a-z]{4,}/g)||[])].filter(w=>!stop.has(w));
}
