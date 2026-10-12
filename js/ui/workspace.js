import { escapeHtml } from '../input/brief-parser.js';
import { normaliseHotspotSelection } from '../input/hotspot-detector.js?v=b2.1';

function activeChunk(state){
  if(!state.briefChunks?.length) return null;
  return state.briefChunks.find(c=>c.id===state.activeBriefChunkId) || state.briefChunks[0];
}

function chunkScopedHotspots(state,chunk){
  if(!chunk) return state.hotspots||[];
  return (state.hotspots||[]).filter(h=>h.chunkId===chunk.id || (h.start>=chunk.start && h.start<chunk.end));
}

function comparableText(value=''){
  return String(value||'').toLocaleLowerCase().replace(/\s+/g,' ').trim();
}

function nearestLocalMatch(text,needle,expected=0){
  const source=String(text||''), target=String(needle||'').trim();
  if(!source || !target) return null;
  const hits=[];
  const lower=source.toLocaleLowerCase(), wanted=target.toLocaleLowerCase();
  let cursor=0;
  while((cursor=lower.indexOf(wanted,cursor))>-1){
    hits.push({start:cursor,end:cursor+target.length});
    cursor+=Math.max(1,target.length);
  }
  if(!hits.length){
    const escaped=target.split(/\s+/).map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\s+');
    try{
      const re=new RegExp(escaped,'giu');
      let m;
      while((m=re.exec(source))){
        hits.push({start:m.index,end:m.index+m[0].length});
        if(!m[0].length)re.lastIndex++;
      }
    }catch{}
  }
  if(!hits.length)return null;
  return hits.sort((a,b)=>Math.abs(a.start-expected)-Math.abs(b.start-expected))[0];
}

function resolveHotspotForText(text,h,expectedStart=Number(h.start)||0){
  const source=String(text||'');
  let start=Math.max(0,Math.min(Number(expectedStart)||0,source.length));
  let end=Math.max(start,Math.min(start+Math.max(0,(Number(h.end)||0)-(Number(h.start)||0)),source.length));

  // Stored wording is the semantic source of truth. Long-brief chunks can exclude
  // headings even though their absolute ranges still include them, so absolute
  // offsets are only a hint. If the full intended phrase exists in the visible
  // chunk, always use that exact phrase rather than trusting the old range.
  if(h.text){
    const found=nearestLocalMatch(source,h.text,start);
    // Never draw a highlight at a stale offset when the intended wording is
    // absent. This matters for chunked briefs and older locally saved traces:
    // otherwise unrelated letters/words are highlighted after selections.
    if(!found) return null;
    start=found.start;
    end=found.end;
  } else if(end<=start){
    return null;
  }

  const snapped=normaliseHotspotSelection(source,start,end);
  if(snapped.end<=snapped.start) return null;
  return {...h,start:snapped.start,end:snapped.end};
}

function chunkContentStart(fullBrief,chunk){
  if(!chunk) return 0;
  const full=String(fullBrief||'');
  const visible=String(chunk.text||'');
  const hinted=Math.max(0,Number(chunk.start)||0);
  if(!full || !visible) return hinted;
  const nearby=full.indexOf(visible,Math.max(0,hinted-16));
  if(nearby>-1 && nearby<=hinted+160) return nearby;
  const anywhere=full.indexOf(visible);
  return anywhere>-1?anywhere:hinted;
}

function relativeHotspots(hotspots,chunk,fullBrief=''){
  if(!chunk) return hotspots;
  const contentStart=chunkContentStart(fullBrief,chunk);
  return hotspots.map(h=>resolveHotspotForText(chunk.text,h,(Number(h.start)||0)-contentStart)).filter(Boolean);
}

function isDesignerSelected(h){
  return Boolean(h.edited) || String(h.id||'').startsWith('hotspot-manual-') || h.concept==='custom' || h.source==='designer';
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
  const relative=relativeHotspots(visible,chunk,state.brief);
  const selectedId=state.selectedHotspotId;

  const nav=document.getElementById('briefChunkNav');
  const select=document.getElementById('briefChunkSelect');
  const counter=document.getElementById('briefChunkCounter');
  const file=document.getElementById('briefChunkFile');
  const files=document.getElementById('briefChunkFiles');
  const tools=document.getElementById('briefChunkTools');
  const addButton=document.getElementById('addBriefChunkButton');
  const editButton=document.getElementById('editBriefChunkButton');
  const adder=document.getElementById('briefChunkAdder');
  const titleInput=document.getElementById('newBriefChunkTitle');
  const textInput=document.getElementById('newBriefChunkText');
  const saveChunk=document.getElementById('saveBriefChunk');
  const cancelChunk=document.getElementById('cancelBriefChunk');
  const chunkCount=state.briefChunks?.length||0;
  const navEnabled=chunkCount>1;
  const filingEnabled=state.briefMode==='document' && chunkCount>0;
  if(nav){
    nav.classList.toggle('hidden',!navEnabled);
    files?.classList.toggle('hidden',!filingEnabled);
    tools?.classList.toggle('hidden',state.briefMode!=='document');
    if(navEnabled && select){
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
    } else {
      if(files && filingEnabled){
        files.innerHTML=state.briefChunks.map((c,idx)=>{
          const n=chunkScopedHotspots(state,c).length;
          return `<button type="button" class="brief-file-card ${c.id===chunk?.id?'active':''}" data-brief-chunk="${escapeHtml(c.id)}"><span>${String(idx+1).padStart(2,'0')}</span><strong>${escapeHtml(c.title)}</strong><small>${n} hotspot${n===1?'':'s'}</small></button>`;
        }).join('');
        files.querySelectorAll('[data-brief-chunk]').forEach(b=>b.onclick=()=>handlers.onChunk?.(b.dataset.briefChunk));
      } else if(files){
        files.innerHTML='';
      }
    }
  }
  if(addButton && adder){
    const resetChunkEditor=()=>{ adder.classList.add('hidden'); addButton.classList.remove('hidden'); editButton?.classList.remove('hidden'); adder.dataset.mode=''; adder.dataset.chunkId=''; if(titleInput)titleInput.value=''; if(textInput)textInput.value=''; if(saveChunk)saveChunk.textContent='Add chunk'; };
    addButton.onclick=()=>{ adder.dataset.mode='add'; adder.dataset.chunkId=''; adder.classList.remove('hidden'); addButton.classList.add('hidden'); editButton?.classList.add('hidden'); if(saveChunk)saveChunk.textContent='Add chunk'; if(titleInput)titleInput.value=''; if(textInput)textInput.value=''; titleInput?.focus(); };
    if(editButton){
      editButton.disabled=!chunk;
      editButton.onclick=()=>{ if(!chunk)return; adder.dataset.mode='edit'; adder.dataset.chunkId=chunk.id; adder.classList.remove('hidden'); addButton.classList.add('hidden'); editButton.classList.add('hidden'); if(titleInput)titleInput.value=chunk.title||''; if(textInput)textInput.value=chunk.text||''; if(saveChunk)saveChunk.textContent='Save chunk'; titleInput?.focus(); };
    }
    cancelChunk.onclick=resetChunkEditor;
    saveChunk.onclick=()=>{
      const editing=adder.dataset.mode==='edit';
      const title=titleInput?.value.trim()||(editing?chunk?.title:`Chunk ${chunkCount+1}`);
      const text=textInput?.value.trim()||'';
      if(!text){ textInput?.focus(); return; }
      if(editing) handlers.onEditChunk?.({id:adder.dataset.chunkId,title,text});
      else handlers.onAddChunk?.({title,text});
      resetChunkEditor();
    };
  }

  // B1.7: keep ONE plain text node for the entire brief. Native CSS Highlights
  // paint each full, possibly wrapped phrase without fragmenting text or shifting it.
  paintBriefHighlights(doc,displayedText,relative,selectedId,handlers);
  if(visible.length){
    list.innerHTML=visible.map(h=>`<span class="hotspot-list-entry"><button type="button" class="hotspot-chip ${h.id===selectedId?'active':''}" data-hotspot="${escapeHtml(h.id)}">${escapeHtml(h.text)}<span class="hotspot-kind">${isDesignerSelected(h)?'selected':escapeHtml(h.kind||(/\s/.test(h.text)?'phrase':'word'))}</span></button><button type="button" class="hotspot-edit" data-edit-hotspot="${escapeHtml(h.id)}" title="Edit selected words" aria-label="Edit hotspot ${escapeHtml(h.text)}">✎</button><button type="button" class="hotspot-remove" data-delete-hotspot="${escapeHtml(h.id)}" title="Delete hotspot" aria-label="Delete hotspot ${escapeHtml(h.text)}">×</button></span>`).join('');
    list.querySelectorAll('[data-hotspot]').forEach(el=>el.onclick=()=>handlers.onHotspot(el.dataset.hotspot));
    list.querySelectorAll('[data-edit-hotspot]').forEach(el=>el.onclick=()=>handlers.onEditHotspot?.(el.dataset.editHotspot));
    list.querySelectorAll('[data-delete-hotspot]').forEach(el=>el.onclick=()=>handlers.onDeleteHotspot?.(el.dataset.deleteHotspot));
  }else{
    const message=!showSuggestions && hotspotFilter!=='selected'
      ? 'Automatic suggestions are hidden. Switch to Selected by me or select text manually.'
      : hotspotFilter==='selected'
        ? 'No designer-selected hotspots in this section yet. Select text manually to add one.'
        : 'No hotspots in this view. Select text manually or switch the hotspot filter.';
    list.innerHTML=`<span style="font-size:12px;color:var(--muted)">${message}</span>`;
  }
  if(count) count.textContent=chunk?`${visible.length}/${scoped.length}`:`${visible.length}/${state.hotspots.length}`;
}

// Keep the original words in a single text node. An overlapping selection never
// splits or competes with a larger phrase. The browser handles wrapping itself.
// B1.8: one text node, one set of native browser ranges. No DOM splitting.
// Selecting a shorter hotspot activates the WHOLE containing phrase, preventing
// the previous apparent break in a highlight after changing selections.
export function paintBriefHighlights(doc,text,hotspots,selectedId,handlers={}){
  const source=String(text||'');
  const resolved=(hotspots||[])
    .map(h=>resolveHotspotForText(source,h,Number(h.start)||0))
    .filter(h=>h && h.end>h.start);
  // Bold the UNION of hotspot text, not the individual overlapping ranges.
  // This prevents adjacent/overlapping selections from nesting or breaking words.
  const cuts=new Set([0,source.length]);
  for(const h of resolved){cuts.add(h.start);cuts.add(h.end);}
  const marks=[...cuts].sort((a,b)=>a-b);
  const signature=JSON.stringify([source,marks]);
  if(doc._traceworkSignature!==signature){
    const fragment=document.createDocumentFragment();
    for(let i=0;i<marks.length-1;i++){
      const a=marks[i], b=marks[i+1];
      if(b<=a) continue;
      const content=source.slice(a,b);
      const emphasized=resolved.some(h=>h.start<b && h.end>a);
      if(emphasized){
        const span=document.createElement('strong');
        span.className='brief-emphasis';
        span.textContent=content;
        fragment.appendChild(span);
      }else fragment.appendChild(document.createTextNode(content));
    }
    if(!source)fragment.appendChild(document.createTextNode(''));
    doc.replaceChildren(fragment);
    doc._traceworkSignature=signature;
  }
  const nodes=[];
  const walker=document.createTreeWalker(doc,NodeFilter.SHOW_TEXT);
  let cursor=0,node;
  while((node=walker.nextNode())){
    nodes.push({node,start:cursor,end:cursor+node.textContent.length});
    cursor+=node.textContent.length;
  }
  const at=pos=>{
    const p=Math.max(0,Math.min(pos,source.length));
    const found=nodes.find(n=>p>=n.start && p<n.end) || nodes[nodes.length-1];
    return found?[found.node,Math.max(0,Math.min(p-found.start,found.node.length))]:null;
  };
  const registry=globalThis.CSS?.highlights;
  if(registry){
    registry.delete('tracework-brief-suggested');
    registry.delete('tracework-brief-active');
  }
  const rangeFor=(start,end)=>{
    const first=at(start),last=at(end);
    if(!first||!last)return null;
    const range=document.createRange();
    range.setStart(...first);range.setEnd(...last);
    return range;
  };
  if(registry && typeof Highlight==='function'){
    const all=resolved.map(h=>rangeFor(h.start,h.end)).filter(Boolean);
    if(all.length)registry.set('tracework-brief-suggested',new Highlight(...all));
    const selected=resolved.find(h=>h.id===selectedId);
    if(selected){
      let left=selected.start,right=selected.end,expanded=true;
      while(expanded){
        expanded=false;
        for(const h of resolved){
          if(h.start<right && h.end>left && (h.start<left || h.end>right)){
            left=Math.min(left,h.start);right=Math.max(right,h.end);expanded=true;
          }
        }
      }
      const active=rangeFor(left,right);
      if(active)registry.set('tracework-brief-active',new Highlight(active));
    }
  }
  // Native text selection is preserved for manual phrase extraction.
  doc.onclick=e=>{
    if(!resolved.length || !handlers.onHotspot || !window.getSelection()?.isCollapsed)return;
    const caret=document.caretPositionFromPoint?.(e.clientX,e.clientY);
    const fallback=!caret?document.caretRangeFromPoint?.(e.clientX,e.clientY):null;
    const target=caret?.offsetNode||fallback?.startContainer;
    const local=caret?.offset??fallback?.startOffset;
    const segment=nodes.find(n=>n.node===target);
    if(!segment || !Number.isInteger(local))return;
    const offset=segment.start+local;
    const covering=resolved.filter(h=>offset>=h.start && offset<h.end)
      .sort((a,b)=>(b.end-b.start)-(a.end-a.start));
    if(covering.length)handlers.onHotspot(covering[0].id);
  };
  // Use a pointer when the cursor is over a clickable highlighted phrase,
  // and a text cursor everywhere else. Preserve native drag-to-select behaviour.
  doc.onmousemove=e=>{
    if(!resolved.length){doc.style.cursor='text';return;}
    // Hit-test the exact browser Range rectangles, which remain accurate for
    // bold inline pieces and multiline phrases (caret offsets can snap to an
    // adjacent character and incorrectly report 'text').
    const overHotspot=resolved.some(h=>{
      const r=rangeFor(h.start,h.end);
      return r&&[...r.getClientRects()].some(box=>e.clientX>=box.left-1&&e.clientX<=box.right+1&&e.clientY>=box.top&&e.clientY<=box.bottom);
    });
    doc.style.cursor=overHotspot?'pointer':'text';
  };
  doc.onmouseleave=()=>{doc.style.cursor='text';};
  doc.style.cursor='text';
}

// Kept for any legacy callers/tests; production uses paintBriefHighlights.
export function highlightBrief(text){return escapeHtml(text||'');}
export function renderLegend(ontology){
  document.getElementById('ontologyLegend').innerHTML=ontology.map(o=>`<span class="legend-item has-help" style="--legend-color:${o.color}" data-help="${escapeHtml(o.description||'Framework role')}"><i></i>${escapeHtml(o.label||o.id)}</span>`).join('');
}
export function toggleBriefEditor(open,state){
  document.getElementById('briefEditorWrap').classList.toggle('hidden',!open);
  document.getElementById('briefDocument').classList.toggle('hidden',open);
  document.getElementById('briefChunkNav')?.classList.toggle('hidden',open || !(state.briefChunks?.length>1));
  document.getElementById('briefChunkFiles')?.classList.toggle('hidden',open || state.briefMode!=='document' || !(state.briefChunks?.length>0));
  document.getElementById('briefChunkTools')?.classList.toggle('hidden',open || state.briefMode!=='document');
  if(open)document.getElementById('briefEditor').value=state.brief;
}
