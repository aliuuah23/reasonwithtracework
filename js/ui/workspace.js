import { escapeHtml } from '../input/brief-parser.js';

function activeChunk(state){
  if(!state.briefChunks?.length) return null;
  return state.briefChunks.find(c=>c.id===state.activeBriefChunkId) || state.briefChunks[0];
}

function chunkScopedHotspots(state,chunk){
  if(!chunk) return state.hotspots||[];
  return (state.hotspots||[]).filter(h=>h.chunkId===chunk.id || (h.start>=chunk.start && h.start<chunk.end));
}

function relativeHotspots(hotspots,chunk){
  if(!chunk) return hotspots;
  return hotspots.map(h=>({...h,start:h.start-chunk.start,end:h.end-chunk.start}));
}

export function renderBrief(state,handlers,{showSuggestions=true}={}){
  const doc=document.getElementById('briefDocument'), list=document.getElementById('hotspotList'), count=document.getElementById('hotspotCount');
  const chunk=activeChunk(state);
  const displayedText=chunk?.text||state.brief;
  const scoped=chunkScopedHotspots(state,chunk);
  const relative=relativeHotspots(scoped,chunk);
  const selectedId=state.selectedHotspotId;

  const nav=document.getElementById('briefChunkNav');
  const select=document.getElementById('briefChunkSelect');
  const counter=document.getElementById('briefChunkCounter');
  const file=document.getElementById('briefChunkFile');
  if(nav){
    const enabled=(state.briefChunks?.length||0)>1;
    nav.classList.toggle('hidden',!enabled);
    if(enabled && select){
      select.innerHTML=state.briefChunks.map((c,i)=>`<option value="${escapeHtml(c.id)}">${i+1}. ${escapeHtml(c.title)}</option>`).join('');
      select.value=chunk?.id||state.briefChunks[0].id;
      select.onchange=()=>handlers.onChunk?.(select.value);
      const i=Math.max(0,state.briefChunks.findIndex(c=>c.id===select.value));
      if(counter)counter.textContent=`Section ${i+1} of ${state.briefChunks.length}`;
      if(file)file.textContent=state.sourceFileName||'Long brief';
      const prev=document.getElementById('prevBriefChunk'),next=document.getElementById('nextBriefChunk');
      if(prev){prev.disabled=i<=0;prev.onclick=()=>handlers.onChunk?.(state.briefChunks[Math.max(0,i-1)].id);}
      if(next){next.disabled=i>=state.briefChunks.length-1;next.onclick=()=>handlers.onChunk?.(state.briefChunks[Math.min(state.briefChunks.length-1,i+1)].id);}
    }
  }

  if(showSuggestions){
    doc.innerHTML=highlightBrief(displayedText,relative,selectedId);
    list.innerHTML=scoped.map(h=>`<button class="hotspot-chip ${h.id===selectedId?'active':''}" data-hotspot="${h.id}">${escapeHtml(h.text)}<span class="hotspot-kind">${escapeHtml(h.kind||(/\s/.test(h.text)?'phrase':'word'))}</span></button>`).join('') || `<span style="font-size:12px;color:var(--muted)">No hotspots detected in this section. Select text manually.</span>`;
    [...doc.querySelectorAll('[data-hotspot]'),...list.querySelectorAll('[data-hotspot]')].forEach(el=>el.onclick=()=>handlers.onHotspot(el.dataset.hotspot));
  }else{
    doc.textContent=displayedText;
    list.innerHTML=`<span style="font-size:12px;color:var(--muted)">Automatic hotspot suggestions are hidden. Select any word or phrase manually.</span>`;
  }
  count.textContent=chunk?`${scoped.length}/${state.hotspots.length}`:state.hotspots.length;
}

export function highlightBrief(text,hotspots,selectedId){
  if(!text)return '';
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
  document.getElementById('ontologyLegend').innerHTML=ontology.map(o=>`<span class="legend-item" style="--legend-color:${o.color}"><i></i>${escapeHtml(o.label||o.id)}</span>`).join('');
}
export function toggleBriefEditor(open,state){
  document.getElementById('briefEditorWrap').classList.toggle('hidden',!open);
  document.getElementById('briefDocument').classList.toggle('hidden',open);
  document.getElementById('briefChunkNav')?.classList.toggle('hidden',open || !(state.briefChunks?.length>1));
  if(open)document.getElementById('briefEditor').value=state.brief;
}
