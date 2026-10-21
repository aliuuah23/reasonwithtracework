// D3.1 · Optional, explainable framework recommendation. Does not edit projects.
// No project names, pavilion cases, participant answer keys or remote API calls.
import { frameworks } from '../core/frameworks.js';
const patterns={
  requirements:[[/\b(must|shall|required|requirement|minimum|maximum|at least|no more than|constraint|unobstructed|compliance|accessib|regulat|capacity|users?|stakeholder|standard)\b/gi,4,'Requirements and constraints'],[/\b(test|verify|measure|check|scenario|criteria)\b/gi,3,'Testable conditions']],
  fivewhys:[[/\b(why|because|root cause|cause|underlying|problem|failure|reason|issue)\b/gi,4,'Causal enquiry'],[/\b(due to|results from|leads to|stems from|repeated|again)\b/gi,3,'Cause-and-effect statements']],
  laddering:[[/\b(value|important|matters|prefer|feel|experience|meaningful|belonging|autonomy|comfort|dignity|privacy)\b/gi,4,'Experience and underlying values'],[/\b(enable|allow|benefit|consequence|preference|attribute)\b/gi,3,'Attributes and their consequences']],
  framing:[[/\b(reframe|frame|alternative|instead|opportunity|possibility|concept|approach|rethinking|what if)\b/gi,4,'Competing ways to frame the problem'],[/\b(tension|conflict|challenge|ambigu|trade.off)\b/gi,2,'An unresolved framing tension']],
  reflective:[[/\b(iterat|prototype|sketch|experiment|revision|revise|observe|feedback|reflection|tested|mockup|trial)\b/gi,4,'Design action and revision'],[/\b(then|after|changed|learned|response|result)\b/gi,2,'Consequences and reflection']],
  semantics:[[/\b(mean|meaning|interpret|language|communicat|symbol|perceiv|legib|sign|understand|affordance|identity)\b/gi,4,'Spatial language and interpretation'],[/\b(association|expectation|reading|message|representation)\b/gi,3,'User interpretation and communication']],
  tracework:[[/\b(spatial|space|architecture|design|location|movement|seating|enclosure|form|boundary|reasoning)\b/gi,2,'Spatial decisions and reasoning'],[/\b(evaluat|interpret|ground|consequence|aim|goal|trade.off)\b/gi,2,'Several linked reasoning roles']],
  freeform:[[/\b(explor|open ended|uncertain|thought|fragment|brainstorm|question|unclear|emerging)\b/gi,2,'Exploratory or unsettled thinking']]
};
const cut=s=>String(s||'').replace(/\s+/g,' ').slice(0,15000);
export function recommendFrameworks(state){
  const brief=cut(state?.brief), thoughts=(state?.nodes||[]).filter(n=>!n.meta?.artifactKind).map(n=>n.label||'').join(' ').slice(0,24000), text=`${brief} ${thoughts}`;
  const scored=frameworks.map(fw=>{
    const hits=[], signals=patterns[fw.id]||[];
    let score=0;
    for(const [expr,weight,description] of signals){
      expr.lastIndex=0;const matches=[...text.matchAll(expr)];
      if(matches.length){score+=weight*Math.min(3,matches.length);hits.push(`${description} (${matches.length} cue${matches.length===1?'':'s'})`);}
    }
    const n=(state?.nodes||[]).filter(x=>!x.meta?.artifactKind);
    const count=t=>n.filter(x=>x.type===t).length;
    if(fw.id==='requirements'&&count('input')>2)score+=2;
    if(fw.id==='reflective'&&count('evaluation')&&count('consequence'))score+=3;
    if(fw.id==='tracework'&&new Set(n.map(x=>x.type)).size>=4)score+=4;
    if(fw.id==='freeform'&&n.filter(x=>x.type==='note').length>=3)score+=6;
    if(fw.id==='framing'&&count('interpretation')>=2)score+=3;
    const fit=score>=12?'Strong textual fit':score>=5?'Possible fit':'Exploratory option';
    return {id:fw.id,label:fw.label,score,fit,signals:hits,why:fw.description};
  });
  return scored.sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label)).slice(0,4);
}
