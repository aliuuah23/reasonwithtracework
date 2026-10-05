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

function isDesignerSelected(h){
  return String(h.id||'').startsWith('hotspot-manual-') || h.concept==='custom' || h.source==='designer';
}

function filterHotspots(hotspots,mode='all'){
  if(mode==='selected') return hotspots.filter(isDesignerSelected);
  if(mode==='suggested') return hotspots.filter(h=>!isDesignerSelected(h));
  return hotspots;
}

export function renderBrief(state,handlers,{showSuggestions=true,hotspotFilter='all'}={}){
  const doc=document.getElementById('briefDocument'), list=document.getElementById('hotspotList'), count=document.getElementById('hotspotCount');
  const chunk=activeChunk(state);
  const displayedText=chunk?.text||state.brief;
  const scoped=chunkScopedHotspots(state,chunk);
  const filtered=filterHotspots(scoped,hotspotFilter);
  const visible=showSuggestions?filtered:filtered.filter(isDesignerSelected);
  const relative=relativeHotspots(visible,chunk);
  const selectedId=state.selectedHotspotId;

  const nav=document.getElementById('briefChunkNav');
  const select=document.getElementById('briefChunkSelect');
  const counter=document.getElementById('briefChunkCounter');
  const file=document.getElementById('briefChunkFile');
  const files=document.getElementById('briefChunkFiles');
  if(nav){
    const enabled=(state.briefChunks?.length||0)>1;
    nav.classList.toggle('hidden',!enabled);
    files?.classList.toggle('hidden',!enabled);
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
      if(files){
        files.innerHTML=state.briefChunks.map((c,idx)=>{
          const n=chunkScopedHotspots(state,c).length;
          return `<button type="button" class="brief-file-card ${c.id===chunk?.id?'active':''}" data-brief-chunk="${escapeHtml(c.id)}"><span>${String(idx+1).padStart(2,'0')}</span><strong>${escapeHtml(c.title)}</strong><small>${n} hotspot${n===1?'':'s'}</small></button>`;
        }).join('');
        files.querySelectorAll('[data-brief-chunk]').forEach(b=>b.onclick=()=>handlers.onChunk?.(b.dataset.briefChunk));
      }
    } else if(files){
      files.innerHTML='';
    }
  }

  if(visible.length){
    doc.innerHTML=highlightBrief(displayedText,relative,selectedId);
    list.innerHTML=visible.map(h=>`<button class="hotspot-chip ${h.id===selectedId?'active':''}" data-hotspot="${h.id}">${escapeHtml(h.text)}<span class="hotspot-kind">${isDesignerSelected(h)?'selected':escapeHtml(h.kind||(/\s/.test(h.text)?'phrase':'word'))}</span></button>`).join('');
    [...doc.querySelectorAll('[data-hotspot]'),...list.querySelectorAll('[data-hotspot]')].forEach(el=>el.onclick=()=>handlers.onHotspot(el.dataset.hotspot));
  }else{
    doc.textContent=displayedText;
    const message=!showSuggestions && hotspotFilter!=='selected'
      ? 'Automatic suggestions are hidden. Switch to Selected by me or select text manually.'
      : hotspotFilter==='selected'
        ? 'No designer-selected hotspots in this section yet. Select text manually to add one.'
        : 'No hotspots in this view. Select text manually or switch the hotspot filter.';
    list.innerHTML=`<span style="font-size:12px;color:var(--muted)">${message}</span>`;
  }
  if(count) count.textContent=chunk?`${visible.length}/${scoped.length}`:`${visible.length}/${state.hotspots.length}`;
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
    out+=`<button class="hotspot-inline ${h.id===selectedId?'active':''}" data-hotspot="${h.id}" title="${isDesignerSelected(h)?'Selected by designer':h.kind==='word'?'Word':'Phrase'} hotspot · trace this reading">${escapeHtml(text.slice(h.start,h.end))}</button>`;
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
  document.getElementById('briefChunkFiles')?.classList.toggle('hidden',open || !(state.briefChunks?.length>1));
  if(open)document.getElementById('briefEditor').value=state.brief;
}
