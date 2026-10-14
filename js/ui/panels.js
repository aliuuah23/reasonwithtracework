import { interpretationPrompt, groundingPrompt, consequencePrompt, evaluationPrompt, goalPrompt } from '../input/prompt-engine.js';
import { typeLabels } from '../core/ontology.js';
import { findRelatedPathways } from '../evidence/pathway-bank.js';
import { findCaseStudies } from '../evidence/case-studies.js?v=c1.3';
import { operationalSuggestions } from '../reasoning/operational-design.js';
import { spatialMiniMarkup } from '../reasoning/spatial-literacy.js?v=c2.3-recovery';
import { researchMarkup } from '../reasoning/reading-suggestions.js?v=c2.0';
import { provenanceLabel, inferLegacyProvenance, getFramework, frameworkRoleForNode, frameworkCategories, frameworkGuidance, categoryColor } from '../core/frameworks.js';
import { nodeGuidance } from '../core/node-guidance.js';
import { roleClarifications, evidenceLabel, inferredEvidenceKind } from '../core/reasoning-transparency.js';

const colors={input:'var(--input)',interpretation:'var(--interpretation)',grounding:'var(--grounding)',consequence:'var(--consequence)',evaluation:'var(--evaluation)',goal:'var(--goal)',note:'var(--note)'};

let inspectorRequest=0;
const inspectorDrafts=new Map();
function saveInspectorDraft(root){
  const key=root?.dataset?.inspectorDraftKey||root?.dataset?.inspectorKey;
  if(!key)return;
  const values={};
  root.querySelectorAll('textarea').forEach(el=>{if(el.id)values[el.id]=el.value;});
  if(Object.keys(values).length)inspectorDrafts.set(key,values);
}
function shouldRenderInspector(root,key,request,draftKey=key){
  if(request!==inspectorRequest)return false; // stale async case/precedent response
  if(root.dataset.inspectorKey===key)return false; // keep typed text, caret and focus
  saveInspectorDraft(root);
  root.dataset.inspectorKey=key;
  root.dataset.inspectorDraftKey=draftKey;
  return true;
}
function restoreInspectorDraft(root,key){
  const values=inspectorDrafts.get(root.dataset.inspectorDraftKey||key);
  if(!values)return;
  root.querySelectorAll('textarea').forEach(el=>{
    if(!el.id)return;
    if(Object.hasOwn(values,el.id))el.value=values[el.id];
    else if((el.id==='nextText'||el.id==='customInterpretation') && (Object.hasOwn(values,'nextText')||Object.hasOwn(values,'customInterpretation')))
      el.value=values.nextText??values.customInterpretation;
  });
}
export function renderEmptyInspector(){
  inspectorRequest++;
  const root=document.getElementById('inspectorContent');
  if(root.dataset.inspectorKey==='empty')return;
  saveInspectorDraft(root);root.dataset.inspectorKey='empty';root.dataset.inspectorDraftKey='empty';
  root.innerHTML=`<div class="inspector-empty"><div class="mini-trace"></div><h3>Inspect the reasoning.</h3><p>Select a hotspot or a node. TRACEWORK reveals the next useful question without deciding the answer for you.</p></div>`;
}

export async function renderHotspotInspector(hotspot,state,handlers){
  const request=++inspectorRequest;
  const key=`${state?.projectId||'project'}:hotspot:${hotspot.id}:${state?.frameworkId||'tracework'}`;
  const framework=getFramework(state?.frameworkId||'tracework');
  const [related,cases]=await Promise.all([findRelatedPathways(hotspot.text),findCaseStudies({text:`${hotspot.text} ${hotspot.concept||''}`,type:'input'})]);
  const root=document.getElementById('inspectorContent');

  if(framework.id!=='tracework' && framework.id!=='freeform'){
    const pseudo={type:'input',label:hotspot.text,meta:{source:'brief',hotspotId:hotspot.id}};
    const role=frameworkRoleForNode(pseudo,framework.id);
    const guide=frameworkGuidance(framework.id,role?.id,{sourceText:hotspot.text});
    if(!shouldRenderInspector(root,key,request))return;
    root.innerHTML=`
      <div class="inspector-head" style="--node-color:${role?.color||colors.input}"><span class="inspector-type"><i></i>Selected language · ${esc(role?.label||framework.shortLabel)}</span><h3>${esc(hotspot.text)}</h3><p>${esc(hotspot.reason||'Selected source language')}</p><button class="secondary-button compact hotspot-inspector-edit" data-edit-hotspot-selection="${esc(hotspot.id)}">✎ Edit source selection</button></div>
      <div class="framework-lens-note"><strong>${esc(framework.label)}</strong><span>${esc(framework.source||'')}</span><p>${esc(framework.description)}</p></div>
      ${frameworkNextForm({status:'active',label:hotspot.text},framework,role,guide)}
      ${roleExplanationMarkup({type:'input',label:hotspot.text,meta:{provenance:'brief',evidenceKind:'brief'}},framework,role)}
    ${spatialMiniMarkup(hotspot.text,'input')}
      ${operationalMarkup(hotspot.text,'input',framework.label)}
      ${caseStudyMarkup(cases)}
    ${researchMarkup(hotspot.text,{compact:true})}
      ${related.length?`<div class="inspector-section"><h4>Related pathways</h4>${related.map(r=>`<button class="choice-chip" data-related-path="${r.id}">${esc(r.concept)} · ${esc(r.steps[0].text)}</button>`).join('')}</div>`:''}`;
    restoreInspectorDraft(root,key);
    root.querySelectorAll('.spatial-open-modal').forEach(b=>{b.dataset.spatialText=hotspot.text;b.dataset.spatialType='input';});
    bindFrameworkNext(root,pseudo,framework,role,guide,(text,roleId,extra)=>handlers.onFrameworkNext?.(text,roleId,extra));
    root.querySelectorAll('[data-edit-hotspot-selection]').forEach(b=>b.onclick=()=>handlers.onEditHotspot?.(b.dataset.editHotspotSelection));
    root.querySelectorAll('[data-related-path]').forEach(b=>b.onclick=()=>handlers.onRelatedPath?.(b.dataset.relatedPath));
    root.querySelectorAll('[data-case-study]').forEach(b=>b.onclick=()=>handlers.onCaseStudy?.(b.dataset.caseStudy));
    return;
  }

  const p=await interpretationPrompt(hotspot);
  if(!shouldRenderInspector(root,key,request))return;
  root.innerHTML=`
    <div class="inspector-head" style="--node-color:${colors.input}"><span class="inspector-type"><i></i>Selected language · ${esc(hotspot.kind||(/\s/.test(hotspot.text)?'phrase':'word'))}</span><h3>${esc(hotspot.text)}</h3><p>${esc(hotspot.reason)}</p><button class="secondary-button compact hotspot-inspector-edit" data-edit-hotspot-selection="${esc(hotspot.id)}">✎ Edit source selection</button><div class="stage-progress"><span class="done"></span><span></span><span></span><span></span><span></span></div></div>
    <div class="inspector-section"><span class="guided-next-label">Next node · Interpretation</span><div class="prompt-question">${esc(p.question)}</div><div class="choice-list">${p.choices.map(c=>`<button class="choice-chip guided-direct-choice" data-interpretation="${attr(c)}">${esc(c)}</button>`).join('')}</div>
    <div class="guided-help-note">Choose a cue if useful. It will move into the same writing field so it can be extended, qualified or rewritten before it becomes a node.</div>
    <label class="field-label">Write / extend the interpretation</label><div class="custom-answer guided-answer-stack"><textarea class="field-textarea" id="customInterpretation" rows="3" placeholder="Describe what this wording means in this project…"></textarea><button class="primary-button compact" id="addCustomInterpretation">Add interpretation →</button></div><div class="guided-validation" id="interpretationValidation"></div></div>
    <div class="inspector-section"><h4>Useful context to make explicit</h4><div class="node-meta-list"><div class="node-meta"><span>Who?</span><span>${esc(p.who.slice(0,2).join(' · '))}</span></div><div class="node-meta"><span>When?</span><span>${esc(p.when.slice(0,2).join(' · '))}</span></div></div></div>
    ${roleExplanationMarkup({type:'input',label:hotspot.text,meta:{provenance:'brief',evidenceKind:'brief'}},framework,null)}
    ${spatialMiniMarkup(hotspot.text,'input')}
      ${operationalMarkup(hotspot.text,'input',framework.label)}
      ${caseStudyMarkup(cases)}
    ${researchMarkup(hotspot.text,{compact:true})}
    ${related.length?`<div class="inspector-section"><h4>Related pathways</h4>${related.map(r=>`<button class="choice-chip" data-related-path="${r.id}">${esc(r.concept)} · ${esc(r.steps[0].text)}</button>`).join('')}</div>`:''}`;
  restoreInspectorDraft(root,key);
  root.querySelectorAll('.spatial-open-modal').forEach(b=>{b.dataset.spatialText=hotspot.text;b.dataset.spatialType='input';});
  const input=root.querySelector('#customInterpretation');
  root.querySelectorAll('[data-interpretation]').forEach(b=>b.onclick=()=>{
    root.querySelectorAll('[data-interpretation]').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected');
    const value=(b.dataset.interpretation||'').trim();
    if(value){
      // A newly selected cue replaces the prior cue/answer rather than stacking
      // suggestions into an increasingly confusing sentence.
      input.value=`${value} — `;
      input.focus();
      input.setSelectionRange?.(input.value.length,input.value.length);
    }
  });
  root.querySelectorAll('[data-edit-hotspot-selection]').forEach(b=>b.onclick=()=>handlers.onEditHotspot?.(b.dataset.editHotspotSelection));
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
  const request=++inspectorRequest;
  const key=`${state?.projectId||'project'}:node:${node.id}:${state?.frameworkId||'tracework'}:${node.status||'active'}:${node.label}`;
  const root=document.getElementById('inspectorContent');
  const draftKey=node.type==='input'&&node.meta?.hotspotId
    ?`${state?.projectId||'project'}:hotspot:${node.meta.hotspotId}:${state?.frameworkId||'tracework'}`
    :key;
  if(node.type==='note'){
    const suggestion=node.meta?.suggestedType||'interpretation';
    const cases=await findCaseStudies({text:node.label,type:suggestion});
    if(!shouldRenderInspector(root,key,request,draftKey))return;
    root.innerHTML=`
      <div class="inspector-head" style="--node-color:${colors.note}"><span class="inspector-type"><i></i>Loose note</span><h3>${esc(node.label)}</h3><p>Unclassified on purpose. Keep it loose, or convert it when its role becomes clearer.</p></div>
      <div class="inspector-section"><h4>TRACEWORK suggestion</h4><span class="classification-chip" style="--node-color:${colors[suggestion]||colors.note}"><i></i>${esc(typeLabels[suggestion]||suggestion)}</span><p style="color:var(--muted);font-size:11px;line-height:1.5;margin:9px 0 0">${esc(node.meta?.classificationReason||'The wording resembles this reasoning role.')}</p><div class="inspector-actions"><button class="primary-button compact" id="convertNote">Convert to ${esc(typeLabels[suggestion]||suggestion)}</button></div></div>
      ${roleExplanationMarkup(node,null,null)}
      ${spatialMiniMarkup(node.label,'note')}
      ${operationalMarkup(node.label,'note','Freeform')}
      ${caseStudyMarkup(cases)}
    ${researchMarkup(node.label,{compact:true})}
      <div class="inspector-section"><h4>Note actions</h4><div class="inspector-actions"><button class="secondary-button" id="editNode">Edit</button></div></div>`;
    restoreInspectorDraft(root,key);
    root.querySelectorAll('.spatial-open-modal').forEach(b=>{b.dataset.spatialText=node.label;b.dataset.spatialType='note';});
    root.querySelector('#convertNote')?.addEventListener('click',()=>handlers.onConvertNote?.(node,suggestion));
    root.querySelector('#editNode')?.addEventListener('click',()=>handlers.onEdit(node));
    root.querySelectorAll('[data-case-study]').forEach(b=>b.onclick=()=>handlers.onCaseStudy?.(b.dataset.caseStudy));
    return;
  }

  const framework=getFramework(state.frameworkId||'tracework');
  const frameworkRole=frameworkRoleForNode(node,framework.id);
  const roleLabel=framework.id==='freeform'?(typeLabels[node.type]||node.type):(frameworkRole?.label||typeLabels[node.type]||node.type);
  const roleColor=frameworkRole?.color||colors[node.type];
  const progressRoles=framework.id==='freeform'?frameworkCategories('tracework'):frameworkCategories(framework.id);
  const activeRoleId=framework.id==='tracework'?node.type:(frameworkRole?.id||node.type);
  const inputHotspot=node.type==='input'
    ? (state.hotspots?.find(h=>h.id===node.meta?.hotspotId) || {text:node.label,kind:/\s/.test(node.label)?'phrase':'word',reason:'Selected source language'})
    : null;
  const inputPrompt=inputHotspot?await interpretationPrompt(inputHotspot):null;
  const guide=(framework.id!=='tracework'&&framework.id!=='freeform')?frameworkGuidance(framework.id,frameworkRole?.id,{sourceText:node.label}):null;
  const next=(framework.id!=='tracework'&&framework.id!=='freeform')
    ? frameworkNextForm(node,framework,frameworkRole,guide)
    : nextForm(node,state,inputPrompt);
  const cases=await findCaseStudies({text:`${node.label} ${(node.meta?.tags||[]).join(' ')}`,type:node.type});
  const progress=framework.arrangement==='network'
    ? progressRoles.map(r=>`<span class="${r.id===activeRoleId?'done':''}"></span>`).join('')
    : progressRoles.map((r,i)=>`<span class="${frameworkProgressDone(progressRoles,activeRoleId,i)?'done':''}"></span>`).join('');
  if(!shouldRenderInspector(root,key,request,draftKey))return;
  root.innerHTML=`
    <div class="inspector-head" style="--node-color:${roleColor}"><span class="inspector-type"><i></i>${esc(roleLabel)}</span><h3>${esc(node.label)}</h3><p>${statusText(node)}</p><div class="stage-progress">${progress}</div></div>
    ${metaMarkup(node,framework,frameworkRole)}
    ${roleExplanationMarkup(node,framework,frameworkRole)}
    ${next}
    ${spatialMiniMarkup(node.label,node.type)}
    ${operationalMarkup(node.label,node.type,framework.label)}
    ${caseStudyMarkup(cases)}
    ${researchMarkup(node.label,{compact:true})}
    <div class="inspector-section"><h4>Path actions</h4><div class="inspector-actions">${node.type==='interpretation'?'<button class="secondary-button action-help" id="branchFromNode" data-help="Alternative reading = create another interpretation of the same source language. Use this when the wording itself could plausibly mean something else.">Alternative reading</button>':''}${node.type!=='goal'?'<button class="secondary-button action-help" id="forkFromNode" data-help="Fork next step = keep this node, but create another possible downstream move from it. The current reading stays the same; what happens next changes.">Fork next step</button>':''}${node.type==='input' && node.meta?.hotspotId?'<button class="secondary-button action-help" id="editInputHotspot">✎ Edit source selection</button>':''}<button class="secondary-button action-help" id="editNode" data-help="Edit the wording or reasoning role of this node. You can also double-click the node on the canvas.">Edit</button>${node.type!=='input'?(node.status==='rejected'?'<button class="secondary-button action-help" id="restoreBranch" data-help="Bring this retained reasoning route back into active consideration.">Restore path</button>':'<button class="secondary-button action-help" id="rejectBranch" data-help="Keep this route visible as reasoning history, but stop treating it as part of the active design direction.">Reject path</button>'):''}</div></div>`;
  root.querySelectorAll('.spatial-open-modal').forEach(b=>{b.dataset.spatialText=node.label;b.dataset.spatialType=node.type;});
  if(framework.id!=='tracework'&&framework.id!=='freeform') bindFrameworkNext(root,node,framework,frameworkRole,guide,(text,roleId,extra)=>handlers.onFrameworkNext?.(node,text,roleId,extra));
  else bindNext(root,node,handlers);
  root.querySelector('#branchFromNode')?.addEventListener('click',()=>handlers.onBranch(node.id));
  restoreInspectorDraft(root,key);
  root.querySelector('#forkFromNode')?.addEventListener('click',()=>handlers.onFork(node.id));
  root.querySelector('#editInputHotspot')?.addEventListener('click',()=>handlers.onEditHotspot?.(node.meta.hotspotId));
  root.querySelector('#editNode')?.addEventListener('click',()=>handlers.onEdit(node));
  root.querySelector('#rejectBranch')?.addEventListener('click',()=>handlers.onReject(node.branchId,node));
  root.querySelector('#restoreBranch')?.addEventListener('click',()=>handlers.onRestore(node.branchId,node));
  root.querySelectorAll('[data-case-study]').forEach(b=>b.onclick=()=>handlers.onCaseStudy?.(b.dataset.caseStudy));
}

function operationalMarkup(text,type,frameworkLabel){
  const s=operationalSuggestions(text,type,frameworkLabel);
  return `<section class="inspector-section operational-reading" aria-label="Spatial translation suggestions">
    <h4>Operational Design</h4>
    <p class="operational-disclaimer">These are questions for spatialising this wording, not generated design solutions.</p>
    <div class="operation-choice"><strong>Overall suggestion</strong><p>${esc(s.overall)}</p></div>
    <div class="operation-choice"><strong>Detail suggestion</strong><p>${esc(s.detail)}</p></div>
    <div class="operation-next"><strong>Reasoning check</strong> ${esc(s.probe)}</div>
    <p class="operational-framework">Operational Grammar <strong>${esc(s.frame)}</strong></p>
    <p class="operational-disclaimer">Open <strong>Spatial read</strong> on the node for schematic plan / 3D tests; compare a related case below when an architectural term matches.</p>
  </section>`;
}
function caseStudyMarkup(items){
  if(!items?.length)return `<section class="inspector-section case-study-section"><h4>Built-Project Precedents</h4><p class="operational-disclaimer">No sufficiently relevant documented building is available for this wording in the curated library. Explore a specific feature above, or search for documented buildings in the Spatial Reading Studio.</p></section>`;
  return `<div class="inspector-section case-study-section"><h4>Built-Project Precedents</h4><p style="color:var(--muted);font-size:10px;line-height:1.5;margin:-3px 0 9px">Documented buildings using a related feature. Distinct from the Spatial Feature Examples above; compare the operation, not the building form.</p><div class="case-study-list">${items.map(c=>`<div class="case-study-entry"><button class="case-study-button" data-case-study="${attr(c.id)}"><span>${esc(c.feature||'Spatial feature')} · ${esc(c.designer)} · ${esc(String(c.year))}</span><strong>${esc(c.name)}</strong><small>Matched: ${esc((c._matched||[]).slice(0,4).join(' · ')||c.feature)} · ${esc(c.prompt)}</small></button>${c.sourceUrl?`<a class="case-study-source" href="${attr(c.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(c.sourceLabel||'Project source')} ↗</a>`:''}</div>`).join('')}</div></div>`;
}

function frameworkNextForm(node,framework,currentRole,guide){
  if(node.status==='rejected')return `<div class="inspector-section"><p style="color:var(--muted);font-size:13px;line-height:1.6">This path is retained as part of the reasoning history. Restore it to continue working from it, or branch from an earlier active node.</p></div>`;
  const forward=guide?.forward || (guide?.nextRole?{role:guide.nextRole,question:guide.question,placeholder:guide.placeholder,roleOptions:guide.roleOptions}:null);
  const backward=guide?.backward||null;
  if(!forward?.role && !backward?.role){
    return `<div class="inspector-section framework-guided-section"><span class="status-chip active">${esc(framework.shortLabel)} pause point</span><div class="prompt-question">${esc(guide?.question||'This framework route can pause here.')}</div><div class="guided-help-note">The framework is a lens, not a compulsory sequence. Return to an earlier node, add a free thought, or switch framework whenever another reading would be more useful.</div></div>`;
  }
  const initial=forward?.role?'forward':'backward';
  const initialProbe=initial==='forward'?forward:backward;
  const roleIds=(initialProbe?.roleOptions||[initialProbe?.role]).filter(Boolean);
  const options=roleIds.map(id=>{const c=framework.categories.find(x=>x.id===id);return c?`<option value="${attr(c.id)}" ${c.id===initialProbe.role?'selected':''}>${esc(c.label)}${c.id===initialProbe.role?' · suggested':''}</option>`:'';}).join('');
  const directions=forward?.role && backward?.role ? `<div class="probe-direction" role="group" aria-label="Prompt direction"><button type="button" class="probe-direction-button" data-probe-direction="backward">← What led here?</button><button type="button" class="probe-direction-button active" data-probe-direction="forward">What follows? →</button></div>` : '';
  return `<div class="inspector-section framework-guided-section">
    <div class="framework-next-row"><span class="guided-next-label">${esc(framework.shortLabel)} prompt</span><select id="frameworkNextRole" aria-label="Framework role">${options}</select></div>
    ${directions}
    <div class="prompt-question" id="frameworkPromptQuestion">${esc(initialProbe?.question||guide?.question||'What should be made explicit next?')}</div>
    ${guide?.choices?.length?`<div class="choice-list framework-cues">${guide.choices.map(c=>`<button class="choice-chip framework-cue" data-framework-cue="${attr(c)}">${esc(c)}</button>`).join('')}</div>`:''}
    <div class="guided-help-note">The selected node is the pause point. Probe backward to expose what led to it, or forward to develop what it implies. The suggested role remains editable.</div>
    <label class="field-label">Write the reasoning this prompt exposes</label>
    <textarea class="field-textarea" id="nextText" placeholder="${attr(initialProbe?.placeholder||'Write the reasoning this prompt exposes…')}"></textarea>
    <div class="guided-validation" id="nextValidation"></div>
    <button class="primary-button compact" id="addFrameworkNext">Add ${esc(framework.categories.find(c=>c.id===initialProbe?.role)?.label||'node')} →</button>
  </div>`;
}

function bindFrameworkNext(root,node,framework,currentRole,guide,onSubmit){
  const forward=guide?.forward || (guide?.nextRole?{role:guide.nextRole,question:guide.question,placeholder:guide.placeholder,roleOptions:guide.roleOptions}:null);
  const backward=guide?.backward||null;
  if(!forward?.role && !backward?.role)return;
  const area=root.querySelector('#nextText');
  const roleSelect=root.querySelector('#frameworkNextRole');
  const add=root.querySelector('#addFrameworkNext');
  const question=root.querySelector('#frameworkPromptQuestion');
  const cues=root.querySelector('.framework-cues');
  let direction=forward?.role?'forward':'backward';
  const probe=()=>direction==='backward'?backward:forward;
  const setRoleOptions=()=>{
    const p=probe();
    const ids=(p?.roleOptions||[p?.role]).filter(Boolean);
    if(roleSelect){
      roleSelect.innerHTML=ids.map(id=>{const c=framework.categories.find(x=>x.id===id);return c?`<option value="${attr(c.id)}" ${c.id===p?.role?'selected':''}>${esc(c.label)}${c.id===p?.role?' · suggested':''}</option>`:'';}).join('');
    }
  };
  const updateButton=()=>{
    const role=framework.categories.find(c=>c.id===roleSelect?.value);
    if(add)add.textContent=`Add ${role?.label||'node'} ${direction==='backward'?'←':'→'}`;
  };
  const applyDirection=next=>{
    direction=next;
    root.querySelectorAll('[data-probe-direction]').forEach(b=>b.classList.toggle('active',b.dataset.probeDirection===direction));
    const p=probe();
    if(question)question.textContent=p?.question||guide?.question||'';
    if(area)area.placeholder=p?.placeholder||'Write the reasoning this prompt exposes…';
    if(cues)cues.classList.toggle('hidden',direction==='backward');
    setRoleOptions();updateButton();
  };
  root.querySelectorAll('[data-probe-direction]').forEach(b=>b.addEventListener('click',()=>applyDirection(b.dataset.probeDirection)));
  roleSelect?.addEventListener('change',updateButton);
  root.querySelectorAll('[data-framework-cue]').forEach(b=>b.onclick=()=>{
    // Suggested answers are mutually exclusive. Choosing a different cue clears
    // the previous cue/text so the new prompt starts cleanly.
    root.querySelectorAll('[data-framework-cue]').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected');
    const cue=(b.dataset.frameworkCue||'').trim();
    if(!cue||!area)return;
    area.value=cue.endsWith('…')?cue:`${cue} — `;
    area.focus();area.setSelectionRange?.(area.value.length,area.value.length);
  });
  add?.addEventListener('click',()=>{
    const text=area?.value.trim();
    const validation=root.querySelector('#nextValidation');
    if(!text){if(validation)validation.textContent='Write the reasoning you want to turn into a node.';area?.focus();return;}
    if(validation)validation.textContent='';
    const roleId=roleSelect?.value||probe()?.role;
    onSubmit?.(text,roleId,{question:question?.textContent||guide?.question,currentRole:currentRole?.id||null,direction});
  });
  applyDirection(direction);
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
function roleExplanationMarkup(node,framework=null,frameworkRole=null){
  const role=nodeGuidance[node.type]||nodeGuidance.note;
  const detail=roleClarifications[node.type]||roleClarifications.note;
  const origin=provenanceLabel(inferLegacyProvenance(node));
  const evidence=evidenceLabel(inferredEvidenceKind(node));
  const lens=framework && !['tracework','freeform'].includes(framework.id)
    ? `<p><strong>Framework lens:</strong> ${esc(frameworkRole?.label||'Unmapped')} — ${esc(frameworkRole?.description||'This is an analytical lens; it does not prove the designer used this framework.')}</p>` : '';
  return `<details class="inspector-section trace-explain" open><summary>Explain this · ${esc(role.title)}</summary>
    <div class="trace-explain-body"><p><strong>Role:</strong> ${esc(role.use)}</p>
    <p><strong>When useful:</strong> ${esc(role.when)}</p>
    <p><strong>For example:</strong> ${esc(detail.example)}</p>
    <p><strong>Distinguish:</strong> ${esc(detail.boundary)}</p>
    ${lens}<div class="trace-evidence-summary"><span>Origin · ${esc(origin)}</span><span>Evidence · ${esc(evidence)}</span></div>
    ${node.meta?.sourceReference?`<p><strong>Source reference:</strong> ${esc(node.meta.sourceReference)}</p>`:''}
    <p class="trace-provenance-note">Provenance describes where this assertion entered the trace, not whether it is true. If the basis is missing, edit the node to record it.</p></div>
  </details>`;
}
function metaMarkup(node,framework=null,frameworkRole=null){
  const rows=[];
  rows.push(['Provenance',provenanceLabel(inferLegacyProvenance(node))]);
  rows.push(['Evidence basis', evidenceLabel(inferredEvidenceKind(node))]);
  if(node.meta?.sourceReference) rows.push(['Source / reference', node.meta.sourceReference]);
  if(framework && framework.id!=='tracework' && framework.id!=='freeform') rows.push(['Framework lens',`${frameworkRole?.label||'Unresolved'} · ${framework.source||framework.label}`]);
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
function frameworkProgressDone(roles,activeRoleId,index){ const current=roles.findIndex(r=>r.id===activeRoleId); return current>=0 && index<=current; }
function esc(t=''){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function attr(t=''){return esc(t).replace(/`/g,'');}
