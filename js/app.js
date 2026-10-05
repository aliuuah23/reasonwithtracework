import { getState, resetState, replaceState, patchState, updateState, subscribe, logEvent } from './core/state.js';
import { saveProject, loadProject, listProjects, ensureProject, deleteProject, clearAllProjects, exportProject } from './core/storage.js';
import { loadOntology, typeLabels } from './core/ontology.js';
import { createNode, createEdge } from './core/trace-model.js';
import { normaliseBrief } from './input/brief-parser.js';
import { detectHotspots } from './input/hotspot-detector.js';
import { classifyThought } from './input/thought-classifier.js';
import { addInterpretation } from './reasoning/interpretation.js';
import { addGrounding } from './reasoning/grounding.js';
import { addConsequence } from './reasoning/consequences.js';
import { addEvaluation, addGoal } from './reasoning/evaluation.js';
import { createBranch, forkNext, nextNodeType, rejectBranch, restoreBranch, repairSharedInputs } from './reasoning/branching.js';
import { renderGraph } from './graph/graph-renderer.js';
import { applyZoom, fitGraph, focusNode, bindCanvasPan, bindWheelZoom } from './graph/graph-interactions.js';
import { loadPathways, searchPathways } from './evidence/pathway-bank.js';
import { loadCaseStudies } from './evidence/case-studies.js';
import { branchSummaries, compareBranches } from './compare/pathway-compare.js';
import { renderBrief, renderLegend, toggleBriefEditor } from './ui/workspace.js';
import { renderEmptyInspector, renderHotspotInspector, renderNodeInspector } from './ui/panels.js';
import { renderTraceDashboard } from './ui/trace-panel.js';
import { openModal, closeModal } from './ui/modals.js';
import { toast, setSaveStatus } from './ui/notifications.js';

const $ = s => document.querySelector(s);
const els = {};
let ontology = [];
let pathways = [];
let caseStudies = [];
let saveTimer = null;
let canvasZoom = 1;
let showHotspotSuggestions = true;
let lastAddedNodeId = null;

async function init(){
  cacheEls();
  ontology = await loadOntology();
  pathways = await loadPathways();
  caseStudies = await loadCaseStudies();
  renderLegend(ontology);
  bindGlobalEvents();
  bindCanvasPan(els.graphViewport);
  bindWheelZoom(els.graphViewport,{getZoom:()=>canvasZoom,setZoom:zoomTo});
  await seedTestProject();
  renderProjectShelf();
  renderEmptyInspector();
  const params=new URLSearchParams(window.location.search);
  if(params.get('resume')==='1'){
    const active=loadProject();
    if(active){ repairSharedInputs(active); replaceState(active); enterApp(false); }
    history.replaceState(null,'',window.location.pathname);
  }
  subscribe(state => {
    if(!state.brief) return;
    setSaveStatus('Saving…',true);
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>{ saveProject(state); setSaveStatus('Saved locally',false); renderProjectShelf(); },220);
  });
}

function cacheEls(){
  Object.assign(els,{
    landing:$('#landingView'),app:$('#appView'),workspace:$('#workspaceView'),pathways:$('#pathwaysView'),trace:$('#traceView'),discussion:$('#discussionView'),
    briefLanding:$('#landingBrief'),briefEditor:$('#briefEditor'),graphViewport:$('#graphViewport'),graphStage:$('#graphStage'),graphSurface:$('#graphSurface'),graphNodes:$('#graphNodes'),graphEdges:$('#graphEdges'),canvasEmpty:$('#canvasEmpty'),
    thoughtDock:$('#thoughtDock'),freeThoughtInput:$('#freeThoughtInput'),thoughtTypeSelect:$('#thoughtTypeSelect'),thoughtReason:$('#thoughtReason'),thoughtMatches:$('#thoughtMatches'),addFreeThoughtButton:$('#addFreeThoughtButton'),addLooseNoteButton:$('#addLooseNoteButton'),toggleHotspotsButton:$('#toggleHotspotsButton'),traceCheckButton:$('#traceCheckButton')
  });
}

function bindGlobalEvents(){
  $('#loadDemoButton').onclick=async()=>{ const demo=await (await fetch('./data/demo-project.json')).json(); els.briefLanding.value=demo.brief; els.briefLanding.focus(); };
  $('#startTracingButton').onclick=()=>startFromBrief(els.briefLanding.value);
  $('#brandButton').onclick=()=>getState().brief?confirmReturnHome():showLanding();
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',e=>{ e.preventDefault(); showView(b.dataset.view); }));
  $('#newProjectButton').onclick=()=>getState().brief?confirmNewProject():els.briefLanding.focus();
  $('#aboutLink').onclick=e=>{ if(!getState().brief)return; e.preventDefault(); confirmLeaveForAbout(); };
  $('#editBriefButton').onclick=()=>toggleBriefEditor(true,getState());
  $('#cancelBriefEdit').onclick=()=>toggleBriefEditor(false,getState());
  $('#applyBriefEdit').onclick=()=>applyEditedBrief();
  $('#addPhraseButton').onclick=manualPhrase;
  els.toggleHotspotsButton.onclick=()=>{ showHotspotSuggestions=!showHotspotSuggestions; els.toggleHotspotsButton.textContent=showHotspotSuggestions?'Hide suggestions':'Show suggestions'; renderWorkspace(); };
  els.traceCheckButton.onclick=openTraceCheck;
  $('#branchButton').onclick=forkActive;
  $('#compareButton').onclick=openCompare;
  $('#fitButton').onclick=()=>{ canvasZoom=fitGraph(els.graphViewport,els.graphStage,els.graphSurface); updateZoomLabel(); };
  $('#zoomOutButton').onclick=()=>zoomTo(canvasZoom-.1);
  $('#zoomInButton').onclick=()=>zoomTo(canvasZoom+.1);
  $('#pathwaySearch').addEventListener('input',e=>renderPathwayCards(e.target.value));
  $('#exportJsonButton').onclick=()=>{exportProject(getState());toast('Project exported.');};
  $('#resetLocalDataButton').onclick=confirmResetLocalData;
  $('#addDiscussionButton').onclick=addDiscussionNote;
  els.freeThoughtInput.addEventListener('input',updateThoughtSuggestion);
  els.thoughtTypeSelect.addEventListener('change',()=>{ els.thoughtTypeSelect.dataset.manual='1'; updateThoughtSuggestion(); });
  els.addFreeThoughtButton.onclick=addFreeThought;
  els.addLooseNoteButton.onclick=addLooseNote;
}

async function startFromBrief(raw){
  const brief=normaliseBrief(raw);
  if(!brief){toast('Paste a design brief first.');return;}
  const hotspots=await detectHotspots(brief);
  resetState();
  patchState({brief,hotspots,projectName:projectNameFromBrief(brief)});
  logEvent('Brief analysed',`${hotspots.length} interpretive hotspots surfaced`);
  enterApp(true);
}

function enterApp(autoSelect=true){
  canvasZoom=1; updateZoomLabel();
  els.graphViewport.dataset.needsInitialPosition='1';
  els.landing.classList.add('hidden'); els.app.classList.remove('hidden');
  showView('workspace');
  renderWorkspace();
  if(autoSelect && getState().hotspots.length) selectHotspot(getState().hotspots[0].id);
}

function showLanding(){ els.app.classList.add('hidden'); els.landing.classList.remove('hidden'); renderProjectShelf(); }

function showView(view){
  const allowed=new Set(['workspace','pathways','trace','discussion']);
  if(!allowed.has(view)) view='workspace';
  if(!getState().brief && view!=='workspace'){showLanding();return;}

  patchState({view},{silent:true});
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));

  const viewEls={
    workspace:document.getElementById('workspaceView'),
    pathways:document.getElementById('pathwaysView'),
    trace:document.getElementById('traceView'),
    discussion:document.getElementById('discussionView')
  };
  Object.entries(viewEls).forEach(([name,el])=>{
    if(!el)return;
    const visible=name===view;
    el.classList.toggle('hidden',!visible);
    el.hidden=!visible;
  });

  if(view==='workspace') renderWorkspace();
  else if(view==='pathways') renderPathwayCards($('#pathwaySearch')?.value||'');
  else if(view==='trace') renderTraceDashboard(getState());
  else if(view==='discussion') renderDiscussion();

  window.scrollTo({top:0,behavior:'auto'});
}

function renderWorkspace(){
  const state=getState();
  renderBrief(state,{onHotspot:selectHotspot},{showSuggestions:showHotspotSuggestions});
  const hasNodes=state.nodes.length>0;
  els.canvasEmpty.classList.toggle('hidden',hasNodes);
  els.graphViewport.classList.toggle('hidden',!hasNodes);
  const scopedBranches=currentBranches(state);
  $('#branchCount').textContent=`${scopedBranches.length || 1} ${(scopedBranches.length || 1)===1?'path':'paths'}`;
  updateTraceCheck();
  $('#canvasTitle').textContent=state.selectedHotspotId ? `Tracing “${state.hotspots.find(h=>h.id===state.selectedHotspotId)?.text || 'language'}”` : 'Your trace';
  if(hasNodes)renderGraphState();
  const active=state.nodes.find(n=>n.id===state.activeNodeId);
  $('#branchButton').disabled=!active || active.type==='goal' || active.type==='note' || active.status==='rejected';
  $('#compareButton').disabled=scopedBranches.length<2;
  els.thoughtDock.classList.toggle('hidden',!state.selectedHotspotId);
  if(state.selectedHotspotId) updateThoughtSuggestion();
  if(active) renderNodeInspector(active,state,nodeHandlers());
  else if(state.selectedHotspotId){ const h=state.hotspots.find(x=>x.id===state.selectedHotspotId); if(h)renderHotspotInspector(h,hotspotHandlers()); }
  else renderEmptyInspector();
}

function renderGraphState(){
  const state=getState();
  const scoped=scopedTrace(state);
  renderGraph({...state,nodes:scoped.nodes,edges:scoped.edges},{surface:els.graphSurface,svg:els.graphEdges,nodes:els.graphNodes},{
    onNodeClick:id=>selectNode(id),
    onNodeMove:(id,x,y)=>updateState(s=>{const n=s.nodes.find(n=>n.id===id);if(n){n.x=x;n.y=y;}}),
    getScale:()=>canvasZoom
  });
  applyZoom(els.graphViewport,els.graphStage,els.graphSurface,canvasZoom,{preserveCenter:false});
  if(els.graphViewport.dataset.needsInitialPosition==='1'){
    delete els.graphViewport.dataset.needsInitialPosition;
    requestAnimationFrame(()=>{
      const ox=Number(els.graphSurface.dataset.originX||0),oy=Number(els.graphSurface.dataset.originY||0);
      els.graphViewport.scrollLeft=Math.max(0,(ox-90)*canvasZoom);
      els.graphViewport.scrollTop=Math.max(0,(oy-120)*canvasZoom);
    });
  }

  if(lastAddedNodeId){
    const id=lastAddedNodeId;
    lastAddedNodeId=null;
    requestAnimationFrame(()=>{
      const el=document.querySelector(`[data-id="${id}"]`);
      if(!el)return;
      el.classList.add('just-added');
      focusNode(els.graphViewport,el,canvasZoom);
      setTimeout(()=>el.classList.remove('just-added'),1800);
    });
  }
}

async function selectHotspot(id){
  const state=getState(), hotspot=state.hotspots.find(h=>h.id===id); if(!hotspot)return;
  let input=state.nodes.find(n=>n.type==='input'&&n.meta?.hotspotId===id);
  updateState(s=>{
    s.selectedHotspotId=id;
    if(!input){
      input=createNode({type:'input',label:hotspot.text,branchId:`trace-${id}`,meta:{hotspotId:id,source:'brief'}});
      s.nodes.push(input); s.activeBranchId=input.branchId;
    }
    s.activeNodeId=input.id;
  });
  logEvent('Language selected',hotspot.text);
  renderWorkspace();
  const latest=getState().nodes.find(n=>n.type==='input'&&n.meta?.hotspotId===id);
  await renderHotspotInspector(hotspot,hotspotHandlers(latest?.id));
  setTimeout(()=>focusNode(els.graphViewport,document.querySelector(`[data-id="${latest?.id}"]`),canvasZoom),80);
}

function hotspotHandlers(inputNodeId=null){
  return {
    onInterpretation:(text,prompt)=>captureContext(text,prompt,inputNodeId || getState().activeNodeId),
    onRelatedPath:id=>inspectPathway(pathways.find(p=>p.id===id)),
    onCaseStudy:id=>inspectCaseStudy(id)
  };
}

function captureContext(text,prompt,inputNodeId){
  const who=prompt?.who||[], when=prompt?.when||[];
  openModal(`<h2 id="modalTitle">Make the reading specific.</h2><p>Optional, but useful: who should experience this condition, and when does it matter?</p>
    <label class="field-label">Who?</label><select class="field-input" id="contextWho"><option value="">Leave open for now</option>${who.map(x=>`<option>${escapeHtml(x)}</option>`).join('')}</select>
    <label class="field-label">When / under what condition?</label><select class="field-input" id="contextWhen"><option value="">Leave open for now</option>${when.map(x=>`<option>${escapeHtml(x)}</option>`).join('')}</select>
    <div class="modal-actions"><button class="secondary-button" data-close-modal>Cancel</button><button class="primary-button compact" id="confirmInterpretation">Add interpretation →</button></div>`,{
      onOpen:m=>m.querySelector('#confirmInterpretation').onclick=()=>{
        const meta={who:m.querySelector('#contextWho').value,when:m.querySelector('#contextWhen').value};
        let created=null;
        updateState(s=>{ const input=s.nodes.find(n=>n.id===inputNodeId); created=addInterpretation(s,inputNodeId,text,input?.branchId||s.activeBranchId,meta); });
        lastAddedNodeId=created?.id||null;
        logEvent('Interpretation added',text); closeModal(); renderWorkspace();
      }
    });
}

function selectNode(id){ patchState({activeNodeId:id},{silent:true}); renderWorkspace(); }

function nodeHandlers(){
  return {
    onNext:(node,text,extra)=>{
      let created=null;
      updateState(s=>{
        if(node.type==='interpretation') created=addGrounding(s,node.id,text,extra.sourceKind||'Designer rationale',node.branchId);
        else if(node.type==='grounding') created=addConsequence(s,node.id,text,node.branchId,extra.tags||[]);
        else if(node.type==='consequence') created=addEvaluation(s,node.id,text,node.branchId,extra.tags||[]);
        else if(node.type==='evaluation') created=addGoal(s,node.id,text,node.branchId);
      });
      lastAddedNodeId=created?.id||null;
      const labels={interpretation:'Grounding added',grounding:'Spatial consequence added',consequence:'Evaluation added',evaluation:'Goal added'};
      logEvent(labels[node.type]||'Reasoning added',text); renderWorkspace();
    },
    onBranch:id=>branchFrom(id),
    onFork:id=>forkFrom(id),
    onEdit:node=>editNode(node),
    onReject:(branchId,node)=>confirmRejectBranch(branchId,node),
    onRestore:(branchId,node)=>{
      updateState(s=>restoreBranch(s,branchId));
      logEvent('Path restored',node?.label||'Rejected reasoning restored');
      renderWorkspace(); toast('Path restored.');
    },
    onConvertNote:(node,type)=>convertNote(node,type),
    onCaseStudy:id=>inspectCaseStudy(id)
  };
}

function forkActive(){ const n=getState().nodes.find(x=>x.id===getState().activeNodeId); if(n && n.type!=='goal')forkFrom(n.id); }
function forkFrom(id){
  const origin=getState().nodes.find(n=>n.id===id); if(!origin)return;
  const type=nextNodeType(origin.type); if(!type)return;
  const labels={interpretation:'interpretation',grounding:'grounding',consequence:'spatial consequence',evaluation:'evaluation',goal:'goal'};
  openModal(`<h2 id="modalTitle">Fork the reasoning here.</h2><p>Create another ${labels[type]||type} from this same point. The existing route stays intact.</p><label class="field-label">${labels[type]||type}</label><textarea class="field-textarea" id="forkText" placeholder="Describe another plausible next move…"></textarea><div class="modal-actions"><button class="secondary-button" data-close-modal>Cancel</button><button class="primary-button compact" id="confirmFork">Create fork →</button></div>`,{
    onOpen:m=>m.querySelector('#confirmFork').onclick=()=>{ const val=m.querySelector('#forkText').value.trim(); if(!val)return; let created=null; updateState(s=>{created=forkNext(s,id,val);}); lastAddedNodeId=created?.id||null; logEvent('Reasoning fork created',val); closeModal(); renderWorkspace(); }
  });
}
function branchFrom(id){
  const origin=getState().nodes.find(n=>n.id===id); if(!origin)return;
  openModal(`<h2 id="modalTitle">Branch this interpretation.</h2><p>Keep the existing reading and create another possible meaning alongside it.</p><label class="field-label">Alternative interpretation</label><textarea class="field-textarea" id="branchText" placeholder="Describe another plausible reading of this language…"></textarea><div class="modal-actions"><button class="secondary-button" data-close-modal>Cancel</button><button class="primary-button compact" id="confirmBranch">Create branch →</button></div>`,{
    onOpen:m=>m.querySelector('#confirmBranch').onclick=()=>{ const val=m.querySelector('#branchText').value.trim(); if(!val)return; let created=null; updateState(s=>{created=createBranch(s,id,val);}); lastAddedNodeId=created?.id||null; logEvent('Alternative branch created',val); closeModal(); renderWorkspace(); }
  });
}

function editNode(node){
  openModal(`<h2 id="modalTitle">Edit ${escapeHtml(node.type==='note'?'note':node.type)}.</h2><p>Changing a reasoning move does not erase the rest of the trace. It makes revision visible.</p><textarea class="field-textarea" id="editNodeText">${escapeHtml(node.label)}</textarea><div class="modal-actions"><button class="secondary-button" data-close-modal>Cancel</button><button class="primary-button compact" id="saveNodeEdit">Save change</button></div>`,{
    onOpen:m=>m.querySelector('#saveNodeEdit').onclick=()=>{ const val=m.querySelector('#editNodeText').value.trim(); if(!val)return; updateState(s=>{const n=s.nodes.find(x=>x.id===node.id);n.label=val;if(n.type==='note'){const c=classifyThought(val);n.meta={...n.meta,suggestedType:c.type||'interpretation',classificationReason:c.reason,classificationConfidence:c.confidence};}n.updatedAt=new Date().toISOString();}); logEvent('Reasoning revised',val); closeModal(); renderWorkspace(); }
  });
}

async function applyEditedBrief(){
  const brief=normaliseBrief(els.briefEditor.value); if(!brief)return;
  const hotspots=await detectHotspots(brief);
  updateState(s=>{s.brief=brief;s.hotspots=hotspots;s.selectedHotspotId=null;s.nodes=[];s.edges=[];s.activeNodeId=null;s.activeBranchId='branch-1';});
  logEvent('Brief revised','Existing reasoning reset to avoid false links'); toggleBriefEditor(false,getState()); renderWorkspace(); toast('Brief re-analysed.');
}

function manualPhrase(){
  const brief=getState().brief;
  openModal(`<h2 id="modalTitle">Select text from the brief.</h2><p>Drag across any word or phrase below. TRACEWORK will preserve the exact wording as an Input hotspot.</p>
    <div class="selection-brief" id="phraseSelectionText">${escapeHtml(brief)}</div>
    <div class="selection-readout"><span>Selected</span><strong id="phraseSelectionPreview">Nothing selected yet</strong></div>
    <div class="modal-actions"><button class="secondary-button" data-close-modal>Cancel</button><button class="primary-button compact" id="confirmPhrase" disabled>Add selected text</button></div>`,{
    onOpen:m=>{
      const box=m.querySelector('#phraseSelectionText'), preview=m.querySelector('#phraseSelectionPreview'), confirm=m.querySelector('#confirmPhrase');
      let picked=null;
      const readSelection=()=>{
        const sel=window.getSelection();
        if(!sel || sel.rangeCount===0 || sel.isCollapsed){ picked=null; preview.textContent='Nothing selected yet'; confirm.disabled=true; return; }
        const range=sel.getRangeAt(0);
        if(!box.contains(range.commonAncestorContainer)){ picked=null; preview.textContent='Nothing selected yet'; confirm.disabled=true; return; }
        const start=textOffsetWithin(box,range.startContainer,range.startOffset);
        const end=textOffsetWithin(box,range.endContainer,range.endOffset);
        const a=Math.max(0,Math.min(start,end)), b=Math.min(brief.length,Math.max(start,end));
        const text=brief.slice(a,b).trim();
        if(!text){ picked=null; preview.textContent='Nothing selected yet'; confirm.disabled=true; return; }
        const leading=brief.slice(a,b).indexOf(text);
        picked={text,start:a+Math.max(0,leading),end:a+Math.max(0,leading)+text.length};
        preview.textContent=`“${text}”`;
        confirm.disabled=false;
      };
      box.addEventListener('mouseup',()=>setTimeout(readSelection,0));
      box.addEventListener('keyup',()=>setTimeout(readSelection,0));
      confirm.onclick=()=>{
        if(!picked)return;
        const duplicate=getState().hotspots.some(h=>h.start===picked.start&&h.end===picked.end);
        if(duplicate){toast('That exact word or phrase is already a hotspot.');return;}
        const h={id:`hotspot-manual-${Date.now()}`,text:picked.text,concept:'custom',start:picked.start,end:picked.end,reason:'Selected by designer for interpretation',kind:/\s/.test(picked.text)?'phrase':'word'};
        updateState(s=>{s.hotspots.push(h);s.hotspots.sort((a,b)=>a.start-b.start);});
        closeModal(); showHotspotSuggestions=true; els.toggleHotspotsButton.textContent='Hide suggestions'; renderWorkspace(); selectHotspot(h.id);
      };
    }
  });
}

function textOffsetWithin(root,node,offset){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let total=0,current;
  while((current=walker.nextNode())){
    if(current===node) return total+offset;
    total+=current.textContent.length;
  }
  return total;
}

async function renderPathwayCards(query=''){
  const items=await searchPathways(query); const root=$('#pathwayGrid');
  root.innerHTML=items.length?items.map(pathCard).join(''):'<div class="empty-state-card">No starter pathways match that search.</div>';
  root.querySelectorAll('[data-inspect-path]').forEach(b=>b.onclick=()=>inspectPathway(items.find(p=>p.id===b.dataset.inspectPath)));
  root.querySelectorAll('[data-use-path]').forEach(b=>b.onclick=()=>usePathway(items.find(p=>p.id===b.dataset.usePath)));
}

function pathCard(p){ const color=t=>`var(--${t})`; return `<article class="pathway-card"><div class="pathway-card-head"><span class="pathway-source">${escapeHtml(p.source)}</span><span class="status-chip">${escapeHtml(p.status)}</span></div><h3>${escapeHtml(p.concept)}</h3><div class="pathway-mini">${p.steps.slice(0,4).map(s=>`<div class="pathway-step" style="--step-color:${color(s.type)}"><i></i><div><strong>${escapeHtml(s.type)}</strong><span>${escapeHtml(s.text)}</span></div></div>`).join('')}</div><div class="pathway-card-actions"><button class="secondary-button" data-inspect-path="${p.id}">Inspect</button><button class="primary-button compact" data-use-path="${p.id}">Use as starting point</button></div></article>`; }

function inspectPathway(p){ if(!p)return; openModal(`<h2 id="modalTitle">${escapeHtml(p.concept)}</h2><p>${escapeHtml(p.source)} · ${escapeHtml(p.status)}. This is a reasoning precedent, not a prescribed solution.</p>${p.steps.map(s=>`<div class="pathway-step" style="--step-color:var(--${s.type});margin:12px 0"><i></i><div><strong>${escapeHtml(s.type)}</strong><span>${escapeHtml(s.text)}</span></div></div>`).join('')}<div class="modal-actions"><button class="secondary-button" data-close-modal>Close</button><button class="primary-button compact" id="modalUsePath">Use as starting point</button></div>`,{onOpen:m=>m.querySelector('#modalUsePath').onclick=()=>{closeModal();usePathway(p);}}); }

function usePathway(p){
  const state=getState(), hotspot=state.hotspots.find(h=>h.id===state.selectedHotspotId);
  if(!hotspot){toast('Choose a phrase in your brief first.');showView('workspace');return;}
  const input=state.nodes.find(n=>n.type==='input'&&n.meta?.hotspotId===hotspot.id);
  if(!input){toast('Open the selected phrase in the workspace first.');return;}
  const scoped=scopedTrace(state);
  const occupied=scoped.nodes.filter(n=>n.type!=='input').map(n=>Number(n.y)||120);
  const laneY=Math.max(120,...occupied)+260;
  const xByType={interpretation:335,grounding:600,consequence:865,evaluation:1130,goal:1395};
  const addedIds=[];
  updateState(s=>{
    const branchId=`branch-${Date.now().toString().slice(-5)}`; let source=input.id;
    p.steps.forEach(step=>{
      const n=createNode({type:step.type,label:step.text,branchId,x:xByType[step.type]??335,y:laneY,meta:{sourcePathway:p.id,sourceLabel:p.source,sourceStatus:p.status,provisional:true}});
      s.nodes.push(n); s.edges.push(createEdge(source,n.id,{status:'provisional'})); source=n.id; addedIds.push(n.id);
    });
    s.activeNodeId=source;s.activeBranchId=branchId;
  });
  logEvent('Starter pathway added',`${p.concept} · ${p.source}`); toast('Added as a provisional branch.'); showView('workspace');
  setTimeout(()=>{ const el=document.querySelector(`[data-id="${addedIds[0]}"]`); if(el)focusNode(els.graphViewport,el,canvasZoom); },90);
}

function openCompare(){
  const state=getState(); const summaries=currentBranches(state); if(summaries.length<2){toast('Create a second branch first.');return;}
  const options=summaries.map((b,i)=>`<option value="${escapeHtml(b.branchId)}">Path ${i+1} · ${escapeHtml(b.status)} · ${escapeHtml((b.label||'').slice(0,42))}</option>`).join('');
  openModal(`<h2 id="modalTitle">Compare pathways.</h2><p>Choose two reasoning routes. TRACEWORK aligns their inherited reasoning, consequences and trade-offs without selecting a winner.</p>
    <div class="compare-picker"><label>Path A<select class="field-input" id="compareA">${options}</select></label><label>Path B<select class="field-input" id="compareB">${options}</select></label></div>
    <div id="comparePreview"></div><div class="modal-actions"><button class="secondary-button" data-close-modal>Close</button></div>`,{
      onOpen:m=>{
        const a=m.querySelector('#compareA'),b=m.querySelector('#compareB'); if(summaries[1])b.value=summaries[1].branchId;
        const draw=()=>{
          if(a.value===b.value){ m.querySelector('#comparePreview').innerHTML='<p style="color:var(--danger);font-size:12px">Choose two different paths.</p>'; return; }
          const A=summaries.find(x=>x.branchId===a.value),B=summaries.find(x=>x.branchId===b.value),rows=compareBranches(getState(),a.value,b.value);
          m.querySelector('#comparePreview').innerHTML=`<div class="compare-table"><strong></strong><div class="compare-head"><strong>Path A</strong><span class="path-status ${A.status.toLowerCase()}">${A.status}</span></div><div class="compare-head"><strong>Path B</strong><span class="path-status ${B.status.toLowerCase()}">${B.status}</span></div>${rows.map(r=>`<span style="color:var(--muted);text-transform:capitalize">${escapeHtml(r.type)}</span><div>${r.a?escapeHtml(r.a.label):'<span style="color:var(--muted-2)">Not developed</span>'}</div><div>${r.b?escapeHtml(r.b.label):'<span style="color:var(--muted-2)">Not developed</span>'}</div>`).join('')}</div>`;
        };
        a.onchange=draw;b.onchange=draw;draw();
      }
    });
}

function confirmRejectBranch(branchId,node){
  openModal(`<h2 id="modalTitle">Reject this path?</h2><p>The path will stay visible in the reasoning history and can be restored later. Shared source language and other branches will remain active.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Keep path</button><button class="danger-button" id="confirmRejectPath">Reject path</button></div>`,{onOpen:m=>m.querySelector('#confirmRejectPath').onclick=()=>{
    updateState(s=>rejectBranch(s,branchId)); logEvent('Path rejected',node?.label||'Retained in project history'); closeModal(); renderWorkspace(); toast('Path rejected — select it to restore.');
  }});
}

function confirmReturnHome(){
  saveProject(getState());
  openModal(`<h2 id="modalTitle">Return to home?</h2><p>Your current trace is already saved in this browser. You can reopen it from the project shelf or My Trace.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Stay here</button><button class="primary-button compact" id="confirmHome">Go home</button></div>`,{onOpen:m=>m.querySelector('#confirmHome').onclick=()=>{closeModal();showLanding();}});
}

function confirmLeaveForAbout(){
  saveProject(getState());
  openModal(`<h2 id="modalTitle">Open About?</h2><p>Your current trace is saved locally before you leave the workspace.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Stay here</button><button class="primary-button compact" id="confirmAbout">Open About</button></div>`,{onOpen:m=>m.querySelector('#confirmAbout').onclick=()=>{window.location.href='about.html';}});
}

function confirmResetLocalData(){
  openModal(`<h2 id="modalTitle">Reset local TRACEWORK data?</h2><p>This removes traces saved in this browser and clears the current workspace. This cannot be undone. The built-in test project will be available again the next time TRACEWORK loads.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Cancel</button><button class="danger-button" id="confirmResetData">Reset local data</button></div>`,{onOpen:m=>m.querySelector('#confirmResetData').onclick=()=>{
    const ok=clearAllProjects();
    if(!ok){toast('Could not clear local data.');return;}
    resetState();
    closeModal();
    els.briefLanding.value='';
    setSaveStatus('Local data reset',false);
    renderProjectShelf();
    showLanding();
    toast('Local TRACEWORK data cleared.');
  }});
}

function confirmNewProject(){ openModal(`<h2 id="modalTitle">Start a new trace?</h2><p>Your current trace stays saved in this browser. You can reopen it from the project shelf.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Keep working</button><button class="secondary-button" id="exportBeforeNew">Export first</button><button class="primary-button compact" id="confirmNew">Start new</button></div>`,{onOpen:m=>{m.querySelector('#exportBeforeNew').onclick=()=>exportProject(getState());m.querySelector('#confirmNew').onclick=()=>{saveProject(getState());resetState();closeModal();els.briefLanding.value='';showLanding();};}}); }


async function seedTestProject(){
  try{
    if(localStorage.getItem('tracework.dismissedTestProject.v1')==='1') return;
    const project=await (await fetch('./data/test-project.json')).json();
    ensureProject(project);
  }catch(err){ console.warn('TRACEWORK test project could not be seeded.',err); }
}

function renderProjectShelf(){
  const wrap=$('#projectShelfWrap'),root=$('#projectShelf');
  if(!wrap||!root)return;
  const projects=listProjects().slice(0,8);
  wrap.classList.toggle('hidden',!projects.length);
  root.innerHTML=projects.map(p=>`<article class="project-card"><div><span class="project-card-label">${p.projectId==='tracework-test-pavilion'?'TEST PROJECT':'SAVED TRACE'}</span><h3>${escapeHtml(p.projectName||'Untitled trace')}</h3><p>${escapeHtml((p.brief||'').slice(0,105))}${(p.brief||'').length>105?'…':''}</p></div><div class="project-card-actions"><button class="secondary-button compact-project" data-open-project="${escapeHtml(p.projectId)}">Open</button><button class="project-delete-button" data-delete-project="${escapeHtml(p.projectId)}" aria-label="Delete ${escapeHtml(p.projectName||'trace')}" title="Delete trace">×</button></div></article>`).join('');
  root.querySelectorAll('[data-open-project]').forEach(b=>b.onclick=()=>openSavedProject(b.dataset.openProject));
  root.querySelectorAll('[data-delete-project]').forEach(b=>b.onclick=e=>{ e.stopPropagation(); confirmDeleteSavedProject(b.dataset.deleteProject); });
}

function openSavedProject(id){
  const project=loadProject(id);
  if(!project)return;
  repairSharedInputs(project);
  replaceState(project);
  enterApp(false);
  if(project.selectedHotspotId) renderWorkspace();
}

function confirmDeleteSavedProject(id){
  const project=loadProject(id);
  if(!project)return;
  openModal(`<h2 id="modalTitle">Delete this trace?</h2><p><strong>${escapeHtml(project.projectName||'Untitled trace')}</strong> will be removed from this browser. This cannot be undone unless you exported a copy.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Keep trace</button><button class="danger-button" id="confirmDeleteTrace">Delete trace</button></div>`,{
    onOpen:m=>m.querySelector('#confirmDeleteTrace').onclick=()=>{
      deleteProject(id);
      if(id==='tracework-test-pavilion') localStorage.setItem('tracework.dismissedTestProject.v1','1');
      if(getState().projectId===id) resetState();
      closeModal();
      renderProjectShelf();
      toast('Trace deleted from this browser.');
    }
  });
}

function renderDiscussion(){
  const state=getState(),list=$('#discussionList'),scope=$('#discussionScope'),preview=$('#discussionAnchorPreview');
  if(!list||!scope)return;

  const active=state.nodes.find(n=>n.id===state.activeNodeId && n.type!=='input');
  const attachable=state.nodes.filter(n=>n.type!=='input');
  const previous=scope.dataset.lastValue || scope.value || 'project';

  const options=['<option value="project">Whole project</option>'];
  if(attachable.length){
    options.push('<optgroup label="Reasoning moves">');
    for(const node of attachable){
      const type=typeLabels[node.type]||node.type;
      const label=(node.label||'Untitled reasoning move').replace(/\s+/g,' ').trim();
      const short=label.length>72?`${label.slice(0,69)}…`:label;
      options.push(`<option value="node:${escapeHtml(node.id)}">${escapeHtml(type)} — ${escapeHtml(short)}</option>`);
    }
    options.push('</optgroup>');
  }
  scope.innerHTML=options.join('');

  const validValues=new Set(['project',...attachable.map(n=>`node:${n.id}`)]);
  const preferred=active?`node:${active.id}`:previous;
  scope.value=validValues.has(preferred)?preferred:'project';
  scope.dataset.lastValue=scope.value;

  const updatePreview=()=>{
    if(!preview)return;
    scope.dataset.lastValue=scope.value;
    const nodeId=scope.value.startsWith('node:')?scope.value.slice(5):null;
    const node=nodeId?state.nodes.find(n=>n.id===nodeId):null;
    preview.classList.toggle('hidden',!node);
    preview.innerHTML=node?`<span>${escapeHtml(typeLabels[node.type]||node.type)}</span><strong>${escapeHtml(node.label||'Untitled reasoning move')}</strong>`:'';
  };
  scope.onchange=updatePreview;
  updatePreview();

  const comments=state.comments||[];
  list.innerHTML=comments.length?comments.map(c=>{ const node=c.nodeId?state.nodes.find(n=>n.id===c.nodeId):null; const nodeType=node?(typeLabels[node.type]||node.type):''; return `<article class="discussion-item"><div class="discussion-item-head"><span><strong>${escapeHtml(c.author||'You')}</strong> · ${new Date(c.time).toLocaleString()}</span><span class="discussion-scope">${node?`${escapeHtml(nodeType)} · ${escapeHtml(node.label.slice(0,44))}`:'Whole project'}</span></div><p>${escapeHtml(c.text)}</p></article>`; }).join(''):'<div class="empty-state-card" style="padding:28px">No discussion notes yet. Add a question, critique or rationale for another designer.</div>';
}
function addDiscussionNote(){
  const text=$('#discussionText')?.value.trim(); if(!text)return;
  const state=getState();
  const value=$('#discussionScope')?.value||'project';
  const requestedNodeId=value.startsWith('node:')?value.slice(5):null;
  const nodeId=requestedNodeId && state.nodes.some(n=>n.id===requestedNodeId)?requestedNodeId:null;
  updateState(s=>{ s.comments=s.comments||[]; s.comments.unshift({id:`comment-${Date.now()}`,author:'You',text,nodeId,time:new Date().toISOString()}); });
  logEvent('Discussion note added',text.slice(0,70)); $('#discussionText').value=''; renderDiscussion(); toast('Added to discussion.');
}

function updateThoughtSuggestion(){
  if(!els.freeThoughtInput)return;
  const text=els.freeThoughtInput.value.trim();
  const state=getState();
  const active=state.nodes.find(n=>n.id===state.activeNodeId);
  const result=classifyThought(text,{afterType:active?.type==='note'?null:active?.type});
  const hasText=Boolean(text);
  els.addFreeThoughtButton.disabled=!hasText;
  els.addLooseNoteButton.disabled=!hasText;

  if(!hasText){
    els.thoughtReason.textContent='Start typing to see a suggestion.';
    els.thoughtTypeSelect.dataset.manual='';
    if(els.thoughtMatches) els.thoughtMatches.innerHTML='';
    return;
  }

  const manual=els.thoughtTypeSelect.dataset.manual==='1';
  if(!manual && result.type) els.thoughtTypeSelect.value=result.type;
  const selected=els.thoughtTypeSelect.value;
  const best=result.matches?.[0];
  const selectedLabel=typeLabels[selected]||selected;
  els.thoughtReason.textContent=manual
    ? `Manual override · TRACEWORK will use ${selectedLabel}.`
    : `${best?.strength??Math.round(result.confidence*100)}% match · ${result.reason}`;

  if(els.thoughtMatches){
    els.thoughtMatches.innerHTML=(result.matches||[]).slice(0,3).map((m,i)=>{
      const label=typeLabels[m.type]||m.type;
      return `<button type="button" class="thought-match ${m.type===selected?'selected':''} ${i===0?'strongest':''}" data-match-type="${m.type}"><span>${escapeHtml(label)}</span><strong>${m.strength}%</strong></button>`;
    }).join('');
    els.thoughtMatches.querySelectorAll('[data-match-type]').forEach(b=>b.onclick=()=>{
      els.thoughtTypeSelect.value=b.dataset.matchType;
      els.thoughtTypeSelect.dataset.manual='1';
      updateThoughtSuggestion();
    });
  }
}

function addFreeThought(){
  const text=els.freeThoughtInput.value.trim(); if(!text)return;
  const state=getState(); const active=state.nodes.find(n=>n.id===state.activeNodeId);
  const classification=classifyThought(text,{afterType:active?.type==='note'?null:active?.type});
  const type=els.thoughtTypeSelect.value||classification.type||'interpretation';
  const selectedHotspotId=state.selectedHotspotId;
  const scoped=scopedTrace(state);
  const maxY=Math.max(0,...scoped.nodes.map(n=>Number(n.y)||0));
  const depth={input:0,interpretation:1,grounding:2,consequence:3,evaluation:4,goal:5}[type]??1;
  const branchId=active?.branchId||`free-${Date.now()}`;
  const expected={input:'interpretation',interpretation:'grounding',grounding:'consequence',consequence:'evaluation',evaluation:'goal'}[active?.type];
  let created=null;
  updateState(s=>{
    const node=createNode({type,label:text,branchId,x:70+depth*265,y:maxY+165,meta:{freeform:true,hotspotId:selectedHotspotId,classifiedBy:'TRACEWORK',classificationReason:classification.reason,classificationConfidence:classification.confidence}});
    s.nodes.push(node);
    if(active && expected===type) s.edges.push(createEdge(active.id,node.id));
    s.activeNodeId=node.id; s.activeBranchId=branchId;
    created=node;
  });
  lastAddedNodeId=created?.id||null;
  logEvent('Free reasoning added',`${typeLabels[type]||type} · ${text}`);
  els.freeThoughtInput.value=''; els.thoughtTypeSelect.dataset.manual=''; updateThoughtSuggestion(); renderWorkspace();
  toast(`Added as ${typeLabels[type]||type}.`);
}

function addLooseNote(){
  const text=els.freeThoughtInput.value.trim(); if(!text)return;
  const state=getState(); const active=state.nodes.find(n=>n.id===state.activeNodeId);
  const classification=classifyThought(text,{afterType:active?.type==='note'?null:active?.type});
  const scoped=scopedTrace(state); const maxY=Math.max(0,...scoped.nodes.map(n=>Number(n.y)||0));
  let created=null;
  updateState(s=>{
    const node=createNode({type:'note',label:text,branchId:`note-${Date.now()}`,x:335,y:maxY+165,meta:{hotspotId:s.selectedHotspotId,suggestedType:classification.type||'interpretation',classificationReason:classification.reason,classificationConfidence:classification.confidence}});
    s.nodes.push(node); s.activeNodeId=node.id; created=node;
  });
  lastAddedNodeId=created?.id||null;
  logEvent('Loose note added',text);
  els.freeThoughtInput.value=''; els.thoughtTypeSelect.dataset.manual=''; updateThoughtSuggestion(); renderWorkspace();
  toast('Added as an unclassified note.');
}

function convertNote(node,type){
  if(!node || node.type!=='note')return;
  updateState(s=>{ const n=s.nodes.find(x=>x.id===node.id); if(!n)return; n.type=type; n.meta={...n.meta,convertedFromNote:true,freeform:true}; delete n.meta.suggestedType; n.updatedAt=new Date().toISOString(); });
  logEvent('Note classified',`${typeLabels[type]||type} · ${node.label}`); renderWorkspace(); toast(`Converted to ${typeLabels[type]||type}.`);
}

function inspectCaseStudy(id){
  const c=caseStudies.find(x=>x.id===id); if(!c)return;
  openModal(`<h2 id="modalTitle">${escapeHtml(c.name)}</h2><p>${escapeHtml(c.designer)} · ${escapeHtml(String(c.year))}${c.feature?` · ${escapeHtml(c.feature)}`:''}</p>
    <div class="node-use-card"><strong>Feature to inspect</strong><p>${escapeHtml(c.note)}</p>${c.whyRelevant?`<p><strong>Why this may matter here:</strong> ${escapeHtml(c.whyRelevant)}</p>`:''}<p><strong>Question to carry back:</strong> ${escapeHtml(c.prompt)}</p></div>
    <div class="inspector-section"><h4>Spatial moves to inspect</h4><div class="hotspot-list">${(c.moves||[]).map(m=>`<span class="hotspot-chip">${escapeHtml(m)}</span>`).join('')}</div></div>
    <div class="modal-actions">${c.sourceUrl?`<a class="secondary-button" href="${escapeHtml(c.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.sourceLabel||'Open source')} ↗</a>`:''}<button class="primary-button compact" data-close-modal>Back to trace</button></div>`);
}


function traceIssues(state=getState()){
  const scoped=scopedTrace(state);
  const activeNodes=scoped.nodes.filter(n=>n.status!=='rejected');
  const activeEdges=scoped.edges.filter(e=>e.status!=='rejected');
  const degree=id=>activeEdges.filter(e=>e.source===id||e.target===id).length;
  const outgoing=id=>activeEdges.filter(e=>e.source===id);
  const issues=[];

  for(const node of activeNodes){
    if(node.type==='note') continue;
    if(node.type!=='input' && degree(node.id)===0){
      issues.push({node,kind:'unlinked',message:'This reasoning move is floating without a connection.'});
      continue;
    }
    if(node.type==='goal') continue;
    if(outgoing(node.id).length) continue;

    const messages={
      input:'No interpretation or downstream reasoning is connected yet.',
      interpretation:'This interpretation has not been grounded or developed spatially yet.',
      grounding:'This grounding has not produced a spatial consequence yet.',
      consequence:'This spatial consequence has not been evaluated yet.',
      evaluation:'This evaluation has not been connected to a design goal yet.'
    };
    issues.push({node,kind:'open-end',message:messages[node.type]||'This line of reasoning currently stops here.'});
  }
  return issues;
}

function updateTraceCheck(){
  if(!els.traceCheckButton)return;
  const issues=traceIssues();
  els.traceCheckButton.textContent=issues.length?`Trace check · ${issues.length} open`:'Trace check · clear';
  els.traceCheckButton.classList.toggle('attention',issues.length>0);
}

function openTraceCheck(){
  const issues=traceIssues();
  const body=issues.length
    ? `<div class="trace-issue-list">${issues.map(i=>`<button class="trace-issue" data-trace-issue="${escapeHtml(i.node.id)}"><span>${escapeHtml(typeLabels[i.node.type]||i.node.type)}</span><strong>${escapeHtml(i.node.label)}</strong><small>${escapeHtml(i.message)}</small></button>`).join('')}</div>`
    : `<div class="trace-clear"><strong>No obvious loose ends in this selected trace.</strong><p>TRACEWORK is only checking continuity here, not whether the reasoning is correct.</p></div>`;
  openModal(`<h2 id="modalTitle">Trace check.</h2><p>These are prompts, not errors. A loose end may be intentional; this simply shows where reasoning currently stops or floats unconnected.</p>${body}<div class="modal-actions"><button class="primary-button compact" data-close-modal>Done</button></div>`,{
    onOpen:m=>m.querySelectorAll('[data-trace-issue]').forEach(b=>b.onclick=()=>{
      const id=b.dataset.traceIssue;
      closeModal();
      showView('workspace');
      selectNode(id);
      setTimeout(()=>focusNode(els.graphViewport,document.querySelector(`[data-id="${id}"]`),canvasZoom),60);
    })
  });
}

function zoomTo(next){
  canvasZoom=applyZoom(els.graphViewport,els.graphStage,els.graphSurface,next);
  updateZoomLabel();
}
function updateZoomLabel(){ const label=$('#zoomLabel'); if(label)label.textContent=`${Math.round(canvasZoom*100)}%`; }


function scopedTrace(state){
  const input=state.nodes.find(n=>n.type==='input'&&n.meta?.hotspotId===state.selectedHotspotId);
  if(!input)return {nodes:[],edges:[]};
  const loose=state.nodes.filter(n=>n.id!==input.id && n.meta?.hotspotId===state.selectedHotspotId);
  const ids=new Set([input.id,...loose.map(n=>n.id)]);
  const queue=[...ids];
  while(queue.length){
    const id=queue.shift();
    state.edges.filter(e=>e.source===id).forEach(e=>{ if(!ids.has(e.target)){ids.add(e.target);queue.push(e.target);} });
  }
  return {nodes:state.nodes.filter(n=>ids.has(n.id)),edges:state.edges.filter(e=>ids.has(e.source)&&ids.has(e.target))};
}
function currentBranches(state){
  const scoped=scopedTrace(state);
  return branchSummaries({...state,nodes:scoped.nodes.filter(n=>n.type!=='input'&&n.type!=='note')});
}

function projectNameFromBrief(brief){ const first=brief.split(/[.!?]/)[0].trim(); return first.length>54?`${first.slice(0,54)}…`:first; }
function escapeHtml(t=''){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

init();
