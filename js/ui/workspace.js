import { escapeHtml } from '../input/brief-parser.js';

export function renderBrief(state,handlers){
  const doc=document.getElementById('briefDocument'), list=document.getElementById('hotspotList'), count=document.getElementById('hotspotCount');
  doc.innerHTML=highlightBrief(state.brief,state.hotspots,state.selectedHotspotId);
  list.innerHTML=state.hotspots.map(h=>`<button class="hotspot-chip ${h.id===state.selectedHotspotId?'active':''}" data-hotspot="${h.id}">${escapeHtml(h.text)}</button>`).join('') || `<span style="font-size:12px;color:var(--muted)">No hotspots detected. Select a phrase manually.</span>`;
  count.textContent=state.hotspots.length;
  [...doc.querySelectorAll('[data-hotspot]'),...list.querySelectorAll('[data-hotspot]')].forEach(el=>el.onclick=()=>handlers.onHotspot(el.dataset.hotspot));
}
export function highlightBrief(text,hotspots,selectedId){
  if(!text)return '';
  let cursor=0,out='';
  hotspots.forEach(h=>{
    out+=escapeHtml(text.slice(cursor,h.start));
    out+=`<button class="hotspot-inline ${h.id===selectedId?'active':''}" data-hotspot="${h.id}" title="Trace this phrase">${escapeHtml(text.slice(h.start,h.end))}</button>`;
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
