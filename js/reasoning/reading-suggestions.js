// Research fallback for any node: informed search suggestions are NOT verified citations.
// Keep this separate from the curated architectural drawings and project precedents.
const groups=[
 ['Circulation & Access',/\b(?:circulation|access(?:ible|ibility)?|movement|flow|wayfinding|pedestrian|route|path|approach|transition|entry|egress)\b/i,'architectural circulation wayfinding accessibility spatial sequence'],
 ['Privacy & Visibility',/\b(?:privacy|private|public|visibility|sightline|visual|permeab(?:le|ility)|enclos(?:e|ure)|threshold|exposure)\b/i,'architecture privacy gradient visibility threshold spatial boundaries'],
 ['Flexibility & Adaptation',/\b(?:flexib(?:le|ility)|adapt(?:able|ation)|movable|modular|transform|reconfigur|multi.?use|change|temporary)\b/i,'adaptable architecture open building flexible spaces'],
 ['Structure & Assembly',/\b(?:structur|column|beam|span|cantilever|material|concrete|steel|timber|assembly|joinery|support|foundation)\b/i,'architectural structural systems construction detailing building assembly'],
 ['Light & Environmental Performance',/\b(?:daylight|sunlight|shade|shadow|thermal|ventilat|wind|cooling|rain|climate|energy|glare|facade|façade)\b/i,'architecture passive design daylight ventilation environmental performance'],
 ['Occupation & Social Space',/\b(?:seat|gather|social|occup|individual|group|communal|comfort|student|learning|informal|shared|interaction)\b/i,'architecture space use behaviour seating social learning environments'],
 ['Spatial Form & Relationships',/\b(?:void|volume|height|scale|mass|geometry|orientation|adjacen|layer|zone|room|space|boundary|density|proportion)\b/i,'architectural spatial organisation adjacency proportion form'],
 ['Acoustics & Sensory Experience',/\b(?:sound|noise|acoustic|quiet|sensory|tactile|smell|texture|reverberat)\b/i,'architectural acoustics sensory experience spatial design']
];
const stop=new Set(('a an and the or but because if as into of in on at to for from by with within without should be is are was were want wants need needs make makes use uses using create creating provide provides possible could would will this that these those our their his her its it i we they you my have has had more less different degree degrees design designing architecture architectural building project node brief proposal thing something space spaces example examples overall detail better perhaps maybe approximately potential significant specific useful necessary certain standard relatively clearly future previous alternate selected updated supported unknown important visual graphical').split(' '));
const title=s=>String(s||'').replace(/\b\w/g,v=>v.toUpperCase());
const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const scholar=query=>'https://scholar.google.com/scholar?q='+encodeURIComponent(query);
const book=query=>'https://books.google.com/books?q='+encodeURIComponent(query);
const projects=query=>'https://www.google.com/search?q='+encodeURIComponent('site:archdaily.com '+query);
export function suggestResearch(text,limit=5){
 const raw=String(text||'').trim().slice(0,600);
 const known=groups.filter(g=>g[1].test(raw)).map(([label,_,query])=>({label,query,kind:'topic'}));
 const found=new Set();
 const terms=(raw.toLowerCase().match(/[a-zÀ-ž][a-zÀ-ž-]{3,}/g)||[]).map(w=>w.replace(/-$/,'')).filter(w=>!stop.has(w));
 const keywords=[];
 for(const w of terms){if(!found.has(w)){found.add(w);keywords.push(w);}if(keywords.length===4)break;}
 const items=known.slice(0,3);
 for(const keyword of keywords){if(items.length>=limit)break;if(items.some(item=>item.label.toLowerCase().includes(keyword)))continue;items.push({label:title(keyword),query:'architecture '+keyword+' design spatial precedent',kind:'keyword'});}
 if(!items.length)items.push({label:'Spatial Interpretation',query:'architecture spatial interpretation design reasoning',kind:'general'});
 return items.slice(0,limit).map(item=>({...item,scholar:scholar(item.query),books:book(item.query),projects:projects(item.query)}));
}
export function researchMarkup(text,{compact=false}={}){
 const rows=suggestResearch(text,compact?3:5);
 return `<section class="spatial-research-fallback" aria-label="Further reading suggestions"><h4>Architectural Keywords & Suggested Readings</h4><p class="spatial-research-disclaimer">Relevant topics inferred from this sentence. These are <strong>external search links</strong>, not verified articles or evidence of a correct design. Refine the keywords to investigate further.</p><div class="spatial-research-items">${rows.map(row=>`<article class="spatial-research-item"><strong>${esc(row.label)}</strong><div class="spatial-research-links"><a href="${row.scholar}" target="_blank" rel="noopener noreferrer">Scholarly readings ↗</a><a href="${row.books}" target="_blank" rel="noopener noreferrer">Books ↗</a><a href="${row.projects}" target="_blank" rel="noopener noreferrer">Built examples ↗</a></div></article>`).join('')}</div></section>`;
}
