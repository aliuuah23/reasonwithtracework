import { interpretationPrompt, groundingPrompt, consequencePrompt, evaluationPrompt, goalPrompt } from '../input/prompt-engine.js';
import { typeLabels } from '../core/ontology.js';
import { findRelatedPathways } from '../evidence/pathway-bank.js';
import { findCaseStudies } from '../evidence/case-studies.js';

const colors={input:'var(--input)',interpretation:'var(--interpretation)',grounding:'var(--grounding)',consequence:'var(--consequence)',evaluation:'var(--evaluation)',goal:'var(--goal)',note:'var(--note)'};

export function renderEmptyInspector(){
  document.getElementById('inspectorContent').innerHTML=`<div class="inspector-empty"><div class="mini-trace"></div><h3>Inspect the reasoning.</h3><p>Select a hotspot or a node. TRACEWORK reveals the next useful question without deciding the answer for you.</p></div>`;
}

export async function renderHotspotInspector(hotspot,handlers){
  const p=await interpretationPrompt(hotspot);
  const [related,cases]=await Promise.all([findRelatedPathways(hotspot.text),findCaseStudies({text:`${hotspot.text} ${hotspot.concept||''}`,type:'input'})]);
  const root=document.getElementById('inspectorContent');
  root.innerHTML=`
    <div class="inspector-head" style="--node-color:${colors.input}"><span class="inspector-type"><i></i>Selected language · ${esc(hotspot.kind||(/\s/.test(hotspot.text)?'phrase':'word'))}</span><h3>${esc(hotspot.text)}</h3><p>${esc(hotspot.reason)}</p><div class="stage-progress"><span class="done"></span><span></span><span></span><span></span><span></span></div></div>
    <div class="inspector-section"><span class="guided-next-label">Next node · Interpretation</span><div class="prompt-question">${esc(p.question)}</div><div class="choice-list">${p.choices.map(c=>`<button class="choice-chip guided-direct-choice" data-interpretation="${attr(c)}">${esc(c)}</button>`).join('')}</div>
    <div class="guided-help-note">Choose a cue if useful. It will move into the same writing field so it can be extended, qualified or rewritten before it becomes a node.</div>
    <label class="field-label">Write / extend the interpretation</label><div class="custom-answer guided-answer-stack"><textarea class="field-textarea" id="customInterpretation" rows="3" placeholder="Describe what this wording means in this project…"></textarea><button class="primary-button compact" id="addCustomInterpretation">Add interpretation →</button></div><div class="guided-validation" id="interpretationValidation"></div></div>
    <div class="inspector-section"><h4>Useful context to make explicit</h4><div class="node-meta-list"><div class="node-meta"><span>Who?</span><span>${esc(p.who.slice(0,2).join(' · '))}</span></div><div class="node-meta"><span>When?</span><span>${esc(p.when.slice(0,2).join(' · '))}</span></div></div></div>
    ${caseStudyMarkup(cases)}
    ${related.length?`<div class="inspector-section"><h4>Related pathways</h4>${related.map(r=>`<button class="choice-chip" data-related-path="${r.id}">${esc(r.concept)} · ${esc(r.steps[0].text)}</button>`).join('')}</div>`:''}`;
  const input=root.querySelector('#customInterpretation');
  root.querySelectorAll('[data-interpretation]').forEach(b=>b.onclick=()=>{
    root.querySelectorAll('[data-interpretation]').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected');
    const value=(b.dataset.interpretation||'').trim();
    if(value){
      const current=input.value.trim();
      if(!current) input.value=`${value} — `;
      else if(!current.toLowerCase().includes(value.toLowerCase())) input.value=`${value} — ${current}`;
      input.focus();
      input.setSelectionRange?.(input.value.length,input.value.length);
    }
  });
  root.querySelector('#addCustomInterpretation').onclick=()=>{
    const val=input.value.trim();
    const validation=root.querySelector('#interpretationValidation');
    if(!val){ if(validation)validation.textContent='Choose a cue or write the interpretation you want to trace.'; input.focus(); return; }
    if(validation)validation.textContent='';
    handlers.onInterpretation(val,p);
  };
  root.querySelectorAll('[data-related-path]').forEach(b=>b.onclick=()=>handlers.onRelatedPath?.(b.dataset.relatedPath));
  root.querySelectorAll('[data-case-study]').forEach(b=>b.onclick=()=>handlers.onCaseStudy?.(b.dataset.caseStudy));
}

export async function renderNodeInspector(node,state,handlers){
  const root=document.getElementById('inspectorContent');
  if(node.type==='note'){
    const suggestion=node.meta?.suggestedType||'interpretation';
    const cases=await findCaseStudies({text:node.label,type:suggestion});
    root.innerHTML=`
      <div class="inspector-head" style="--node-color:${colors.note}"><span class="inspector-type"><i></i>Loose note</span><h3>${esc(node.label)}</h3><p>Unclassified on purpose. Keep it loose, or convert it when its role becomes clearer.</p></div>
      <div class="inspector-section"><h4>TRACEWORK suggestion</h4><span class="classification-chip" style="--node-color:${colors[suggestion]||colors.note}"><i></i>${esc(typeLabels[suggestion]||suggestion)}</span><p style="color:var(--muted);font-size:11px;line-height:1.5;margin:9px 0 0">${esc(node.meta?.classificationReason||'The wording resembles this reasoning role.')}</p><div class="inspector-actions"><button class="primary-button compact" id="convertNote">Convert to ${esc(typeLabels[suggestion]||suggestion)}</button></div></div>
      ${caseStudyMarkup(cases)}
      <div class="inspector-section"><h4>Note actions</h4><div class="inspector-actions"><button class="secondary-button" id="editNode">Edit</button></div></div>`;
    root.querySelector('#convertNote')?.addEventListener('click',()=>handlers.onConvertNote?.(node,suggestion));
    root.querySelector('#editNode')?.addEventListener('click',()=>handlers.onEdit(node));
    root.querySelectorAll('[data-case-study]').forEach(b=>b.onclick=()=>handlers.onCaseStudy?.(b.dataset.caseStudy));
    return;
  }

  const inputHotspot=node.type==='input'
    ? (state.hotspots?.find(h=>h.id===node.meta?.hotspotId) || {text:node.label,kind:/\s/.test(node.label)?'phrase':'word',reason:'Selected source language'})
    : null;
  const inputPrompt=inputHotspot?await interpretationPrompt(inputHotspot):null;
  const next=nextForm(node,state,inputPrompt);
  const cases=await findCaseStudies({text:`${node.label} ${(node.meta?.tags||[]).join(' ')}`,type:node.type});
  root.innerHTML=`
    <div class="inspector-head" style="--node-color:${colors[node.type]}"><span class="inspector-type"><i></i>${typeLabels[node.type]||node.type}</span><h3>${esc(node.label)}</h3><p>${statusText(node)}</p><div class="stage-progress">${['input','interpretation','grounding','consequence','evaluation','goal'].map(t=>`<span class="${stageDone(t,node.type)?'done':''}"></span>`).join('')}</div></div>
    ${metaMarkup(node)}
    ${next}
    ${caseStudyMarkup(cases)}
    <div class="inspector-section"><h4>Path actions</h4><div class="inspector-actions">${node.type==='interpretation'?'<button class="secondary-button action-help" id="branchFromNode" data-help="Alternative reading = create another interpretation of the same source language. Use this when the wording itself could plausibly mean something else.">Alternative reading</button>':''}${node.type!=='goal'?'<button class="secondary-button action-help" id="forkFromNode" data-help="Fork next step = keep this node, but create another possible downstream move from it. The current reading stays the same; what happens next changes.">Fork next step</button>':''}<button class="secondary-button action-help" id="editNode" data-help="Edit the wording or reasoning role of this node. You can also double-click the node on the canvas.">Edit</button>${node.type!=='input'?(node.status==='rejected'?'<button class="secondary-button action-help" id="restoreBranch" data-help="Bring this retained reasoning route back into active consideration.">Restore path</button>':'<button class="secondary-button action-help" id="rejectBranch" data-help="Keep this route visible as reasoning history, but stop treating it as part of the active design direction.">Reject path</button>'):''}</div></div>`;
  bindNext(root,node,handlers);
  root.querySelector('#branchFromNode')?.addEventListener('click',()=>handlers.onBranch(node.id));
  root.querySelector('#forkFromNode')?.addEventListener('click',()=>handlers.onFork(node.id));
  root.querySelector('#editNode')?.addEventListener('click',()=>handlers.onEdit(node));
  root.querySelector('#rejectBranch')?.addEventListener('click',()=>handlers.onReject(node.branchId,node));
  root.querySelector('#restoreBranch')?.addEventListener('click',()=>handlers.onRestore(node.branchId,node));
  root.querySelectorAll('[data-case-study]').forEach(b=>b.onclick=()=>handlers.onCaseStudy?.(b.dataset.caseStudy));
}

function caseStudyMarkup(items){
  if(!items?.length)return '';
  return `<div class="inspector-section"><h4>Related case studies</h4><p style="color:var(--muted);font-size:10px;line-height:1.5;margin:-3px 0 9px">Specific spatial features to compare — useful when the next reasoning step feels unclear, never prescribed answers.</p><div class="case-study-list">${items.map(c=>`<div class="case-study-entry"><button class="case-study-button" data-case-study="${attr(c.id)}"><span>${esc(c.feature||'Spatial feature')} · ${esc(c.designer)} · ${esc(String(c.year))}</span><strong>${esc(c.name)}</strong><small>${esc(c.prompt)}</small></button>${c.sourceUrl?`<a class="case-study-source" href="${attr(c.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(c.sourceLabel||'Project source')} ↗</a>`:''}</div>`).join('')}</div></div>`;
}

function nextForm(node,state,inputPrompt=null){
  if(node.status==='rejected')return `<div class="inspector-section"><p style="color:var(--muted);font-size:13px;line-height:1.6">This path is retained as part of the reasoning history. Restore it to continue working from it, or branch from an earlier active node.</p></div>`;
  if(node.type==='input'){
    const p=inputPrompt||{question:'What does this language mean for the design?',choices:[]};
    return `<div class="inspector-section"><span class="guided-next-label">Next node · Interpretation</span><div class="prompt-question">${esc(p.question)}</div><div class="choice-list">${(p.choices||[]).map(c=>`<button class="choice-chip guided-direct-choice" data-direct-interpretation="${attr(c)}">${esc(c)}</button>`).join('')}</div><div class="guided-help-note">This guided route creates an Interpretation next. Choose a cue, then extend or rewrite it in the same field before adding the node. Node type can still be changed later with Edit.</div><label class="field-label">Write / extend the interpretation</label><textarea class="field-textarea" id="nextText" placeholder="Describe what this wording means in this project…"></textarea><div class="guided-validation" id="nextValidation"></div><button class="primary-button compact" id="addNext">Add interpretation →</button></div>`;
  }
  if(node.type==='interpretation'){
    const p=groundingPrompt(); return `<div class="inspector-section"><div class="prompt-question">${p.question}</div><div class="choice-list">${p.sources.map(x=>`<button class="choice-chip selectable" data-ground-source="${attr(x)}">${esc(x)}</button>`).join('')}</div><div class="guided-help-note">Choose a cue if useful, then write the reasoning in your own words. The cue guides the question; it does not become the node.</div><label class="field-label">Why does this reading matter here?</label><textarea class="field-textarea" id="nextText" placeholder="Explain the basis for this interpretation…"></textarea><div class="guided-validation" id="nextValidation"></div><button class="primary-button compact" id="addNext">Add grounding →</button></div>`;
  }
  if(node.type==='grounding'){
    const p=consequencePrompt(); return `<div class="inspector-section"><div class="prompt-question">${p.question}</div><div class="hotspot-list">${p.hints.map(x=>`<button class="hotspot-chip selectable" data-tag="${attr(x)}">${esc(x)}</button>`).join('')}</div><div class="guided-help-note">Select any useful cues, then describe the spatial move. TRACEWORK will create a linked node from your written answer.</div><textarea class="field-textarea" id="nextText" placeholder="Describe the spatial consequence…"></textarea><div class="guided-validation" id="nextValidation"></div><button class="primary-button compact" id="addNext">Add consequence →</button></div>`;
  }
  if(node.type==='consequence'){
    const p=evaluationPrompt(); return `<div class="inspector-section"><div class="prompt-question">${p.question}</div><div class="hotspot-list">${p.hints.map(x=>`<button class="hotspot-chip selectable" data-tag="${attr(x)}">${esc(x)}</button>`).join('')}</div><div class="guided-help-note">Use the cues only if they help. The node comes from the judgement you write below.</div><textarea class="field-textarea" id="nextText" placeholder="State the trade-off or priority…"></textarea><div class="guided-validation" id="nextValidation"></div><button class="primary-button compact" id="addNext">Add evaluation →</button></div>`;
  }
  if(node.type==='evaluation'){
    const p=goalPrompt(); return `<div class="inspector-section"><div class="prompt-question">${p.question}</div><div class="guided-help-note">Write the aim in your own words. TRACEWORK will link it to this evaluation.</div><textarea class="field-textarea" id="nextText" placeholder="State the design aim…"></textarea><div class="guided-validation" id="nextValidation"></div><button class="primary-button compact" id="addNext">Complete pathway →</button></div>`;
  }
  return `<div class="inspector-section"><span class="status-chip active">Pathway complete</span><p style="color:var(--muted);font-size:13px;line-height:1.6;margin-bottom:0">This route is complete. You can return to any earlier node and fork another consequence, trade-off or goal.</p></div>`;
}
function bindNext(root,node,handlers){
  let sourceKind=''; const tags=[];
  root.querySelectorAll('.selectable').forEach(b=>b.onclick=()=>{ b.classList.toggle('selected'); if(b.dataset.groundSource)sourceKind=b.dataset.groundSource; if(b.dataset.tag){ const i=tags.indexOf(b.dataset.tag); i>-1?tags.splice(i,1):tags.push(b.dataset.tag); } });
  root.querySelectorAll('[data-direct-interpretation]').forEach(b=>b.onclick=()=>{
    root.querySelectorAll('[data-direct-interpretation]').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected');
    const cue=(b.dataset.directInterpretation||'').trim();
    const area=root.querySelector('#nextText');
    if(cue && area){
      const current=area.value.trim();
      if(!current) area.value=`${cue} — `;
      else if(!current.toLowerCase().includes(cue.toLowerCase())) area.value=`${cue} — ${current}`;
      area.focus(); area.setSelectionRange?.(area.value.length,area.value.length);
    }
  });
  root.querySelector('#addNext')?.addEventListener('click',()=>{ const area=root.querySelector('#nextText'); const text=area?.value.trim(); const validation=root.querySelector('#nextValidation'); if(!text){ if(validation)validation.textContent='Write the reasoning you want to turn into a node.'; area?.focus(); return; } if(validation)validation.textContent=''; handlers.onNext(node,text,{sourceKind,tags}); });
}
function metaMarkup(node){
  const rows=[];
  if(node.meta?.sourceKind)rows.push(['Grounded in',node.meta.sourceKind]);
  if(node.meta?.sourceLabel)rows.push(['Pathway source',node.meta.sourceLabel]);
  if(node.meta?.tags?.length)rows.push(['Tags',node.meta.tags.join(' · ')]);
  if(node.meta?.who)rows.push(['Who',node.meta.who]);
  if(node.meta?.when)rows.push(['When',node.meta.when]);
  if(node.meta?.freeform)rows.push(['Added by','Free reasoning input']);
  if(!rows.length)return '';
  return `<div class="inspector-section"><h4>Trace context</h4><div class="node-meta-list">${rows.map(([a,b])=>`<div class="node-meta"><span>${esc(a)}</span><span>${esc(b)}</span></div>`).join('')}</div></div>`;
}
function statusText(node){ if(node.status==='rejected')return 'This reasoning remains visible but is no longer active.'; if(node.meta?.provisional)return 'A provisional alternative. Develop it before deciding whether to keep it.'; return 'Part of the active reasoning trace.'; }
function stageDone(t,current){ const order=['input','interpretation','grounding','consequence','evaluation','goal']; return order.indexOf(t)<=order.indexOf(current); }
function esc(t=''){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function attr(t=''){return esc(t).replace(/`/g,'');}
