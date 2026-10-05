import { interpretationPrompt, groundingPrompt, consequencePrompt, evaluationPrompt, goalPrompt } from '../input/prompt-engine.js';
import { typeLabels } from '../core/ontology.js';
import { nodeGuidance } from '../core/node-guidance.js';
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
    ${nodeUseMarkup('input')}
    <div class="inspector-section"><div class="prompt-question">${esc(p.question)}</div><div class="choice-list">${p.choices.map(c=>`<button class="choice-chip" data-interpretation="${attr(c)}">${esc(c)}</button>`).join('')}</div>
    <label class="field-label">Or write your own interpretation</label><div class="custom-answer"><input id="customInterpretation" placeholder="Describe the condition you mean"><button class="primary-button compact" id="addCustomInterpretation">Add</button></div></div>
    <div class="inspector-section"><h4>Useful context to make explicit</h4><div class="node-meta-list"><div class="node-meta"><span>Who?</span><span>${esc(p.who.slice(0,2).join(' · '))}</span></div><div class="node-meta"><span>When?</span><span>${esc(p.when.slice(0,2).join(' · '))}</span></div></div></div>
    ${caseStudyMarkup(cases)}
    ${related.length?`<div class="inspector-section"><h4>Related pathways</h4>${related.map(r=>`<button class="choice-chip" data-related-path="${r.id}">${esc(r.concept)} · ${esc(r.steps[0].text)}</button>`).join('')}</div>`:''}`;
  root.querySelectorAll('[data-interpretation]').forEach(b=>b.onclick=()=>handlers.onInterpretation(b.dataset.interpretation,p));
  root.querySelector('#addCustomInterpretation').onclick=()=>{ const val=root.querySelector('#customInterpretation').value.trim(); if(val)handlers.onInterpretation(val,p); };
  root.querySelectorAll('[data-related-path]').forEach(b=>b.onclick=()=>handlers.onRelatedPath?.(b.dataset.relatedPath));
  root.querySelectorAll('[data-case-study]').forEach(b=>b.onclick=()=>handlers.onCaseStudy?.(b.dataset.caseStudy));
}

export async function renderNodeInspector(node,state,handlers){
  const root=document.getElementById('inspectorContent');
  if(node.type==='note'){
    const suggestion=node.meta?.suggestedType||'interpretation';
    const g=nodeGuidance.note;
    const cases=await findCaseStudies({text:node.label,type:suggestion});
    root.innerHTML=`
      <div class="inspector-head" style="--node-color:${colors.note}"><span class="inspector-type"><i></i>Loose note</span><h3>${esc(node.label)}</h3><p>Unclassified on purpose. Keep it loose, or convert it when its role becomes clearer.</p></div>
      <div class="inspector-section"><h4>What this object does</h4><div class="node-use-card"><strong>${esc(g.title)}</strong><p>${esc(g.use)}</p><p>${esc(g.when)}</p></div></div>
      <div class="inspector-section"><h4>TRACEWORK suggestion</h4><span class="classification-chip" style="--node-color:${colors[suggestion]||colors.note}"><i></i>${esc(typeLabels[suggestion]||suggestion)}</span><p style="color:var(--muted);font-size:11px;line-height:1.5;margin:9px 0 0">${esc(node.meta?.classificationReason||'The wording resembles this reasoning role.')}</p><div class="inspector-actions"><button class="primary-button compact" id="convertNote">Convert to ${esc(typeLabels[suggestion]||suggestion)}</button></div></div>
      ${caseStudyMarkup(cases)}
      <div class="inspector-section"><h4>Note actions</h4><div class="inspector-actions"><button class="secondary-button" id="editNode">Edit</button></div></div>`;
    root.querySelector('#convertNote')?.addEventListener('click',()=>handlers.onConvertNote?.(node,suggestion));
    root.querySelector('#editNode')?.addEventListener('click',()=>handlers.onEdit(node));
    root.querySelectorAll('[data-case-study]').forEach(b=>b.onclick=()=>handlers.onCaseStudy?.(b.dataset.caseStudy));
    return;
  }

  const next=nextForm(node,state);
  const cases=await findCaseStudies({text:`${node.label} ${(node.meta?.tags||[]).join(' ')}`,type:node.type});
  root.innerHTML=`
    <div class="inspector-head" style="--node-color:${colors[node.type]}"><span class="inspector-type"><i></i>${typeLabels[node.type]||node.type}</span><h3>${esc(node.label)}</h3><p>${statusText(node)}</p><div class="stage-progress">${['input','interpretation','grounding','consequence','evaluation','goal'].map(t=>`<span class="${stageDone(t,node.type)?'done':''}"></span>`).join('')}</div></div>
    ${nodeUseMarkup(node.type)}
    ${metaMarkup(node)}
    ${next}
    ${caseStudyMarkup(cases)}
    <div class="inspector-section"><h4>Path actions</h4><div class="inspector-actions">${node.type==='interpretation'?'<button class="secondary-button" id="branchFromNode">Alternative reading</button>':''}${node.type!=='goal'?'<button class="secondary-button" id="forkFromNode">Fork next step</button>':''}<button class="secondary-button" id="editNode">Edit</button>${node.type!=='input'?(node.status==='rejected'?'<button class="secondary-button" id="restoreBranch">Restore path</button>':'<button class="secondary-button" id="rejectBranch">Reject path</button>'):''}</div></div>`;
  bindNext(root,node,handlers);
  root.querySelector('#branchFromNode')?.addEventListener('click',()=>handlers.onBranch(node.id));
  root.querySelector('#forkFromNode')?.addEventListener('click',()=>handlers.onFork(node.id));
  root.querySelector('#editNode')?.addEventListener('click',()=>handlers.onEdit(node));
  root.querySelector('#rejectBranch')?.addEventListener('click',()=>handlers.onReject(node.branchId,node));
  root.querySelector('#restoreBranch')?.addEventListener('click',()=>handlers.onRestore(node.branchId,node));
  root.querySelectorAll('[data-case-study]').forEach(b=>b.onclick=()=>handlers.onCaseStudy?.(b.dataset.caseStudy));
}

function nodeUseMarkup(type){
  const g=nodeGuidance[type]; if(!g)return '';
  return `<div class="inspector-section"><h4>What this node does</h4><div class="node-use-card"><strong>${esc(g.title)}</strong><p>${esc(g.use)}</p><p>${esc(g.when)}</p></div></div>`;
}

function caseStudyMarkup(items){
  if(!items?.length)return '';
  return `<div class="inspector-section"><h4>Related case studies</h4><p style="color:var(--muted);font-size:10px;line-height:1.5;margin:-3px 0 9px">For comparison, not prescription.</p><div class="case-study-list">${items.map(c=>`<button class="case-study-button" data-case-study="${attr(c.id)}"><span>${esc(c.designer)} · ${esc(String(c.year))}</span><strong>${esc(c.name)}</strong><small>${esc(c.prompt)}</small></button>`).join('')}</div></div>`;
}

function nextForm(node,state){
  if(node.status==='rejected')return `<div class="inspector-section"><p style="color:var(--muted);font-size:13px;line-height:1.6">This path is retained as part of the reasoning history. Restore it to continue working from it, or branch from an earlier active node.</p></div>`;
  if(node.type==='input') return '';
  if(node.type==='interpretation'){
    const p=groundingPrompt(); return `<div class="inspector-section"><div class="prompt-question">${p.question}</div><div class="choice-list">${p.sources.map(x=>`<button class="choice-chip selectable" data-ground-source="${attr(x)}">${esc(x)}</button>`).join('')}</div><label class="field-label">Why does this reading matter here?</label><textarea class="field-textarea" id="nextText" placeholder="Explain the basis for this interpretation…"></textarea><button class="primary-button compact" id="addNext">Add grounding →</button></div>`;
  }
  if(node.type==='grounding'){
    const p=consequencePrompt(); return `<div class="inspector-section"><div class="prompt-question">${p.question}</div><div class="hotspot-list">${p.hints.map(x=>`<button class="hotspot-chip selectable" data-tag="${attr(x)}">${esc(x)}</button>`).join('')}</div><textarea class="field-textarea" id="nextText" placeholder="Describe the spatial consequence…"></textarea><button class="primary-button compact" id="addNext">Add consequence →</button></div>`;
  }
  if(node.type==='consequence'){
    const p=evaluationPrompt(); return `<div class="inspector-section"><div class="prompt-question">${p.question}</div><div class="hotspot-list">${p.hints.map(x=>`<button class="hotspot-chip selectable" data-tag="${attr(x)}">${esc(x)}</button>`).join('')}</div><textarea class="field-textarea" id="nextText" placeholder="State the trade-off or priority…"></textarea><button class="primary-button compact" id="addNext">Add evaluation →</button></div>`;
  }
  if(node.type==='evaluation'){
    const p=goalPrompt(); return `<div class="inspector-section"><div class="prompt-question">${p.question}</div><textarea class="field-textarea" id="nextText" placeholder="State the design aim…"></textarea><button class="primary-button compact" id="addNext">Complete pathway →</button></div>`;
  }
  return `<div class="inspector-section"><span class="status-chip active">Pathway complete</span><p style="color:var(--muted);font-size:13px;line-height:1.6;margin-bottom:0">This route is complete. You can return to any earlier node and fork another consequence, trade-off or goal.</p></div>`;
}
function bindNext(root,node,handlers){
  let sourceKind=''; const tags=[];
  root.querySelectorAll('.selectable').forEach(b=>b.onclick=()=>{ b.classList.toggle('selected'); if(b.dataset.groundSource)sourceKind=b.dataset.groundSource; if(b.dataset.tag){ const i=tags.indexOf(b.dataset.tag); i>-1?tags.splice(i,1):tags.push(b.dataset.tag); } });
  root.querySelector('#addNext')?.addEventListener('click',()=>{ const text=root.querySelector('#nextText')?.value.trim(); if(!text)return; handlers.onNext(node,text,{sourceKind,tags}); });
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
