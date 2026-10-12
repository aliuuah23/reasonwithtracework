let cache=null;
export async function loadCaseStudies(){
  if(cache)return cache;
  cache=await (await fetch('./data/case-studies.json?v=c1.3')).json();
  return cache;
}

// Rank by the words the designer actually used, not by the project typology
// or the broad role of the node. A match is a comparison prompt, not a design answer.
export async function findCaseStudies({text='',type='',limit=3}={}){
  const items=await loadCaseStudies();
  const terms=new Set(expand(tokenise(text)));
  if(!terms.size)return [];
  return items.map(item=>{
    const feature=normalise(`${item.feature||''} ${(item.tags||[]).join(' ')} ${(item.moves||[]).join(' ')}`);
    const context=normalise(`${item.name||''} ${item.note||''} ${item.whyRelevant||''}`);
    const featureTokens=new Set(tokenise(feature));
    const contextTokens=new Set(tokenise(context));
    let score=0;const matched=[];
    for(const term of terms){
      const word=stem(term);
      if([...featureTokens].some(t=>stem(t)===word)){score+=4;matched.push(term);}
      else if([...contextTokens].some(t=>stem(t)===word)){score+=1;matched.push(term);}
    }
    // Require at least one actual lexical/semantic architectural feature match.
    return {...item,_score:score,_matched:[...new Set(matched)]};
  }).filter(item=>item._score>=4)
    .sort((a,b)=>b._score-a._score || b._matched.length-a._matched.length || a.name.localeCompare(b.name))
    .slice(0,limit);
}
const synonyms={
 privacy:['partition','screening','enclosure','threshold'],private:['privacy','enclosure','partition'],
 group:['gathering','community','study'],individual:['study','enclosure'],social:['community','gathering'],
 openness:['open','porosity'],open:['openness','porosity'],visible:['visual','openness'],
 flexible:['flexibility','reconfiguration','adaptability'],flexibility:['reconfiguration','adaptability'],
 adapt:['adaptability','reconfiguration'],movable:['reconfiguration','modular'],mobile:['modular','reconfiguration'],
 route:['circulation','movement'],path:['circulation','movement'],pedestrian:['movement','access','circulation'],
 access:['circulation','movement'],entry:['threshold','access'],entrance:['threshold','access'],
 seating:['seat','occupation'],seat:['seating','occupation'],bench:['seating'],
 canopy:['shelter','roof','climate'],shade:['shelter','canopy'],sheltered:['shelter','canopy'],
 modular:['module','reconfiguration'],expansion:['incremental','adaptability'],
 building:['structure'],structural:['structure'],level:['topography','floor'],
 quiet:['enclosure','study'],reading:['library','study'],noise:['enclosure','partition'],
 student:['study','learning'],students:['study','learning'],user:['occupation','programme'],
 light:['daylight','courtyard','openness'],sun:['shade','climate']
};
function normalise(s){return String(s).toLowerCase();}
function stem(s){return String(s).toLowerCase().replace(/(ation|ments|ment|ings|ing|ies|es|s)$/,'');}
function tokenise(s){
 const stop=new Set(['that','this','these','those','their','from','with','into','what','which','while','there','when','where','should','could','would','space','design','building','project','will','have','they','them','make','provide','allow','also','more','less','just','than','much','overall']);
 return [...new Set(normalise(s).match(/[a-z]{4,}/g)||[])].filter(w=>!stop.has(w));
}
function expand(words){const out=new Set(words);words.forEach(w=>{for(const a of (synonyms[w]||[]))out.add(a);});return [...out];}
