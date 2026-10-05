import { escapeHtml } from '../input/brief-parser.js';

export function renderBrief(state,handlers){
  const doc=document.getElementById('briefDocument'), list=document.getElementById('hotspotList'), count=document.getElementById('hotspotCount');
  doc.innerHTML=highlightBrief(state.brief,state.hotspots,state.selectedHotspotId);
  list.innerHTML=state.hotspots.map(h=>`<button class="hotspot-chip ${h.id===state.selectedHotspotId?'active':''}" data-hotspot="${h.id}">${escapeHtml(h.text)}<span class="hotspot-kind">${escapeHtml(h.kind||(/\s/.test(h.text)?'phrase':'word'))}</span></button>`).join('') || `<span style="font-size:12px;color:var(--muted)">No hotspots detected. Select a phrase manually.</span>`;
  count.textContent=state.hotspots.length;
  [...doc.querySelectorAll('[data-hotspot]'),...list.querySelectorAll('[data-hotspot]')].forEach(el=>el.onclick=()=>handlers.onHotspot(el.dataset.hotspot));
}

export function highlightBrief(text,hotspots,selectedId){
  if(!text)return '';
  // HTML cannot make two overlapping buttons occupy the same characters. The
  // selected hotspot therefore wins; otherwise phrase-level hotspots win inline,
  // while all word-level alternatives remain available in the hotspot list.
  const selected=hotspots.find(h=>h.id===selectedId);
  const ranked=[...hotspots].sort((a,b)=>{
    if(selected && a.id===selected.id)return -1;
    if(selected && b.id===selected.id)return 1;
    const ak=a.kind==='phrase'?1:0,bk=b.kind==='phrase'?1:0;
    return bk-ak || (b.end-b.start)-(a.end-a.start) || a.start-b.start;
  });
  const chosen=[];
  for(const h of ranked){
    if(!chosen.some(x=>h.start<x.end&&h.end>x.start))chosen.push(h);
  }
  chosen.sort((a,b)=>a.start-b.start);
  let cursor=0,out='';
  chosen.forEach(h=>{
    out+=escapeHtml(text.slice(cursor,h.start));
    out+=`<button class="hotspot-inline ${h.id===selectedId?'active':''}" data-hotspot="${h.id}" title="${h.kind==='word'?'Word':'Phrase'} hotspot · trace this reading">${escapeHtml(text.slice(h.start,h.end))}</button>`;
    cursor=h.end;
  });
  return out+escapeHtml(text.slice(cursor));
}
export function renderLegend(ontology){
  document.getElementById('ontologyLegend').innerHTML=ontology.map(o=>`<span class="legend-item" style="--legend-color:${o.color}"><i></i>${o.short}</span>`).join('');
}
export function toggleBriefEditor(open,state){
  document.getElementById('briefEditorWrap').classList.toggle('hidden',!open);
  document.getElementById('briefDocument').classList.toggle('hidden',open);
  if(open)document.getElementById('briefEditor').value=state.brief;
}
