import { auditProject } from './core/project-audit.js';
import { supportedOptions, aggregateFormOptions, makePropositionSpec, renderPropositionSVG, propositionMarkdown } from './reasoning/architectural-propositions.js?v=d2.9-evidence-detail';
import { startSuggestions, nextSuggestions, compareFrameworkReadings, decisionDigest, decisionBrief } from './reasoning/framework-intelligence.js?v=d2.5-plain-language';
import { createMapSnapshot, exportMapSVG, exportMapPNG, exportMapPDF } from './graph/map-export.js?v=d2.2-architecture';
import { getState, resetState, replaceState, patchState, updateState, subscribe, logEvent } from './core/state.js';
import { saveProject, loadProject, listProjects, ensureProject, deleteProject, clearAllProjects, exportProject } from './core/storage.js';
import { loadOntology, typeLabels } from './core/ontology.js';
import { getFramework, provenanceOptions, inferLegacyProvenance, frameworkLegend, frameworkCategories, getFrameworkCategory, classifyFrameworkThought, canonicalTypeForFrameworkRole, frameworkRoleForNode } from './core/frameworks.js?v=d2.2';
import { createNode, createEdge } from './core/trace-model.js';
import { nodeGuidance } from './core/node-guidance.js';
import { evidenceKinds, generationActivities, inferredEvidenceKind, bridgePrompt, provenanceConnectionCheck } from './core/reasoning-transparency.js?v=d1-6-labels';
import { normaliseBrief } from './input/brief-parser.js';
import { chunkBrief, attachChunksToHotspots } from './input/brief-chunker.js';
import { readBriefFile } from './input/document-loader.js';
import { detectHotspots, normaliseHotspotSelection, repairHotspotRanges } from './input/hotspot-detector.js?v=c1.0';
import { classifyThought, setPilotRoleExamples } from './input/thought-classifier.js';
import { addInterpretation } from './reasoning/interpretation.js';
import { addGrounding } from './reasoning/grounding.js';
import { addConsequence } from './reasoning/consequences.js';
import { addEvaluation, addGoal } from './reasoning/evaluation.js';
import { createBranch, forkNext, nextNodeType, rejectBranch, restoreBranch, repairSharedInputs } from './reasoning/branching.js';
import { renderGraph } from './graph/graph-renderer.js?v=d2.9-artifact-halo';
import { applyZoom, fitGraph, focusNode, bindCanvasPan, bindWheelZoom } from './graph/graph-interactions.js';
import { connectionCheck } from './graph/connection-rules.js?v=d1-2';
import { explainConnectionPair } from './core/connection-explainer.js?v=d1-2';
import { loadPathways, searchPathways } from './evidence/pathway-bank.js';
import { loadCaseStudies } from './evidence/case-studies.js?v=c1.3';
import { loadPilotEvidence, transitionEvidence, transitionSummary } from './evidence/pilot-evidence.js';
import { branchSummaries, compareBranches } from './compare/pathway-compare.js';
import { renderBrief, renderLegend, toggleBriefEditor } from './ui/workspace.js?v=c1.0';
import { renderEmptyInspector, renderHotspotInspector, renderNodeInspector } from './ui/panels.js?v=d2.2';
import { renderTraceDashboard } from './ui/trace-panel.js';
import { openModal, closeModal } from './ui/modals.js?v=d1-7-refinement';
import { toast, coach, setSaveStatus } from './ui/notifications.js?v=d1-5-closable';
import { spatialReadModalMarkup, bindSpatialModal, detectSpatialTerms } from './reasoning/spatial-literacy.js?v=c2.3-recovery';
import { bindTutorialTriggers, maybeOpenFirstVisitTutorial, maybeOpenFrameworkTutorial, resetTutorialProgress } from './ui/tutorials.js?v=d2.5-plain-language';

const $ = s => document.querySelector(s);
const els = {};
let ontology = [];
let pathways = [];
let caseStudies = [];
let pilotEvidence = {pairs:{},source:{}};
let saveTimer = null;
let canvasZoom = 1;
let showHotspotSuggestions = true;
let hotspotViewMode = 'all';
let showNodeTypes = true;
let showWireSignals = true;
let landingBriefMode = 'quick';
let pendingBriefFileName = '';
let pendingBriefChunks = [];
let pendingActiveChunkId = null;
let lastAddedNodeId = null;
let selectedEdgeId = null;
let selectedNodeIds = new Set();
let traceIssueNodeIds = new Set();
let focusPathRootId = null;
let workspaceMapMode = 'focus';
let aggregateHotspotFilter = 'all';
let aggregateChunkFilter = 'all';
let aggregateTypeFilter = 'all';
let aggregateStatusFilter = 'all';
let aggregateArrangeSession = null;
let aggregateArrangeBlend = 0;
let focusArrangeMode = false;
let viewportSaveTimer = 0;
let viewportRestorePending = null;
// Separate, reversible canvas positions for each map. UI-only; does not change authored nodes.
let mapWorkspaceViews = {focus:null,aggregate:null};
function captureActiveMapView(){
  const s=getState(), vp=els.graphViewport;
  return {zoom:canvasZoom,left:vp?.scrollLeft||0,top:vp?.scrollTop||0,
    hotspotId:s.selectedHotspotId||null,focusRoot:focusPathRootId,
    arranged:workspaceMapMode==='focus'?focusArrangeMode:aggregateArrangeBlend===100};
}
function rememberActiveMapView(){
  if(!getState().brief||!els.graphViewport)return;
  mapWorkspaceViews[workspaceMapMode]=captureActiveMapView();
}
function applySavedMapView(view){
  if(!view)return false;
  canvasZoom=Math.max(.02,Math.min(1.6,Number(view.zoom)||1));
  updateZoomLabel();
  viewportRestorePending={left:Math.max(0,Number(view.left)||0),top:Math.max(0,Number(view.top)||0)};
  delete els.graphViewport.dataset.needsInitialPosition;
  return true;
}
function persistViewport(){
  const state=getState(),vp=els.graphViewport;
  if(!state.brief||!vp||els.app.classList.contains('hidden'))return;
  rememberActiveMapView();
  const snapshot={zoom:canvasZoom,left:vp.scrollLeft,top:vp.scrollTop,mapMode:workspaceMapMode,
    hotspotId:state.selectedHotspotId,focusRoot:focusPathRootId,focusArranged:focusArrangeMode,
    aggregateArranged:aggregateArrangeBlend===100,workspaceViews:mapWorkspaceViews};
  patchState({uiViewport:snapshot},{silent:true});
  clearTimeout(viewportSaveTimer);
  viewportSaveTimer=setTimeout(()=>saveProject(getState()),320);
}
function queueViewportSave(){
  clearTimeout(viewportSaveTimer);
  viewportSaveTimer=setTimeout(persistViewport,260);
}
function restoreSavedViewport(project){
  const v=project?.uiViewport;
  if(!v||!Number.isFinite(Number(v.zoom)))return false;
  workspaceMapMode=v.mapMode==='aggregate'?'aggregate':'focus';
  mapWorkspaceViews={focus:null,aggregate:null};
  for(const mode of ['focus','aggregate']){
    const entry=v.workspaceViews?.[mode];
    if(entry&&Number.isFinite(Number(entry.zoom)))mapWorkspaceViews[mode]={...entry};
  }
  // Backward-compatible restoration for projects saved before D2.6.
  if(!mapWorkspaceViews[workspaceMapMode])mapWorkspaceViews[workspaceMapMode]={zoom:v.zoom,left:v.left,top:v.top,hotspotId:v.hotspotId,focusRoot:v.focusRoot,arranged:workspaceMapMode==='focus'?v.focusArranged:v.aggregateArranged};
  const fv=mapWorkspaceViews.focus;
  focusPathRootId=project.nodes?.some(n=>n.id===(fv?.focusRoot||v.focusRoot))?(fv?.focusRoot||v.focusRoot):null;
  focusArrangeMode=Boolean(fv?.arranged??v.focusArranged);
  const arranged=Boolean(mapWorkspaceViews.aggregate?.arranged??v.aggregateArranged);
  if(arranged){
    const frameworkId=project.frameworkId||'tracework';
    aggregateArrangeSession={frameworkId,before:aggregateOriginalPositions(project),target:frameworkAggregateLayout(project,frameworkId)};
    aggregateArrangeBlend=100;
  }else{aggregateArrangeSession=null;aggregateArrangeBlend=0;}
  const active=mapWorkspaceViews[workspaceMapMode];
  canvasZoom=Math.max(.02,Math.min(1.6,Number(active.zoom)||1));
  viewportRestorePending={left:Math.max(0,Number(active.left)||0),top:Math.max(0,Number(active.top)||0)};
  if(active.hotspotId&&project.hotspots?.some(h=>h.id===active.hotspotId)) patchState({selectedHotspotId:active.hotspotId},{silent:true});
  return true;
}
const undoStack = [];
const MAX_UNDO = 30;
const projectMergeSelection=new Set();
// Independent UI-only panel state. Never deletes or modifies a saved trace.
const PANEL_PREF_KEY='tracework-panel-visibility-v1';
const panelVisibility={source:true,inspector:true};
function applyPanelVisibility(){
  const w=els.workspace;if(!w)return;
  w.classList.toggle('panel-source-closed',!panelVisibility.source);
  w.classList.toggle('panel-inspector-closed',!panelVisibility.inspector);
  for(const [side,id,label] of [['source','toggleSourcePanel','Brief'],['inspector','toggleInspectorPanel','Guidance']]){
    const btn=document.getElementById(id);if(!btn)continue;
    btn.setAttribute('aria-expanded',String(panelVisibility[side]));
    btn.setAttribute('aria-label',(panelVisibility[side]?'Hide ':'Show ')+label+' panel');
    btn.title=(panelVisibility[side]?'Hide ':'Show ')+label+' panel';
    btn.classList.toggle('is-collapsed',!panelVisibility[side]);
    // Reopening tabs only exist outside a panel after it has been hidden.
    btn.hidden=panelVisibility[side];
    const inline=document.getElementById(side==='source'?'collapseSourcePanel':'collapseInspectorPanel');
    if(inline) inline.setAttribute('aria-expanded',String(panelVisibility[side]));
  }
}
function togglePanelVisibility(side){
  if(!(side in panelVisibility))return;
  panelVisibility[side]=!panelVisibility[side];
  try{localStorage.setItem(PANEL_PREF_KEY,JSON.stringify(panelVisibility));}catch(_){}
  applyPanelVisibility();
}


async function init(){
  cacheEls();
  // Optional libraries are nonfatal: a missing reference file must never disable navigation.
  [ontology,pathways,caseStudies,pilotEvidence] = await Promise.all([
    loadOntology(),loadPathways(),loadCaseStudies(),loadPilotEvidence()
  ]);
  // C1.1: local, transparently coded P01–P10 node examples inform role matches.
  try{
    const examplesResponse=await fetch('./data/pilot-role-examples.json?v=C1.1');
    if(examplesResponse.ok)setPilotRoleExamples(await examplesResponse.json());
  }catch(error){ console.warn('Pilot role examples unavailable: rule-only classification remains active.',error); }
  try{const saved=JSON.parse(localStorage.getItem(PANEL_PREF_KEY)||'{}');for(const k of ['source','inspector'])if(typeof saved[k]==='boolean')panelVisibility[k]=saved[k];}catch(_){}
  applyPanelVisibility();
  renderLegend(frameworkLegend('tracework'));
  bindGlobalEvents();
  bindTutorialTriggers();
  updateUndoButton();
  bindCanvasPan(els.graphViewport);
  els.graphViewport.addEventListener('scroll',queueViewportSave,{passive:true});
  window.addEventListener('pagehide',()=>persistViewport());
  bindWheelZoom(els.graphViewport,{getZoom:()=>canvasZoom,setZoom:zoomTo,
    getSelectedNode:()=>{
      const id=[...selectedNodeIds][0]||getState().activeNodeId;
      return id?els.graphNodes?.querySelector(`[data-id="${CSS.escape(String(id))}"]`):null;
    }});
  // C2.5: new devices deliberately start empty. Existing browser projects remain untouched.
  // The two canonical examples are added only when the visitor clicks Try long + short examples.
  renderProjectShelf();
  renderEmptyInspector();
  const params=new URLSearchParams(window.location.search);
  if(params.get('resume')==='1'){
    const active=loadProject();
    if(active){
      repairSharedInputs(active);
      if(stripLegacyAggregateDemo(active)) saveProject(active);
      replaceState(active); enterApp(false);
    }
    history.replaceState(null,'',window.location.pathname);
  }
  subscribe(state => {
    if(!state.brief) return;
    setSaveStatus('Saving…',true);
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>{ saveProject(state); setSaveStatus('Saved locally',false); renderProjectShelf(); },220);
  });
  maybeOpenFirstVisitTutorial('welcome');
}

function ensureFrameworkLockButton(){
  let button=document.getElementById('frameworkLockButton');
  const select=document.getElementById('frameworkSelect');
  if(button || !select) return button;
  const wrap=select.closest('.framework-control-wrap') || select.parentElement?.parentElement;
  if(!wrap) return null;
  button=document.createElement('button');
  button.className='framework-lock-button';
  button.id='frameworkLockButton';
  button.type='button';
  button.setAttribute('aria-pressed','false');
  button.setAttribute('aria-label','Lock framework for this project');
  button.title="Lock this project's framework so it cannot be changed accidentally";
  button.innerHTML='<span class="framework-lock-glyph" aria-hidden="true"></span>';
  wrap.appendChild(button);
  return button;
}

function cacheEls(){
  ensureFrameworkLockButton();
  Object.assign(els,{
    landing:$('#landingView'),app:$('#appView'),workspace:$('#workspaceView'),pathways:$('#pathwaysView'),trace:$('#traceView'),discussion:$('#discussionView'),
    briefLanding:$('#landingBrief'),projectNameLanding:$('#landingProjectName'),briefEditor:$('#briefEditor'),briefFileInput:$('#briefFileInput'),briefFileStatus:$('#briefFileStatus'),briefChunkPreview:$('#briefChunkPreview'),documentBriefTools:$('#documentBriefTools'),hotspotViewSelect:$('#hotspotViewSelect'),graphViewport:$('#graphViewport'),graphStage:$('#graphStage'),graphSurface:$('#graphSurface'),graphNodes:$('#graphNodes'),graphEdges:$('#graphEdges'),canvasEmpty:$('#canvasEmpty'),
    thoughtDock:$('#thoughtDock'),freeThoughtInput:$('#freeThoughtInput'),thoughtTypeSelect:$('#thoughtTypeSelect'),thoughtReason:$('#thoughtReason'),thoughtMatches:$('#thoughtMatches'),addFreeThoughtButton:$('#addFreeThoughtButton'),addLooseNoteButton:$('#addLooseNoteButton'),toggleHotspotsButton:$('#toggleHotspotsButton'),traceCheckButton:$('#traceCheckButton'),toggleNodeTypesButton:$('#toggleNodeTypesButton'),toggleWireSignalsButton:$('#toggleWireSignalsButton'),undoButton:$('#undoButton'),findNodeButton:$('#findNodeButton'),focusPathButton:$('#focusPathButton'),focusMapModeButton:$('#focusMapModeButton'),aggregateMapModeButton:$('#aggregateMapModeButton'),aggregateControls:$('#aggregateControls'),aggregateHotspotFilter:$('#aggregateHotspotFilter'),aggregateChunkFilter:$('#aggregateChunkFilter'),aggregateTypeFilter:$('#aggregateTypeFilter'),aggregateStatusFilter:$('#aggregateStatusFilter'),resetAggregateFiltersButton:$('#resetAggregateFiltersButton'),arrangeAggregateButton:$('#arrangeAggregateButton'),originalAggregateButton:$('#originalAggregateButton'),reflowArrangeButton:$('#reflowArrangeButton'),frameworkSelect:$('#frameworkSelect'),frameworkLockButton:$('#frameworkLockButton'),workspaceTutorialButton:$('#workspaceTutorialButton'),thoughtReadingLabel:$('#thoughtReadingLabel'),thoughtProvenanceSelect:$('#thoughtProvenanceSelect'),thoughtGenerationActivity:$('#thoughtGenerationActivity'),thoughtEvidenceKind:$('#thoughtEvidenceKind'),thoughtAttributionName:$('#thoughtAttributionName'),thoughtActivityDetails:$('#thoughtActivityDetails'),thoughtRecordTitle:$('#thoughtRecordTitle'),thoughtSourceReference:$('#thoughtSourceReference')
  });
}

function bindGlobalEvents(){
  $('#toggleSourcePanel')?.addEventListener('click',()=>togglePanelVisibility('source'));
  $('#toggleInspectorPanel')?.addEventListener('click',()=>togglePanelVisibility('inspector'));
  $('#collapseSourcePanel')?.addEventListener('click',()=>togglePanelVisibility('source'));
  $('#collapseInspectorPanel')?.addEventListener('click',()=>togglePanelVisibility('inspector'));
  $('#loadDemoButton').onclick=async()=>{ const demo=await (await fetch('./data/demo-project.json')).json(); els.briefLanding.value=demo.brief; if(els.projectNameLanding)els.projectNameLanding.value=demo.projectName||'Flexible Pavilion — example'; pendingBriefFileName=''; pendingBriefChunks=landingBriefMode==='document'?chunkBrief(demo.brief):[]; pendingActiveChunkId=pendingBriefChunks[0]?.id||null; updateLandingChunkPreview(); els.briefLanding.focus(); };
  $('#restoreTestExamplesButton').onclick=restoreTestExamples;
  document.querySelectorAll('[data-brief-mode]').forEach(b=>b.onclick=()=>setLandingBriefMode(b.dataset.briefMode,{clear:true}));
  els.briefFileInput?.addEventListener('change',handleBriefFileUpload);
  els.briefLanding.addEventListener('input',()=>{ if(landingBriefMode==='document'){ pendingBriefChunks=chunkBrief(els.briefLanding.value); pendingActiveChunkId=pendingBriefChunks[0]?.id||null; updateLandingChunkPreview(); } });
  $('#startTracingButton').onclick=()=>startFromBrief(els.briefLanding.value,{mode:landingBriefMode,fileName:pendingBriefFileName,projectName:els.projectNameLanding?.value||'',chunks:landingBriefMode==='document'?pendingBriefChunks:null});
  $('#brandButton').onclick=()=>getState().brief?confirmReturnHome():showLanding();
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',e=>{ e.preventDefault(); showView(b.dataset.view); }));
  $('#newProjectButton').onclick=()=>getState().brief?confirmNewProject():els.briefLanding.focus();
  $('#aboutLink').onclick=e=>{ if(!getState().brief)return; e.preventDefault(); confirmLeaveForAbout(); };
  $('#editBriefButton').onclick=()=>toggleBriefEditor(true,getState());
  $('#cancelBriefEdit').onclick=()=>toggleBriefEditor(false,getState());
  $('#applyBriefEdit').onclick=()=>applyEditedBrief();
  $('#addPhraseButton').onclick=manualPhrase;
  els.toggleHotspotsButton.onclick=()=>{ showHotspotSuggestions=!showHotspotSuggestions; els.toggleHotspotsButton.textContent=showHotspotSuggestions?'Hide suggestions':'Show suggestions'; renderWorkspace(); };
  if(els.hotspotViewSelect) els.hotspotViewSelect.onchange=()=>{ hotspotViewMode=els.hotspotViewSelect.value||'all'; renderWorkspace(); };
  els.traceCheckButton.onclick=openTraceCheck;
  els.toggleNodeTypesButton.onclick=()=>{ showNodeTypes=!showNodeTypes; updateFrameworkControls(getState()); renderGraphState(); };
  if(els.toggleWireSignalsButton) els.toggleWireSignalsButton.onclick=()=>{ showWireSignals=!showWireSignals; els.toggleWireSignalsButton.textContent=showWireSignals?'Hide wire signals':'Show wire signals'; renderWorkspace(); };
  $('#branchButton').onclick=forkActive;
  $('#compareButton').onclick=openCompare;
  $('#reasoningToolsButton').onclick=()=>openReasoningTools();
  $('#architecturalPropositionButton').onclick=()=>openArchitecturalPropositions();
  $('#fitButton').onclick=()=>{ canvasZoom=fitGraph(els.graphViewport,els.graphStage,els.graphSurface); updateZoomLabel();queueViewportSave(); };
  $('#zoomOutButton').onclick=()=>zoomTo(canvasZoom-.1);
  $('#zoomInButton').onclick=()=>zoomTo(canvasZoom+.1);
  $('#pathwaySearch').addEventListener('input',e=>renderPathwayCards(e.target.value));
  $('#exportJsonButton').onclick=()=>{exportProject(getState());toast('Project exported.');};
  $('#exportMapButton').onclick=openMapExport;
  $('#exportMapTraceButton').onclick=()=>{showView('workspace');openMapExport();};
  $('#importJsonButton').onclick=()=>$('#importJsonFile').click();
  $('#importJsonFile').onchange=handleProjectImport;
  $('#projectAuditButton').onclick=openProjectAudit;
  $('#resetLocalDataButton').onclick=confirmResetLocalData;
  $('#addDiscussionButton').onclick=addDiscussionNote;
  els.freeThoughtInput.addEventListener('input',updateThoughtSuggestion);
  // Explicitly keep editing keys native inside the command line. The workspace
  // has global Delete/Ctrl+Z shortcuts, so this guard prevents a focused textarea
  // from ever deleting a node or consuming its own text undo/delete action.
  els.freeThoughtInput.addEventListener('keydown',e=>{
    if(['Backspace','Delete'].includes(e.key) || ((e.ctrlKey||e.metaKey) && ['z','y'].includes(e.key.toLowerCase()))) e.stopPropagation();
  });
  els.thoughtTypeSelect.addEventListener('change',()=>{ els.thoughtTypeSelect.dataset.manual='1'; updateThoughtSuggestion(); });
  if(els.thoughtProvenanceSelect) els.thoughtProvenanceSelect.addEventListener('change',updateThoughtSuggestion);
  els.addFreeThoughtButton.onclick=addFreeThought;
  els.addLooseNoteButton.onclick=addLooseNote;
  if(els.undoButton) els.undoButton.onclick=undoLast;
  if(els.findNodeButton) els.findNodeButton.onclick=openNodeSearch;
  if(els.focusPathButton) els.focusPathButton.onclick=togglePathFocus;
  if(els.focusMapModeButton) els.focusMapModeButton.onclick=()=>setWorkspaceMapMode('focus');
  if(els.aggregateMapModeButton) els.aggregateMapModeButton.onclick=()=>setWorkspaceMapMode('aggregate');
  if(els.frameworkSelect) els.frameworkSelect.onchange=()=>setFrameworkMode(els.frameworkSelect.value);
  if(els.frameworkLockButton) els.frameworkLockButton.onclick=toggleFrameworkLock;
  if(els.aggregateHotspotFilter) els.aggregateHotspotFilter.onchange=()=>{ aggregateHotspotFilter=els.aggregateHotspotFilter.value||'all'; focusPathRootId=null; selectedEdgeId=null; renderWorkspace(); };
  if(els.aggregateChunkFilter) els.aggregateChunkFilter.onchange=()=>{ aggregateChunkFilter=els.aggregateChunkFilter.value||'all'; focusPathRootId=null; selectedEdgeId=null; renderWorkspace(); };
  if(els.aggregateTypeFilter) els.aggregateTypeFilter.onchange=()=>{ aggregateTypeFilter=els.aggregateTypeFilter.value||'all'; focusPathRootId=null; selectedEdgeId=null; renderWorkspace(); };
  if(els.aggregateStatusFilter) els.aggregateStatusFilter.onchange=()=>{ aggregateStatusFilter=els.aggregateStatusFilter.value||'all'; focusPathRootId=null; selectedEdgeId=null; renderWorkspace(); };
  if(els.resetAggregateFiltersButton) els.resetAggregateFiltersButton.onclick=resetAggregateFilters;
  if(els.arrangeAggregateButton) els.arrangeAggregateButton.onclick=arrangeAggregateMap;
  if(els.originalAggregateButton) els.originalAggregateButton.onclick=()=>setAggregateLayout('original');
  if(els.reflowArrangeButton) els.reflowArrangeButton.onclick=reflowAggregateMap;
  document.addEventListener('keydown',handleWorkspaceKeydown,{capture:true});
  bindGlobalHelpPopovers();
  document.addEventListener('pointerdown',e=>{ if(!e.target.closest?.('.node-context-menu')) closeNodeContext(); if(!e.target.closest?.('.node-status-menu,.node-status')) document.getElementById('nodeStatusMenu')?.remove(); if(!e.target.closest?.('.node-type-menu,.node-type')) document.getElementById('nodeTypeMenu')?.remove(); });
  // D1.9: dismiss only the command bar's optional metadata drawer on an
  // intentional pointer press outside it. A selection drag that STARTS inside
  // can still finish outside without closing or losing input focus. Never
  // collapse the drawer in response to typing, framework changes or help.
  document.addEventListener('pointerdown',event=>{
    if(event.button !== 0 && event.pointerType === 'mouse') return;
    const details=els.thoughtDock?.querySelector('.thought-advanced-metadata');
    if(!details?.open || details.contains(event.target)) return;
    if(event.target.closest?.('.classification-help-popover')) return;
    details.open=false;
  }, {capture:true});
  els.graphViewport.addEventListener('click',e=>{
    if(e.target.closest?.('.graph-node,.trace-edge,.trace-edge-hit,.node-port,button,input,textarea,select,a'))return;
    clearNewNodeHalo(); selectedEdgeId=null; selectedNodeIds.clear();
    patchState({activeNodeId:null},{silent:true}); renderWorkspace();
  });
}

function setLandingBriefMode(mode='quick',{clear=false}={}){
  const next=mode==='document'?'document':'quick';
  const changed=next!==landingBriefMode;
  landingBriefMode=next;
  if(clear && changed){
    els.briefLanding.value='';
    pendingBriefFileName='';
    pendingBriefChunks=[];
    pendingActiveChunkId=null;
    if(els.briefFileInput)els.briefFileInput.value='';
    if(els.briefFileStatus)els.briefFileStatus.textContent='PDF, DOCX, TXT or MD · processed locally in your browser.';
  }
  document.querySelectorAll('[data-brief-mode]').forEach(b=>b.classList.toggle('active',b.dataset.briefMode===landingBriefMode));
  els.documentBriefTools?.classList.toggle('hidden',landingBriefMode!=='document');
  els.briefLanding.placeholder=landingBriefMode==='document'
    ? 'Paste a long brief here, or upload PDF, DOCX, TXT or MD…'
    : 'Paste a brief, requirement, design statement or project intention…';
  pendingBriefChunks=landingBriefMode==='document'?chunkBrief(els.briefLanding.value):[];
  pendingActiveChunkId=pendingBriefChunks[0]?.id||null;
  updateLandingChunkPreview();
  if(changed)els.briefLanding.focus();
}

async function handleBriefFileUpload(){
  const file=els.briefFileInput?.files?.[0];
  if(!file)return;
  pendingBriefFileName=file.name||'';
  if(els.briefFileStatus)els.briefFileStatus.textContent=`Reading ${pendingBriefFileName}…`;
  try{
    const text=normaliseBrief(await readBriefFile(file));
    if(!text)throw new Error('No readable text was found in that file.');
    els.briefLanding.value=text;
    pendingBriefChunks=chunkBrief(text);
    pendingActiveChunkId=pendingBriefChunks[0]?.id||null;
    if(els.briefFileStatus)els.briefFileStatus.textContent=`${pendingBriefFileName} · ${pendingBriefChunks.length} section${pendingBriefChunks.length===1?'':'s'} detected · processed locally`;
    updateLandingChunkPreview();
  }catch(err){
    pendingBriefChunks=[];
    if(els.briefFileStatus)els.briefFileStatus.textContent=`Could not read ${pendingBriefFileName}. ${err?.message||'Try pasting the brief instead.'}`;
    toast('Could not read that brief file. You can still paste the text directly.');
  }
}

function composeBriefChunks(chunks=[]){
  let brief='';
  const clean=[];
  chunks.forEach((chunk,index)=>{
    const text=normaliseBrief(chunk?.text||'');
    if(!text)return;
    if(brief)brief+='\n\n';
    const start=brief.length;
    brief+=text;
    clean.push({...chunk,id:chunk.id||`brief-chunk-${index+1}`,index:clean.length,title:String(chunk.title||`Section ${clean.length+1}`).trim()||`Section ${clean.length+1}`,start,end:start+text.length,text});
  });
  return {brief,chunks:clean};
}

function updateLandingChunkPreview(){
  if(!els.briefChunkPreview)return;
  const show=landingBriefMode==='document';
  els.briefChunkPreview.classList.toggle('hidden',!show);
  if(!show){els.briefChunkPreview.innerHTML='';return;}
  if(pendingActiveChunkId && !pendingBriefChunks.some(c=>c.id===pendingActiveChunkId)) pendingActiveChunkId=pendingBriefChunks[0]?.id||null;
  const active=pendingBriefChunks.find(c=>c.id===pendingActiveChunkId)||null;
  els.briefChunkPreview.innerHTML=`
    <div class="brief-chunk-preview-head"><div><strong>${pendingBriefChunks.length?`${pendingBriefChunks.length} brief section${pendingBriefChunks.length===1?'':'s'}`:'Build the brief as chunks'}</strong><span>${pendingBriefChunks.length?'Click any section to inspect or edit it before tracing.':'Useful when the source document has unclear or inconsistent headings.'}</span></div><button type="button" class="secondary-button mini" id="landingAddChunk">＋ Chunk</button></div>
    ${pendingBriefChunks.length?`<div class="brief-chunk-preview-list">${pendingBriefChunks.map((c,i)=>`<button type="button" class="landing-chunk-chip ${c.id===active?.id?'active':''}" data-landing-chunk="${escapeHtml(c.id)}">${i+1}. ${escapeHtml(c.title)}</button>`).join('')}</div>`:'<div class="landing-chunk-empty">Paste the full brief above for automatic filing, or add source chunks manually.</div>'}
    ${active?`<div class="landing-chunk-editor"><div class="landing-chunk-editor-head"><strong>Selected chunk</strong><span>Edits here stay inside this one project.</span></div><input id="landingChunkTitle" type="text" maxlength="70" value="${escapeHtml(active.title)}" placeholder="Chunk name"><textarea id="landingChunkText" rows="4" placeholder="Paste or write this source chunk…">${escapeHtml(active.text)}</textarea><div class="inline-actions"><button type="button" class="text-button mini" id="landingRemoveChunk">Remove</button><button type="button" class="primary-button compact" id="landingSaveChunk">Save chunk</button></div></div>`:''}`;
  els.briefChunkPreview.querySelectorAll('[data-landing-chunk]').forEach(b=>b.onclick=()=>{pendingActiveChunkId=b.dataset.landingChunk;updateLandingChunkPreview();});
  els.briefChunkPreview.querySelector('#landingAddChunk')?.addEventListener('click',()=>{
    const id=`landing-chunk-${Date.now()}`;
    pendingBriefChunks=[...pendingBriefChunks,{id,index:pendingBriefChunks.length,title:`Chunk ${pendingBriefChunks.length+1}`,start:0,end:0,text:'',manual:true}];
    pendingActiveChunkId=id;
    updateLandingChunkPreview();
    requestAnimationFrame(()=>els.briefChunkPreview.querySelector('#landingChunkTitle')?.select());
  });
  els.briefChunkPreview.querySelector('#landingSaveChunk')?.addEventListener('click',()=>{
    const title=els.briefChunkPreview.querySelector('#landingChunkTitle')?.value.trim()||`Chunk ${pendingBriefChunks.findIndex(c=>c.id===pendingActiveChunkId)+1}`;
    const text=normaliseBrief(els.briefChunkPreview.querySelector('#landingChunkText')?.value||'');
    if(!text){toast('Add some source text to this chunk first.');return;}
    pendingBriefChunks=pendingBriefChunks.map(c=>c.id===pendingActiveChunkId?{...c,title,text,manual:true}:c);
    const composed=composeBriefChunks(pendingBriefChunks);
    pendingBriefChunks=composed.chunks;
    els.briefLanding.value=composed.brief;
    updateLandingChunkPreview();
  });
  els.briefChunkPreview.querySelector('#landingRemoveChunk')?.addEventListener('click',()=>{
    pendingBriefChunks=pendingBriefChunks.filter(c=>c.id!==pendingActiveChunkId);
    pendingActiveChunkId=pendingBriefChunks[0]?.id||null;
    const composed=composeBriefChunks(pendingBriefChunks);
    pendingBriefChunks=composed.chunks;
    els.briefLanding.value=composed.brief;
    updateLandingChunkPreview();
  });
}

async function startFromBrief(raw,{mode=landingBriefMode,fileName=pendingBriefFileName,projectName='',chunks=null}={}){
  const provided=mode==='document' && Array.isArray(chunks) && chunks.some(c=>normaliseBrief(c?.text||''));
  const composed=provided?composeBriefChunks(chunks):null;
  const brief=normaliseBrief(composed?.brief||raw);
  if(!brief){toast('Paste, upload, or add at least one source chunk first.');return;}
  const useChunks=mode==='document' || brief.length>2600;
  const sourceChunks=useChunks?(provided?composed.chunks:chunkBrief(brief)):[];
  const detected=await detectHotspots(brief);
  const hotspots=attachChunksToHotspots(detected,sourceChunks);
  resetState();
  patchState({
    brief,
    briefMode:useChunks?'document':'quick',
    briefChunks:sourceChunks,
    activeBriefChunkId:sourceChunks[0]?.id||null,
    sourceFileName:fileName||'',
    hotspots,
    projectName:projectName.trim()||projectNameFromBrief(brief)
  });
  logEvent('Brief analysed',`${hotspots.length} interpretive hotspots surfaced${sourceChunks.length>1?` across ${sourceChunks.length} sections`:''}`);
  enterApp(true);
}

function enterApp(autoSelect=true){
  canvasZoom=1; selectedEdgeId=null; selectedNodeIds.clear(); traceIssueNodeIds.clear(); focusPathRootId=null; workspaceMapMode='focus'; focusArrangeMode=false; mapWorkspaceViews={focus:null,aggregate:null}; viewportRestorePending=null; aggregateArrangeSession=null; aggregateArrangeBlend=0; resetAggregateFilters({render:false}); undoStack.length=0; updateUndoButton(); updateZoomLabel();
  const entering=getState();
  if(entering.brief && entering.hotspots?.length){
    const repaired=attachChunksToHotspots(repairHotspotRanges(entering.brief,entering.hotspots),entering.briefChunks||[]);
    const changed=repaired.some((h,i)=>h.start!==entering.hotspots[i]?.start || h.end!==entering.hotspots[i]?.end || h.text!==entering.hotspots[i]?.text || h.chunkId!==entering.hotspots[i]?.chunkId);
    if(changed) patchState({hotspots:repaired},{silent:true});
  }
  const returning=restoreSavedViewport(getState());
  showNodeTypes=getState().frameworkId!=='freeform';
  if(!returning)els.graphViewport.dataset.needsInitialPosition='1';else delete els.graphViewport.dataset.needsInitialPosition;
  els.landing.classList.add('hidden'); els.app.classList.remove('hidden');
  applyPanelVisibility();
  showView('workspace');
  renderWorkspace();
  if(autoSelect && !returning && getState().hotspots.length) selectHotspot(getState().hotspots[0].id);
}

function showLanding(){
  persistViewport();
  closeNodeContext(); document.getElementById('traceCheckPopover')?.remove(); document.getElementById('nodeSearchPopover')?.remove(); document.getElementById('nodeStatusMenu')?.remove(); document.getElementById('nodeTypeMenu')?.remove(); traceIssueNodeIds.clear(); focusPathRootId=null; workspaceMapMode='focus';
  els.app.classList.add('hidden'); els.landing.classList.remove('hidden'); renderProjectShelf();
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view==='workspace'));
}


function showView(view){
  const allowed=new Set(['workspace','pathways','trace','discussion']);
  if(!allowed.has(view)) view='workspace';
  const hasProject=Boolean(getState().brief);

  if(view==='workspace' && !hasProject){ showLanding(); return; }

  els.landing.classList.add('hidden');
  els.app.classList.remove('hidden');
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
  else if(view==='pathways') hasProject?renderPathwayCards($('#pathwaySearch')?.value||''):renderPathwayBlank();
  else if(view==='trace') hasProject?renderTraceDashboard(getState()):renderSavedTraceLibrary();
  else if(view==='discussion') hasProject?renderDiscussion():renderDiscussionBlank();

  // These actions require an open project. Import remains accessible in
  // My Trace even if all projects have been deleted or the browser is new.
  document.querySelectorAll('[data-requires-project]').forEach(button=>{
    button.classList.toggle('hidden',!hasProject);
    button.disabled=!hasProject;
  });
  const composer=$('#discussionComposerCard');
  if(composer)composer.classList.toggle('hidden',!hasProject);
  window.scrollTo({top:0,behavior:'auto'});
}

function renderWorkspace(){
  const state=getState();
  renderBrief(state,{onHotspot:selectHotspot,onEditHotspot:editHotspot,onDeleteHotspot:deleteHotspot,onChunk:selectBriefChunk,onAddChunk:addBriefChunk,onEditChunk:editBriefChunk},{showSuggestions:showHotspotSuggestions,hotspotFilter:hotspotViewMode});
  updateMapModeControls(state);
  updateFrameworkControls(state);
  if(workspaceMapMode==='aggregate') updateAggregateControls(state);

  const visibleTrace=workspaceTrace(state);
  const hasNodes=visibleTrace.nodes.length>0;
  els.canvasEmpty.classList.toggle('hidden',hasNodes);
  els.graphViewport.classList.toggle('hidden',!hasNodes);

  const scopedBranches=currentBranches(state);
  if(workspaceMapMode==='aggregate'){
    const mapCount=new Set(state.nodes.map(n=>n.meta?.hotspotId).filter(Boolean)).size;
    $('#branchCount').textContent=`${visibleTrace.nodes.length} nodes · ${mapCount} ${mapCount===1?'map':'maps'}`;
    $('#canvasTitle').textContent='Project reasoning — Aggregate map';
  }else{
    $('#branchCount').textContent=`${scopedBranches.length || 1} ${(scopedBranches.length || 1)===1?'path':'paths'}`;
    $('#canvasTitle').textContent=state.selectedHotspotId ? `Tracing “${state.hotspots.find(h=>h.id===state.selectedHotspotId)?.text || 'language'}”` : 'Your trace';
  }

  updateTraceCheck();
  if(hasNodes)renderGraphState();
  const activeCandidate=state.nodes.find(n=>n.id===state.activeNodeId);
  const active=activeCandidate && visibleTrace.nodes.some(n=>n.id===activeCandidate.id)?activeCandidate:null;
  $('#branchButton').disabled=workspaceMapMode==='aggregate' || !active || active.type==='goal' || active.type==='note' || active.status==='rejected';
  $('#compareButton').disabled=workspaceMapMode==='aggregate' || scopedBranches.length<2;
  if(els.focusPathButton){
    const base=workspaceTrace(state);
    const focusAvailable=Boolean(active && base.nodes.some(n=>n.id===active.id));
    els.focusPathButton.disabled=!focusPathRootId && !focusAvailable;
    els.focusPathButton.textContent=focusPathRootId?'◎ Show all':'◎ Focus path';
    els.focusPathButton.classList.toggle('active',Boolean(focusPathRootId));
    els.focusPathButton.title=focusPathRootId?'Restore the full visible reasoning field':'Isolate the ancestors and descendants of the selected node';
  }
  const thoughtDockAvailable=workspaceMapMode==='aggregate' || Boolean(state.selectedHotspotId);
  els.thoughtDock.classList.toggle('hidden',!thoughtDockAvailable);
  if(thoughtDockAvailable) updateThoughtSuggestion();
  const wireLegend=document.getElementById('wireLegend');
  if(wireLegend){wireLegend.hidden=!selectedEdgeId;if(!selectedEdgeId)wireLegend.open=false;}
  if(selectedEdgeId) renderConnectionInspector(selectedEdgeId);
  else if(active) renderNodeInspector(active,state,nodeHandlers());
  else if(workspaceMapMode==='focus' && state.selectedHotspotId){ const h=state.hotspots.find(x=>x.id===state.selectedHotspotId); if(h)renderHotspotInspector(h,state,hotspotHandlers()); }
  else renderEmptyInspector();
}

function renderGraphState(){
  const state=getState();
  const baseScoped=workspaceTrace(state);
  if(focusPathRootId && !baseScoped.nodes.some(n=>n.id===focusPathRootId)) focusPathRootId=null;
  const pathScoped=focusPathRootId?focusTraceAround(baseScoped,focusPathRootId):baseScoped;
  const scoped=workspaceMapMode==='focus'&&focusPathRootId?focusArrangedTrace(state,pathScoped):pathScoped;
  els.graphSurface?.classList.toggle('aggregate-map',workspaceMapMode==='aggregate');
  renderGraph({...state,nodes:scoped.nodes,edges:scoped.edges},{surface:els.graphSurface,svg:els.graphEdges,nodes:els.graphNodes},{
    onNodeClick:(id,e)=>selectNode(id,e),
    onNodeDoubleClick:id=>{ const node=getState().nodes.find(n=>n.id===id); if(node?.meta?.artifactKind)openSavedArtifact(node);else if(node)editNode(node); },
    onNodePreviewToggle:id=>{const node=getState().nodes.find(n=>n.id===id);if(node?.meta?.artifactKind)openSavedArtifact(node);else showSpatialReadForNode(id);},
    onNodeQuickLink:id=>openNodeQuickLink(id),
    onNodeCaseStudy:id=>showNodeCaseStudy(id),
    onEdgeClick:id=>selectEdge(id),
    onEdgeQuickDisconnect:id=>disconnectEdge(id),
    onNodeContext:(id,e)=>openNodeContext(id,e.clientX,e.clientY),
    onNodeStatusClick:(id,e)=>openNodeStatusMenu(id,e.clientX,e.clientY),
    onNodeTypeClick:(id,e)=>openNodeTypeMenu(id,e.clientX,e.clientY),
    onConnect:(source,target,result)=>connectNodes(source,target,result),
    canConnect:(source,target,edges)=>({...connectionCheck(source,target,edges,pilotEvidence,{frameworkId:getState().frameworkId}),provenanceGap:provenanceConnectionCheck(source,target)}),
    onNodeDragStart:ids=>{
      // Capture the snapshot before any pointer movement mutates the rendered
      // positions. One drag gesture = one undo step, including groups/selections.
      checkpoint((ids||[]).length>1?'move selected reasoning nodes':'move reasoning node');
    },
    onNodeMove:(id,x,y)=>{
      // Stage C: Source positions travel FORWARD into Arrange, never backwards.
      // Edits in Arrange are presentation-only and cannot change Original or Focus.
      const state=getState();
      const node=state.nodes.find(n=>n.id===id);
      if(!node)return;
      const isFocusArranged=workspaceMapMode==='focus' && focusArrangeMode;
      const isArranged=workspaceMapMode==='aggregate' && aggregateArrangeBlend===100;
      const current=isFocusArranged ? ((focusPathRootId?focusArrangedTrace(state,focusTraceAround(workspaceTrace(state),focusPathRootId)):workspaceTrace(state)).nodes.find(n=>n.id===id)||node)
        : isArranged
        ? aggregateArrangeSession?.target.get(id)||frameworkAggregateLayout(state,state.frameworkId||'tracework').get(id)
        : workspaceMapMode==='aggregate'
          ? aggregateOriginalPositions(state).get(id)
          : {x:Number(node.x)||0,y:Number(node.y)||0};
      if(!current)return;
      const dx=x-current.x,dy=y-current.y;
      if(!Number.isFinite(dx)||!Number.isFinite(dy)||(!dx&&!dy))return;
      if(isFocusArranged){
        const key=focusArrangementKey(state);
        const target={x:current.x+dx,y:current.y+dy};
        updateState(st=>{const n=st.nodes.find(item=>item.id===id);if(!n)return;
          n.meta={...(n.meta||{}),focusArrangedPositions:{...(n.meta?.focusArrangedPositions||{}),[key]:target}};
        });
        return;
      }
      if(isArranged){
        const frameworkId=state.frameworkId||'tracework';
        const target={x:current.x+dx,y:current.y+dy};
        // Persist independently of Original and Focus; survives refresh/framework switching.
        updateState(st=>{
          const n=st.nodes.find(item=>item.id===id);if(!n)return;
          n.meta={...(n.meta||{}),aggregateArrangedPositions:{...(n.meta?.aggregateArrangedPositions||{}),[frameworkId]:target}};
        });
        if(aggregateArrangeSession)aggregateArrangeSession.target.set(id,target);
        return;
      }
      const original=aggregateOriginalPositions(state).get(id)||{x:Number(node.x)||0,y:Number(node.y)||0};
      updateState(st=>{
        const n=st.nodes.find(item=>item.id===id);if(!n)return;
        n.x=(Number(n.x)||0)+dx;n.y=(Number(n.y)||0)+dy;
        const meta=n.meta={...(n.meta||{})};
        meta.aggregateOriginalPosition={x:original.x+dx,y:original.y+dy};
        // Existing user-arranged layouts follow a source edit by the same displacement.
        // A subsequent Arrange operation may still use the active framework's layout.
        if(meta.aggregateArrangedPositions){
          const updated={...meta.aggregateArrangedPositions};
          Object.entries(updated).forEach(([framework,pos])=>{
            if(pos&&Number.isFinite(Number(pos.x))&&Number.isFinite(Number(pos.y)))
              updated[framework]={x:Number(pos.x)+dx,y:Number(pos.y)+dy};
          });
          meta.aggregateArrangedPositions=updated;
        }
      });
      if(aggregateArrangeSession){
        for(const map of [aggregateArrangeSession.before,aggregateArrangeSession.target]){
          const p=map.get(id);if(p)map.set(id,{x:p.x+dx,y:p.y+dy});
        }
      }
    },
    getScale:()=>canvasZoom,
    selectedEdgeId,
    selectedNodeIds:[...selectedNodeIds],
    issueNodeIds:[...traceIssueNodeIds],
    showNodeTypes,
    showWireSignals,
    pilotEvidence,
    frameworkId:state.frameworkId||'tracework'
  });
  applyZoom(els.graphViewport,els.graphStage,els.graphSurface,canvasZoom,{preserveCenter:false});
  if(viewportRestorePending){
    const v=viewportRestorePending;viewportRestorePending=null;
    requestAnimationFrame(()=>{els.graphViewport.scrollLeft=v.left;els.graphViewport.scrollTop=v.top;});
  }
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

function selectBriefChunk(id){
  const state=getState();
  if(!state.briefChunks?.some(c=>c.id===id))return;
  patchState({activeBriefChunkId:id,selectedHotspotId:null,activeNodeId:null},{silent:true});
  selectedNodeIds.clear(); selectedEdgeId=null; traceIssueNodeIds.clear(); focusPathRootId=null;
  renderWorkspace();
}

async function addBriefChunk({title,text}={}){
  const value=normaliseBrief(text||'');
  if(!value){ toast('Write or paste something into the new chunk first.'); return; }
  const state=getState();
  const chunkTitle=String(title||'').trim()||`Chunk ${(state.briefChunks?.length||0)+1}`;
  const separator=state.brief?'\n\n':'';
  const start=(state.brief||'').length+separator.length;
  const id=`brief-chunk-manual-${Date.now()}`;
  const chunk={id,index:state.briefChunks?.length||0,title:chunkTitle,start,end:start+value.length,text:value,manual:true};
  const detected=await detectHotspots(value);
  const hotspots=detected.map(h=>({...h,id:`${h.id||'hotspot'}-manual-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,start:start+(h.start||0),end:start+(h.end||0),chunkId:id}));
  checkpoint('add source chunk');
  updateState(s=>{
    s.brief=`${s.brief||''}${separator}${value}`;
    s.briefMode='document';
    s.briefChunks=[...(s.briefChunks||[]),chunk];
    s.activeBriefChunkId=id;
    s.hotspots=[...(s.hotspots||[]),...hotspots];
    s.selectedHotspotId=null;
    s.activeNodeId=null;
  });
  selectedNodeIds.clear(); selectedEdgeId=null; traceIssueNodeIds.clear();
  logEvent('Source chunk added',`${chunkTitle} · ${hotspots.length} hotspots`);
  renderWorkspace();
  toast(`Added “${chunkTitle}” as a new brief chunk.`);
}

async function editBriefChunk({id,title,text}={}){
  const state=getState();
  const target=state.briefChunks?.find(c=>c.id===id); if(!target)return;
  const value=normaliseBrief(text||'');
  if(!value){ toast('A source chunk cannot be empty.'); return; }
  const revised=(state.briefChunks||[]).map(c=>c.id===id?{...c,title:String(title||c.title||'Section').trim(),text:value,manual:true}:{...c});
  const composed=composeBriefChunks(revised);
  const detected=attachChunksToHotspots(await detectHotspots(composed.brief),composed.chunks);
  checkpoint('edit source chunk');
  updateState(s=>{
    s.brief=composed.brief;
    s.briefChunks=composed.chunks;
    s.activeBriefChunkId=id;
    s.hotspots=detected;
    s.selectedHotspotId=null;
  });
  selectedEdgeId=null; selectedNodeIds.clear(); traceIssueNodeIds.clear(); focusPathRootId=null;
  logEvent('Source chunk revised',composed.chunks.find(c=>c.id===id)?.title||'Brief section');
  renderWorkspace();
  toast('Chunk updated and hotspots re-analysed. Existing reasoning nodes remain as trace history.');
}

async function selectHotspot(id){
  workspaceMapMode='focus';
  focusPathRootId=null;
  const state=getState(), hotspot=state.hotspots.find(h=>h.id===id); if(!hotspot)return;
  let input=state.nodes.find(n=>n.type==='input'&&n.meta?.hotspotId===id);
  updateState(s=>{
    s.selectedHotspotId=id;
    if(hotspot.chunkId) s.activeBriefChunkId=hotspot.chunkId;
    if(!input){
      input=createNode({type:'input',label:hotspot.text,branchId:`trace-${id}`,meta:{hotspotId:id,source:'brief',provenance:'brief'}});
      s.nodes.push(input); s.activeBranchId=input.branchId;
    }
    s.activeNodeId=input.id;
  });
  logEvent('Language selected',hotspot.text);
  renderWorkspace();
  const latest=getState().nodes.find(n=>n.type==='input'&&n.meta?.hotspotId===id);
  await renderHotspotInspector(hotspot,getState(),hotspotHandlers(latest?.id));
  setTimeout(()=>focusNode(els.graphViewport,document.querySelector(`[data-id="${latest?.id}"]`),canvasZoom),80);
}


// B2.1 · edit the actual source selection, without resetting its reasoning map.
// A hotspot remains an exact quotation from the brief; arbitrary renames would
// create a highlight that cannot be anchored to the source.
function editHotspot(id){
  const state=getState(),hotspot=state.hotspots.find(h=>h.id===id);
  if(!hotspot)return;
  const chunk=state.briefChunks?.find(c=>c.id===hotspot.chunkId) ||
    state.briefChunks?.find(c=>Number(hotspot.start)>=Number(c.start)&&Number(hotspot.start)<Number(c.end)) || null;
  const source=chunk?.text||state.brief||'';
  const baseOffset=chunk ? (()=>{
    const hint=Number(chunk.start)||0;
    const match=state.brief.indexOf(chunk.text,Math.max(0,hint-16));
    return match>=0 ? match : hint;
  })() : 0;
  const original=String(hotspot.text||'');
  const idx=source.toLocaleLowerCase().indexOf(original.toLocaleLowerCase());
  openModal(`<h2 id="modalTitle">Edit hotspot</h2>
    <p>Edit the wording or <strong>drag to select words in the passage below</strong>. The revised hotspot must quote the source brief (not invent new wording). Your linked reasoning stays attached.</p>
    <label class="hotspot-edit-label" for="hotspotEditInput">Selected phrase</label>
    <input class="field-input" id="hotspotEditInput" value="${escapeHtml(original)}" autocomplete="off" spellcheck="false">
    <div class="hotspot-edit-feedback" id="hotspotEditFeedback" role="status">The phrase must appear in the current brief section.</div>
    <div class="hotspot-edit-source-caption">Or drag over the exact words below, then press Save:</div>
    <div class="selection-brief hotspot-edit-source" id="hotspotEditSource" tabindex="0" aria-label="Drag to select alternative words in the brief">${escapeHtml(source)}</div>
    <div class="modal-actions"><button type="button" class="secondary-button" id="cancelHotspotEdit" data-close-modal>Cancel</button><button type="button" class="primary-button compact" id="saveHotspotEdit">Save selection</button></div>`,{
      onOpen:m=>{
        const input=m.querySelector('#hotspotEditInput'), feedback=m.querySelector('#hotspotEditFeedback');
        const passage=m.querySelector('#hotspotEditSource'), save=m.querySelector('#saveHotspotEdit');
        // Offset anchoring handles repeated words by preferring the previous position.
        // B2.2: match words across source line breaks / repeated spaces.
        const locate=()=>{
          const wanted=input.value.trim().replace(/\s+/g,' ');
          if(!wanted)return null;
          const escaped=wanted.split(' ').map(token=>token.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')).join('\\s+');
          let matcher;
          try{matcher=new RegExp(escaped,'giu');}catch{return null;}
          const hits=[],expected=Math.max(0,(Number(hotspot.start)||0)-baseOffset);
          for(const match of source.matchAll(matcher)){
            if(match.index==null || !match[0])continue;
            const snapped=normaliseHotspotSelection(source,match.index,match.index+match[0].length);
            if(snapped.text)hits.push(snapped);
          }
          return hits.sort((a,b)=>Math.abs(a.start-expected)-Math.abs(b.start-expected))[0]||null;
        };
        const check=()=>{
          const found=locate();
          const duplicate=found && getState().hotspots.some(h=>h.id!==id &&
            (Number(h.start)||0)===baseOffset+found.start && (Number(h.end)||0)===baseOffset+found.end);
          save.disabled=!found||Boolean(duplicate);
          feedback.textContent=duplicate?'Already selected elsewhere. Choose different words or edit that hotspot.':
            found?'Ready to save · '+found.text+' · linked reasoning stays attached.':
            'Cannot save yet: select words from the passage or type wording found in this section. Spaces and line breaks are accepted.';
          return found;
        };
        input.addEventListener('input',check);
        const readSelection=()=>{
          const sel=window.getSelection();
          if(!sel || sel.rangeCount===0 || sel.isCollapsed)return;
          const range=sel.getRangeAt(0);
          if(!passage.contains(range.commonAncestorContainer))return;
          const start=textOffsetWithin(passage,range.startContainer,range.startOffset);
          const end=textOffsetWithin(passage,range.endContainer,range.endOffset);
          const snapped=normaliseHotspotSelection(source,start,end);
          if(snapped.text){input.value=snapped.text;check();}
        };
        passage.addEventListener('mouseup',()=>setTimeout(readSelection,0));
        passage.addEventListener('keyup',()=>setTimeout(readSelection,0));
        save.onclick=()=>{
          const found=check();if(!found)return;
          const editedText=found.text;
          if(editedText===hotspot.text && baseOffset+found.start===hotspot.start){closeModal();return;}
          checkpoint('edit hotspot selection');
          updateState(s=>{
            const target=s.hotspots.find(h=>h.id===id);
            if(!target)return;
            Object.assign(target,{text:editedText,start:baseOffset+found.start,end:baseOffset+found.end,
              chunkId:chunk?.id||target.chunkId||null,
              kind:/\s/.test(editedText)?'phrase':'word',edited:true,concept:'custom',source:'designer',
              reason:'Source selection revised by designer'});
            // Keep the same source node ID, wires, interpretations and branches.
            s.nodes.filter(n=>n.type==='input'&&n.meta?.hotspotId===id).forEach(n=>n.label=editedText);
          });
          logEvent('Hotspot selection revised',`${original} → ${editedText}`);
          closeModal();renderWorkspace();toast('Hotspot updated. Linked reasoning preserved; press Ctrl+Z or use Undo to restore the previous phrase.');
        };
        check();input.focus();input.select();
      }
    });
}

function deleteHotspot(id){
  const state=getState(),hotspot=state.hotspots.find(h=>h.id===id);
  if(!hotspot)return;
  const inputs=state.nodes.filter(n=>n.type==='input'&&n.meta?.hotspotId===id);
  const downstream=state.edges.filter(e=>inputs.some(n=>n.id===e.source||n.id===e.target)).length;
  if(!window.confirm(`Delete hotspot “${hotspot.text}”?${inputs.length?` Its ${inputs.length} source node(s) will also be removed.`:''}${downstream?' Connected reasoning nodes will remain, but their wires to this source will be disconnected.':''} You can undo this with Ctrl+Z.`))return;
  checkpoint('delete hotspot');
  const removed=new Set(inputs.map(n=>n.id));
  updateState(s=>{
    s.hotspots=s.hotspots.filter(h=>h.id!==id);
    s.nodes=s.nodes.filter(n=>!removed.has(n.id));
    s.edges=s.edges.filter(e=>!removed.has(e.source)&&!removed.has(e.target));
    if(s.selectedHotspotId===id)s.selectedHotspotId=null;
    if(removed.has(s.activeNodeId))s.activeNodeId=null;
  });
  selectedNodeIds.clear();selectedEdgeId=null;
  renderWorkspace();toast('Hotspot deleted. Ctrl+Z restores it.');
}

function hotspotHandlers(inputNodeId=null){
  const resolveInput=()=>inputNodeId || getState().activeNodeId || getState().nodes.find(n=>n.type==='input'&&n.meta?.hotspotId===getState().selectedHotspotId)?.id || null;
  return {
    onEditHotspot:id=>editHotspot(id),
    onInterpretation:(text,prompt)=>addHotspotInterpretation(text,prompt,resolveInput()),
    onFrameworkNext:(text,roleId,extra)=>addFrameworkGuidedStep(resolveInput(),text,roleId,extra),
    onRelatedPath:id=>inspectPathway(pathways.find(p=>p.id===id)),
    onCaseStudy:id=>inspectCaseStudy(id)
  };
}

function addHotspotInterpretation(text,prompt,inputNodeId){
  const value=String(text||'').trim();
  if(!value)return;
  checkpoint('add guided interpretation');
  let created=null;
  const fallback=visibleCanvasPlacement(getState().nodes.length+1);
  updateState(s=>{
    const input=s.nodes.find(n=>n.id===inputNodeId);
    const baseX=Number.isFinite(Number(input?.x))?Number(input.x):fallback.x;
    const baseY=Number.isFinite(Number(input?.y))?Number(input.y):fallback.y;
    created=createNode({type:'interpretation',label:value,branchId:input?.branchId||s.activeBranchId,x:baseX+270,y:baseY,meta:{guided:true,sourcePrompt:prompt?.question||'',provenance:'designer',hotspotId:input?.meta?.hotspotId||s.selectedHotspotId}});
    s.nodes.push(created);
    // Guided source responses are intentionally left unwired. The designer decides
    // whether the source language should connect to this reading.
    if(input?.id) s.edges=s.edges.filter(e=>!((e.source===input.id&&e.target===created.id)||(e.target===input.id&&e.source===created.id)));
    s.activeNodeId=created.id;
    s.activeBranchId=created.branchId;
  });
  lastAddedNodeId=created?.id||null;
  if(created?.id){selectedNodeIds.clear();selectedNodeIds.add(created.id);selectedEdgeId=null;}
  logEvent('Interpretation added',value);
  renderWorkspace();
  if(created)toast('Interpretation added beside the source. Connect it manually when that relationship is intentional.');
}

function addFrameworkGuidedStep(parentId,text,roleId,extra={}){
  const value=String(text||'').trim();
  if(!value||!parentId)return;
  const frameworkId=getState().frameworkId||'tracework';
  const framework=getFramework(frameworkId);
  if(framework.id==='tracework'||framework.id==='freeform')return;
  const role=getFrameworkCategory(frameworkId,roleId);
  if(!role)return;
  checkpoint(`add ${framework.shortLabel} guided step`);
  let created=null;
  let autoLinked=false;
  const fallback=visibleCanvasPlacement(getState().nodes.length+1);
  updateState(s=>{
    const parent=s.nodes.find(n=>n.id===parentId);
    if(!parent)return;
    const type=canonicalTypeForFrameworkRole(frameworkId,roleId,'interpretation');
    const baseX=Number.isFinite(Number(parent.x))?Number(parent.x):fallback.x;
    const baseY=Number.isFinite(Number(parent.y))?Number(parent.y):fallback.y;
    const direction=extra?.direction==='backward'?-1:1;
    created=createNode({type,label:value,branchId:parent.branchId||s.activeBranchId,x:baseX+(285*direction),y:baseY+18,meta:{guided:true,frameworkGuided:true,hotspotId:parent.meta?.hotspotId||s.selectedHotspotId,provenance:'designer',sourcePrompt:extra?.question||'',promptDirection:extra?.direction||'forward',frameworkRoles:{[frameworkId]:roleId}}});
    s.nodes.push(created);
    const sourceLike=parent.type==='input'||parent.meta?.source==='brief';
    if(!sourceLike){
      const sourceId=extra?.direction==='backward'?created.id:parent.id;
      const targetId=extra?.direction==='backward'?parent.id:created.id;
      s.edges.push(createEdge(sourceId,targetId));
      autoLinked=true;
    }else{
      // Source / hotspot responses must never be wired automatically. This is
      // deliberately defensive so legacy helpers cannot recreate the edge.
      s.edges=s.edges.filter(e=>!((e.source===parent.id&&e.target===created.id)||(e.target===parent.id&&e.source===created.id)));
    }
    s.activeNodeId=created.id;
    s.activeBranchId=created.branchId;
  });
  lastAddedNodeId=created?.id||null;
  if(created?.id){selectedNodeIds.clear();selectedNodeIds.add(created.id);selectedEdgeId=null;}
  logEvent(`${framework.shortLabel} guided step`,`${role.label} · ${value}`);
  renderWorkspace();
  if(created)toast(autoLinked?`${role.label} added through ${framework.shortLabel}.`:`${role.label} added beside the source. Connect it manually if that relationship is intended.`);
}

function selectNode(id,event){
  clearNewNodeHalo(); selectedEdgeId=null;
  if(event?.shiftKey){
    if(selectedNodeIds.has(id)) selectedNodeIds.delete(id); else selectedNodeIds.add(id);
    const active=selectedNodeIds.has(id)?id:([...[...selectedNodeIds]].pop()||null);
    patchState({activeNodeId:active},{silent:true});
  }else{
    selectedNodeIds.clear(); selectedNodeIds.add(id);
    patchState({activeNodeId:id},{silent:true});
  }
  renderWorkspace();
}
function selectEdge(id){
  // Selection is non-modal: let the designer inspect a relationship while
  // keeping the entire reasoning map visible and interactive.
  clearNewNodeHalo();
  if(selectedEdgeId===id){ selectedEdgeId=null; }
  else { selectedEdgeId=id; selectedNodeIds.clear(); }
  renderWorkspace();
}

function renderConnectionInspector(id){
  const state=getState();
  const edge=state.edges.find(item=>item.id===id);
  const source=edge&&state.nodes.find(n=>n.id===edge.source);
  const target=edge&&state.nodes.find(n=>n.id===edge.target);
  if(!edge||!source||!target){selectedEdgeId=null;renderEmptyInspector();return;}
  // Cancel outstanding async node/precedent renders before replacing the inspector.
  renderEmptyInspector();
  const explanation=explainConnectionPair(source,target);
  const provenanceGap=provenanceConnectionCheck(source,target);
  const provenanceMarkup=provenanceGap.flagged
    ? `<details class="inspector-section provenance-gap-guidance" open><summary>⚠ Provenance Gap · Verify the source</summary><p>${escapeHtml(provenanceGap.reason)}</p><p><strong>What to check:</strong> ${escapeHtml(provenanceGap.next)}</p><small>This is an attribution warning, not a rejection of the reasoning connection. Review node provenance, evidence type and source citations using Edit.</small></details>`
    : `<details class="inspector-section provenance-gap-guidance"><summary>Provenance Check · No mismatch detected</summary><p>${escapeHtml(provenanceGap.reason)}</p><small>A valid source attribution does not prove the reasoning claim. Record evidence for consequential decisions when available.</small></details>`;
  const status=(edge.status==='rejected'||source.status==='rejected'||target.status==='rejected')?'Rejected':
    (edge.status==='provisional'||source.meta?.provisional||target.meta?.provisional)?'Provisional':'Active';
  const root=document.getElementById('inspectorContent');
  root.dataset.inspectorKey=`wire:${id}`;
  root.innerHTML=`<div class="inspector-head connection-inspector-head"><span class="inspector-type">Selected Connection · ${escapeHtml(status)}</span><h3>Reasoning Relationship</h3><p>Click another node or wire to continue tracing. No pop-up interrupts the map.</p></div>
    <div class="inspector-section connection-ends"><span class="field-label">FROM · ${escapeHtml(typeLabels[source.type]||source.type)}</span><p>${escapeHtml(source.label)}</p><span class="connection-arrow" aria-hidden="true">↓ develops or informs ↓</span><span class="field-label">TO · ${escapeHtml(typeLabels[target.type]||target.type)}</span><p>${escapeHtml(target.label)}</p></div>
    <details class="inspector-section connection-inspector-guidance"><summary>Explain This · Why might these thoughts connect?</summary><p>${escapeHtml(explanation.reason)}</p><p><strong>What could be tested next?</strong> ${escapeHtml(explanation.next)}</p><small>This is a context-sensitive question about the actual node text, not proof that the connection is correct or that any omitted reasoning occurred.</small></details>
    ${provenanceMarkup}
    <div class="inspector-section"><p class="trace-provenance-note">${escapeHtml(status)} relationship. ${showWireSignals?'Wire strength is a visual summary of prior category patterns, not evidence this particular link is correct.':'Wire styling is hidden; the map uses neutral solid connections.'}</p><button type="button" class="secondary-button compact" id="clearSelectedConnection">Deselect Connection</button><button type="button" class="secondary-button compact danger-subtle" id="deleteSelectedConnection">Disconnect Wire</button></div>`;
  root.querySelector('#clearSelectedConnection').onclick=()=>{selectedEdgeId=null;renderWorkspace();};
  root.querySelector('#deleteSelectedConnection').onclick=()=>{
    if(window.confirm('Disconnect this reasoning relationship? The nodes remain in your project, and Ctrl+Z can restore the wire.'))disconnectEdge(id);
  };
}


function nodeHandlers(){
  return {
    onNext:(node,text,extra)=>{
      checkpoint('add guided reasoning step');
      let created=null;
      const fallback=visibleCanvasPlacement(getState().nodes.length+1);
      updateState(s=>{
        if(node.type==='input') {
          created=createNode({type:'interpretation',label:text,branchId:node.branchId||s.activeBranchId,meta:{guided:true,sourcePrompt:'Input-node guidance',provenance:'designer',hotspotId:node.meta?.hotspotId||s.selectedHotspotId}});
          s.nodes.push(created);
          // Input guidance creates a nearby node only. Wiring is always a
          // deliberate canvas action by the designer.
          s.edges=s.edges.filter(e=>!((e.source===node.id&&e.target===created.id)||(e.target===node.id&&e.source===created.id)));
        }
        else if(node.type==='interpretation') created=addGrounding(s,node.id,text,extra.sourceKind||'Designer rationale',node.branchId);
        else if(node.type==='grounding') created=addConsequence(s,node.id,text,node.branchId,extra.tags||[]);
        else if(node.type==='consequence') created=addEvaluation(s,node.id,text,node.branchId,extra.tags||[]);
        else if(node.type==='evaluation') created=addGoal(s,node.id,text,node.branchId);
        if(created){
          const baseX=Number.isFinite(Number(node.x))?Number(node.x):fallback.x;
          const baseY=Number.isFinite(Number(node.y))?Number(node.y):fallback.y;
          created.x=baseX+270;
          created.y=baseY;
          created.meta={...(created.meta||{}),guided:true,hotspotId:node.meta?.hotspotId||s.selectedHotspotId,provenance:'designer'};
          s.activeNodeId=created.id;
        }
      });
      lastAddedNodeId=created?.id||null;
      if(created?.id){selectedNodeIds.clear();selectedNodeIds.add(created.id);selectedEdgeId=null;}
      const labels={input:'Interpretation added',interpretation:'Grounding added',grounding:'Spatial consequence added',consequence:'Evaluation added',evaluation:'Goal added'};
      logEvent(labels[node.type]||'Reasoning added',text); renderWorkspace();
      if(created) toast(node.type==='input'?`${typeLabels[created.type]||created.type} added beside the source. Connect it manually when intended.`:`${typeLabels[created.type]||created.type} added and linked.`);
    },
    onFrameworkNext:(node,text,roleId,extra)=>addFrameworkGuidedStep(node.id,text,roleId,extra),
    onBranch:id=>branchFrom(id),
    onFork:id=>forkFrom(id),
    onEdit:node=>editNode(node),
    onEditHotspot:id=>editHotspot(id),
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
    onOpen:m=>m.querySelector('#confirmFork').onclick=()=>{ const val=m.querySelector('#forkText').value.trim(); if(!val)return; checkpoint('fork reasoning'); let created=null; updateState(s=>{created=forkNext(s,id,val);}); lastAddedNodeId=created?.id||null; logEvent('Reasoning fork created',val); closeModal(); renderWorkspace(); }
  });
}
function branchFrom(id){
  const origin=getState().nodes.find(n=>n.id===id); if(!origin)return;
  openModal(`<h2 id="modalTitle">Branch this interpretation.</h2><p>Keep the existing reading and create another possible meaning alongside it.</p><label class="field-label">Alternative interpretation</label><textarea class="field-textarea" id="branchText" placeholder="Describe another plausible reading of this language…"></textarea><div class="modal-actions"><button class="secondary-button" data-close-modal>Cancel</button><button class="primary-button compact" id="confirmBranch">Create branch →</button></div>`,{
    onOpen:m=>m.querySelector('#confirmBranch').onclick=()=>{ const val=m.querySelector('#branchText').value.trim(); if(!val)return; checkpoint('branch interpretation'); let created=null; updateState(s=>{created=createBranch(s,id,val);}); lastAddedNodeId=created?.id||null; logEvent('Alternative branch created',val); closeModal(); renderWorkspace(); }
  });
}

function editNode(node){
  const sourceInput=node.type==='input' && node.meta?.source==='brief';
  const editingFramework=getFramework(getState().frameworkId||'tracework');
  const activeFrameworkReading=!['tracework','freeform'].includes(editingFramework.id) && !sourceInput && node.type!=='note';
  const currentFrameworkRole=activeFrameworkReading?frameworkRoleForNode(node,editingFramework.id):null;
  const frameworkRoleOptions=activeFrameworkReading?frameworkCategories(editingFramework.id).map(c=>`<option value="${escapeHtml(c.id)}" ${c.id===currentFrameworkRole?.id?'selected':''}>${escapeHtml(c.label)}</option>`).join(''):'';
  const editableTypes=['input','interpretation','grounding','consequence','evaluation','goal','note'];
  const typeOptions=editableTypes.map(t=>`<option value="${t}" ${node.type===t?'selected':''}>${escapeHtml(typeLabels[t]||t)}</option>`).join('');
  const currentProvenance=sourceInput?'brief':inferLegacyProvenance(node);
  const provenanceChoices=provenanceOptions.some(p=>p.id===currentProvenance)?provenanceOptions:[...provenanceOptions,{id:currentProvenance,label:'Imported Attribution (Review Required)'}];
  const provenanceOptionsMarkup=provenanceChoices.map(p=>`<option value="${p.id}" ${currentProvenance===p.id?'selected':''}>${escapeHtml(p.label)}</option>`).join('');
  const legacyEvidence=['participant','transcript'].includes(node.meta?.evidenceKind);
  // Unsupported legacy evidence names remain unmodified in storage and require review.
  const selectedEvidence=legacyEvidence?'unspecified':inferredEvidenceKind(node);
  const evidenceMarkup=evidenceKinds.map(item=>`<option value="${item.id}" ${selectedEvidence===item.id?'selected':''}>${escapeHtml(item.label)}</option>`).join('');
  const currentActivity=node.meta?.generationActivity||'unspecified';
  const activityMarkup=generationActivities.map(a=>`<option value="${a.id}" ${currentActivity===a.id?'selected':''}>${escapeHtml(a.label)}</option>`).join('');
  const recognition=activeFrameworkReading?classifyFrameworkThought(node.label,editingFramework.id,{canonicalType:node.type}):classifyThought(node.label,{provenance:currentProvenance});
  const matchingRole=activeFrameworkReading?currentFrameworkRole?.id:node.type;
  const match=recognition.matches?.find(item=>(activeFrameworkReading?item.role:item.type)===matchingRole);
  const matchingPercent=Number.isFinite(Number(match?.strength))?Math.round(Number(match.strength)):0;
  const matchingLabel=activeFrameworkReading?(currentFrameworkRole?.label||editingFramework.shortLabel):(typeLabels[node.type]||node.type);
  const tip=(description)=>`<button type="button" class="metadata-help" data-help="${escapeHtml(description)}" aria-label="Explain this field">?</button>`;
  openModal(`<div class="reasoning-edit-dialog"><h2 id="modalTitle">Edit ${escapeHtml(activeFrameworkReading?matchingLabel:(node.type==='note'?'Note':typeLabels[node.type]||node.type))}</h2><p>Revise the wording, reasoning role or attribution of this thought${sourceInput?' while keeping it anchored to the brief.':'.'}</p><label class="field-label" for="editNodeText">Thought Statement ${tip("The exact wording of this thought. Changing the text may change its suggested reasoning role.")}</label><textarea class="field-textarea" id="editNodeText">${escapeHtml(node.label)}</textarea>${sourceInput?'<div class="guided-help-note">This statement remains linked to the original brief, so its source and reasoning role stay fixed. No author is assumed.</div>':`${activeFrameworkReading?`<div class="node-type-edit-row active-framework-role-editor"><label for="editFrameworkRole">${escapeHtml(editingFramework.shortLabel)} Reading ${tip("This is the active framework's analytical role, which can be revised without changing the original TRACEWORK category or past evidence.")}</label><select id="editFrameworkRole">${frameworkRoleOptions}</select><p class="d2-role-editor-note">This reading belongs to ${escapeHtml(editingFramework.label)}. Changing it does not rewrite the recorded TRACEWORK category.</p></div><details class="underlying-role-editor"><summary>Underlying TRACEWORK category · ${escapeHtml(typeLabels[node.type]||node.type)}</summary><div class="node-type-edit-row"><label for="editNodeType">Recorded Category ${tip("Change the underlying TRACEWORK category only if the original classification itself needs correction.")}</label><select id="editNodeType">${typeOptions}</select></div></details>`:`<div class="node-type-edit-row"><label for="editNodeType">Node Type ${tip("Choose the reasoning role this statement performs; you can revise this without deleting links.")}</label><select id="editNodeType">${typeOptions}</select></div>`}<div class="node-type-edit-row"><label for="editNodeProvenance">${`Attribution ${tip("Who or what is responsible for this thought? It might be the designer, another collaborator, a document or software. This does not prove the claim.")}`}</label><select id="editNodeProvenance">${provenanceOptionsMarkup}</select></div>`}<div class="node-type-edit-row"><label for="editAttributionName">Named Contributor ${tip("Optional name of a person, collaborator, reviewer, organisation or software tool responsible for the thought.")}</label><input class="field-input" id="editAttributionName" maxlength="120" value="${escapeHtml(node.meta?.attributionName||'')}" placeholder="Person, collaborator, reviewer, software…"></div><div class="node-type-edit-row"><label for="editGenerationActivity">${`Generation Activity ${tip("How was this thought produced: authored, interpreted, observed, revised, generated by software or imported?")}`}</label><select id="editGenerationActivity">${activityMarkup}</select></div><div class="node-type-edit-row"><label for="editActivityDetails">Activity Details ${tip("Optional detail about how this was generated, tested or edited.")}</label><input class="field-input" id="editActivityDetails" maxlength="180" value="${escapeHtml(node.meta?.activityDetails||'')}" placeholder="Optional process, method or event"></div><div class="node-type-edit-row"><label for="editEvidenceKind">${`Supporting Record ${tip("What separate document, observation, drawing, measurement or note supports this thought, if any? Sources are not automatically verified.")}`}</label><select id="editEvidenceKind">${evidenceMarkup}</select></div><div class="node-type-edit-row"><label for="editRecordTitle">Record Title ${tip("Optional title or identifier of the supporting record.")}</label><input class="field-input" id="editRecordTitle" maxlength="180" value="${escapeHtml(node.meta?.recordTitle||'')}" placeholder="Optional drawing, document or observation name"></div>${legacyEvidence?'<p class="metadata-review-note">An older evidence category needs review. Select the supporting record, if one exists.</p>':''}<label class="field-label" for="editSourceReference">Source or Citation ${tip("Optional precise reference, page, URL, event or drawing where the supporting record can be checked.")}</label><input class="field-input" id="editSourceReference" maxlength="500" value="${escapeHtml(node.meta?.sourceReference||'')}" placeholder="Source title, document location, URL, or drawing reference…"><div class="recognition-readout" title="Textual cue matching only; not a certainty score or an assessment of design quality.">${escapeHtml(editingFramework.shortLabel)} wording recognition · ${matchingPercent?`${matchingPercent}% match for ${escapeHtml(matchingLabel)}`:`No wording cue found for ${escapeHtml(matchingLabel)}`}. This is a textual cue fit, not design correctness.</div><div class="modal-actions"><button class="secondary-button" data-close-modal>Cancel</button><button class="primary-button compact" id="saveNodeEdit">Save Changes</button></div></div>`,{allowBackdropDismiss:true,
    onOpen:m=>{
      const refreshScore=()=>{
        const text=m.querySelector('#editNodeText')?.value||'';
        const role=sourceInput?node.type:(m.querySelector('#editNodeType')?.value||node.type);
        const lensRole=activeFrameworkReading?m.querySelector('#editFrameworkRole')?.value:null;
        const classifier=activeFrameworkReading?classifyFrameworkThought(text,editingFramework.id,{canonicalType:role}):classifyThought(text,{provenance:m.querySelector('#editNodeProvenance')?.value||currentProvenance});
        const match=classifier.matches?.find(item=>activeFrameworkReading?item.role===lensRole:item.type===role);
        const percent=Number.isFinite(Number(match?.strength))?Math.round(Number(match.strength)):0;
        const label=activeFrameworkReading?(getFrameworkCategory(editingFramework.id,lensRole)?.label||lensRole):(typeLabels[role]||role);
        const el=m.querySelector('.recognition-readout');if(el)el.textContent=`${editingFramework.shortLabel} wording recognition · ${percent?`${percent}% match for ${label}`:`No wording cue found for ${label}`}. This is a textual cue fit, not design correctness.`;
      };
      m.querySelector('#editNodeText')?.addEventListener('input',refreshScore);
      m.querySelector('#editNodeType')?.addEventListener('change',refreshScore);
      m.querySelector('#editFrameworkRole')?.addEventListener('change',refreshScore);
      m.querySelector('#editNodeProvenance')?.addEventListener('change',refreshScore);
      m.querySelector('#saveNodeEdit').onclick=()=>{
      const val=m.querySelector('#editNodeText').value.trim(); if(!val)return;
      const nextType=sourceInput?node.type:(m.querySelector('#editNodeType')?.value||node.type);
      const nextFrameworkRole=activeFrameworkReading?m.querySelector('#editFrameworkRole')?.value:null;
      const frameworkRoleChanged=activeFrameworkReading&&nextFrameworkRole!==currentFrameworkRole?.id;
      const nextProvenance=sourceInput?'brief':(m.querySelector('#editNodeProvenance')?.value||currentProvenance);
      const changedType=nextType!==node.type;
      const evidenceKind=m.querySelector('#editEvidenceKind')?.value||'unspecified';
      const generationActivity=m.querySelector('#editGenerationActivity')?.value||'unspecified';
      const sourceReference=m.querySelector('#editSourceReference')?.value.trim()||'';
      const attributionName=m.querySelector('#editAttributionName')?.value.trim()||'';
      const activityDetails=m.querySelector('#editActivityDetails')?.value.trim()||'';
      const recordTitle=m.querySelector('#editRecordTitle')?.value.trim()||'';
      const previousNode={...node,meta:{...(node.meta||{})}};
      const oldEdges=getState().edges.filter(e=>e.source===node.id||e.target===node.id);
      checkpoint('edit reasoning and provenance');
      updateState(s=>{
        const n=s.nodes.find(x=>x.id===node.id); if(!n)return;
        n.label=val; n.type=nextType; n.updatedAt=new Date().toISOString();
        if(nextType==='note'){
          const c=classifyThought(val,{provenance:nextProvenance});
          n.meta={...n.meta,suggestedType:c.type||'interpretation',classificationReason:c.reason,classificationConfidence:c.confidence,provenance:nextProvenance};
        }else{
          n.meta={...n.meta,typeEdited:changedType||n.meta?.typeEdited,provenance:nextProvenance};
          delete n.meta.suggestedType;
        }
        n.meta={...(n.meta||{}),evidenceKind,sourceReference,generationActivity,attributionName,activityDetails,recordTitle};
        if(activeFrameworkReading&&nextFrameworkRole){n.meta.frameworkRoles={...(n.meta.frameworkRoles||{}),[editingFramework.id]:nextFrameworkRole};}
        if(changedType){
          s.edges.filter(e=>e.source===n.id||e.target===n.id).forEach(e=>{e.meta={...(e.meta||{}),typeEdited:true};});
        }
      });
      logEvent(frameworkRoleChanged?'Framework reading revised':changedType?'Reasoning type revised':'Reasoning revised',frameworkRoleChanged?`${editingFramework.shortLabel} · ${getFrameworkCategory(editingFramework.id,nextFrameworkRole)?.label||nextFrameworkRole} · ${val}`:changedType?`${typeLabels[node.type]||node.type} → ${typeLabels[nextType]||nextType} · ${val}`:val);
      closeModal(); renderWorkspace();
      // Recheck connected relationships when wording, type or attribution changes.
      // Notify only on newly introduced concerns; do not claim every cross-source link is invalid.
      const current=getState();
      const updated=current.nodes.find(n=>n.id===node.id);
      let provenanceConcern=null,reasoningConcern=null;
      for(const edge of oldEdges){
        const other=current.nodes.find(n=>n.id===(edge.source===node.id?edge.target:edge.source));
        if(!other||!updated)continue;
        const start=edge.source===node.id?updated:other,end=edge.target===node.id?updated:other;
        const beforeStart=edge.source===node.id?previousNode:other,beforeEnd=edge.target===node.id?previousNode:other;
        const nowProv=provenanceConnectionCheck(start,end),beforeProv=provenanceConnectionCheck(beforeStart,beforeEnd);
        if(nowProv.flagged&&(!beforeProv.flagged||nowProv.reason!==beforeProv.reason))provenanceConcern=nowProv;
        const nowLink=connectionCheck(start,end),oldLink=connectionCheck(beforeStart,beforeEnd);
        if(nowLink.gap&&(!oldLink.gap||nowLink.gap.reason!==oldLink.gap.reason))reasoningConcern=nowLink.gap;
      }
      if(reasoningConcern)coach('Gap in Reasoning',`${reasoningConcern.reason} ${reasoningConcern.next||''}`,{pinnable:true,duration:9500});
      if(provenanceConcern)coach('Provenance Gap',`${provenanceConcern.reason} ${provenanceConcern.next||''}`,{pinnable:true,duration:9500});
      if(changedType)toast(`Changed to ${typeLabels[nextType]||nextType}. Existing wires were kept for review.`);
    };
    }
  });
}


async function applyEditedBrief(){
  const brief=normaliseBrief(els.briefEditor.value); if(!brief)return;
  const state=getState();
  const useChunks=state.briefMode==='document' || brief.length>2600;
  const chunks=useChunks?chunkBrief(brief):[];
  const hotspots=attachChunksToHotspots(await detectHotspots(brief),chunks);
  updateState(s=>{s.brief=brief;s.briefChunks=chunks;s.activeBriefChunkId=chunks[0]?.id||null;s.hotspots=hotspots;s.selectedHotspotId=null;s.nodes=[];s.edges=[];s.activeNodeId=null;s.activeBranchId='branch-1';});
  logEvent('Brief revised',`Existing reasoning reset to avoid false links${chunks.length>1?` · ${chunks.length} sections`:''}`); toggleBriefEditor(false,getState()); renderWorkspace(); toast('Brief re-analysed.');
}

function manualPhrase(){
  const state=getState();
  const chunk=state.briefChunks?.find(c=>c.id===state.activeBriefChunkId)||null;
  const brief=chunk?.text||state.brief;
  const baseOffset=chunk?.start||0;
  openModal(`<h2 id="modalTitle">Select text from the brief.</h2><p>Drag across any word or phrase below. TRACEWORK will preserve the exact wording as an Input hotspot${chunk?' inside this brief section':''}.</p>
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
        const snapped=normaliseHotspotSelection(brief,a,b);
        const text=snapped.text;
        if(!text){ picked=null; preview.textContent='Nothing selected yet'; confirm.disabled=true; return; }
        picked={text,start:baseOffset+snapped.start,end:baseOffset+snapped.end};
        preview.textContent=`“${text}”`;
        confirm.disabled=false;
      };
      box.addEventListener('mouseup',()=>setTimeout(readSelection,0));
      box.addEventListener('keyup',()=>setTimeout(readSelection,0));
      confirm.onclick=()=>{
        if(!picked)return;
        const duplicate=getState().hotspots.some(h=>h.start===picked.start&&h.end===picked.end);
        if(duplicate){toast('That exact word or phrase is already a hotspot.');return;}
        const h={id:`hotspot-manual-${Date.now()}`,text:picked.text,concept:'custom',source:'designer',start:picked.start,end:picked.end,reason:'Selected by designer for interpretation',kind:/\s/.test(picked.text)?'phrase':'word',chunkId:chunk?.id||null};
        checkpoint('add hotspot');
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

// Clear empty states keep every top-ribbon destination usable before a
// trace is opened. The navigation must never appear broken or do nothing.
function emptySubview(title,description,action='Go to Workspace'){
  return `<div class="trace-empty-view"><span class="trace-empty-symbol" aria-hidden="true">◇</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p><button type="button" class="secondary-button empty-go-workspace">${escapeHtml(action)} →</button></div>`;
}
function wireEmptyStateActions(root){
  root?.querySelectorAll('.empty-go-workspace').forEach(button=>button.onclick=()=>showView('workspace'));
}
function renderPathwayBlank(){
  const root=$('#pathwayGrid');
  if(!root)return;
  const search=$('#pathwaySearch');
  if(search){search.value='';search.disabled=true;search.placeholder='Open a trace to search its pathways';search.closest('.search-field')?.classList.add('hidden');}
  root.innerHTML=emptySubview('No active reasoning pathway yet','Open or start a trace to explore pathways connected to its design language. This bank does not prescribe a solution.');
  wireEmptyStateActions(root);
}

function renderSavedTraceLibrary(){
  const root=$('#traceDashboard'); if(!root)return;
  const projects=listProjects();
  if(!projects.length){
    root.innerHTML=emptySubview('No traces saved yet','Your reasoning maps and project history will appear here once you start a trace. You can also import a previously exported project using Import saved JSON above.');
    wireEmptyStateActions(root);return;
  }
  root.innerHTML=`<section class="saved-trace-library">${projects.map(p=>`<article class="project-card"><div><span class="project-card-label">${String(p.projectId||'').startsWith('tracework-test-')?'TEST PROJECT':'SAVED TRACE'}</span><h3>${escapeHtml(shelfName(p))}</h3><p>${escapeHtml((p.brief||'').slice(0,105))}${(p.brief||'').length>105?'…':''}</p></div><div class="project-card-actions"><button class="secondary-button compact-project" data-open-library-project="${escapeHtml(p.projectId)}">Open</button><button class="project-delete-button" data-delete-library-project="${escapeHtml(p.projectId)}" title="Delete trace">×</button></div></article>`).join('')}</section>`;
  root.querySelectorAll('[data-open-library-project]').forEach(b=>b.onclick=()=>openSavedProject(b.dataset.openLibraryProject));
  root.querySelectorAll('[data-delete-library-project]').forEach(b=>b.onclick=()=>confirmDeleteSavedProject(b.dataset.deleteLibraryProject));
}

function renderDiscussionBlank(){
  const list=$('#discussionList'),scope=$('#discussionScope'),text=$('#discussionText'),button=$('#addDiscussionButton'),preview=$('#discussionAnchorPreview');
  if(list){
    list.innerHTML=emptySubview('No project discussion yet','Discussion is available here even before you open a project. Open or start a trace to add a comment, critique or rationale linked to that project or a specific node. Notes stay in this browser.');
    wireEmptyStateActions(list);
  }
  // There is no global discussion backend; hide the inactive composer instead
  // of showing controls that appear interactive but cannot submit.
  if(scope){scope.innerHTML='<option value="project">Whole project</option>';scope.disabled=true;}
  if(text){text.value='';text.disabled=true;}
  if(button)button.disabled=true;
  if(preview){preview.classList.add('hidden');preview.innerHTML='';}
}

async function renderPathwayCards(query=''){
  const search=$('#pathwaySearch'); if(search){search.disabled=false;search.placeholder='Search a concept, e.g. flexibility';search.closest('.search-field')?.classList.remove('hidden');}
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
      const n=createNode({type:step.type,label:step.text,branchId,x:xByType[step.type]??335,y:laneY,meta:{sourcePathway:p.id,sourceLabel:p.source,sourceStatus:p.status,provisional:true,provenance:'precedent'}});
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

// D2 — user-driven reasoning aids, reading lenses and evidence-aware decision digest.
// Opening these tools never mutates nodes, edges, framework selections or author attribution.
function openReasoningTools(initialTab=null){
  if(!getState().brief){toast('Open a project to use reasoning tools.');return;}
  let tab=initialTab;
  const currentState=()=>getState();
  // Selecting a source hotspot automatically selects its Input node. That is still
  // a brief-first context: Start Me Off must remain accessible until a developed
  // reasoning node (not the automatically selected Input) is chosen.
  const activeNode=()=>currentState().nodes.find(n=>n.id===currentState().activeNodeId && n.type!=='input')||null;
  const selectedHotspot=()=>currentState().hotspots?.find(h=>h.id===currentState().selectedHotspotId)||null;
  // The selected node defines the next-step mode; no selected node means brief-first guidance.
  tab=activeNode()?'next':'start';
  const options=()=>['tracework','freeform','requirements','fivewhys','laddering','framing','reflective','semantics'].map(id=>`<option value="${id}">${escapeHtml(getFramework(id).label)}</option>`).join('');
  const header=()=>`<div class="d2-tabs" role="tablist" aria-label="Reasoning tools">${[['start','Start Me Off'],['next','What Next'],['structure','Compare Structure'],['digest','Reasoning Summary']].map(([id,label])=>{const disabled=(id==='start'&&activeNode())||(id==='next'&&!activeNode());return `<button type="button" class="d2-tab ${tab===id?'active':''}" data-d2-tab="${id}" role="tab" aria-selected="${tab===id}" ${disabled?'disabled':''} title="${id==='start'?'Available when no thought is selected':id==='next'?'Select a thought to develop it':'Compare or summarise recorded reasoning'}">${label}</button>`;}).join('')}</div><div class="d2-mode-note">${activeNode()?'A thought is selected. What Next develops that specific thought; deselect it on the canvas to use Start Me Off.':'No thought selected. Start Me Off reads the brief; select a node to use What Next.'}</div><div id="d2Content" class="d2-content"></div>`;
  openModal(`<div class="d2-dialog"><h2 id="modalTitle">Reasoning Tools</h2><p>Optional prompts and analytical readings. Your recorded trace stays unchanged until you explicitly add or edit something.</p>${header()}<div class="modal-actions"><button type="button" class="secondary-button" data-close-modal>Close</button></div></div>`,{
    onOpen:m=>{
      const content=m.querySelector('#d2Content');
      const bindTabs=()=>m.querySelectorAll('[data-d2-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.d2Tab; m.querySelectorAll('[data-d2-tab]').forEach(x=>{x.classList.toggle('active',x.dataset.d2Tab===tab);x.setAttribute('aria-selected',String(x.dataset.d2Tab===tab));});draw();});
      const draftToComposer=(draft,role)=>{
        if(!draft){closeModal();els.freeThoughtInput.focus();toast('Write your own thought in the command line; no node was added.');return;}
        els.freeThoughtInput.value=draft;
        const f=getFramework(currentState().frameworkId||'tracework');
        const cRole=f.id==='tracework'||f.id==='freeform'?role:null;
        els.thoughtTypeSelect.dataset.manual='';
        if(cRole && [...els.thoughtTypeSelect.options].some(o=>o.value===cRole)){
          els.thoughtTypeSelect.value=cRole;
          if(f.id==='freeform')els.thoughtTypeSelect.dataset.manual='1';
        }
        closeModal();
        updateThoughtSuggestion();
        els.freeThoughtInput.focus();
        toast('Draft added to the command line. Revise it before saving; no node was created.');
      };
      const makePrompts=(items)=>`<div class="d2-prompt-list">${items.map((item,i)=>`<article class="d2-prompt-card"><div class="d2-prompt-top"><strong>${i+1}. ${escapeHtml(item.heading)}</strong><span>${escapeHtml(typeLabels[item.role]||item.role||'Freeform')}</span></div><p class="d2-question">${escapeHtml(item.question)}</p><div class="d2-draft-label">Complete example · editable</div><p class="d2-example">${escapeHtml(item.draft)}</p><div class="d2-why">${escapeHtml(item.why)}</div><button type="button" class="secondary-button compact" data-d2-draft="${i}">Use this editable sentence →</button></article>`).join('')}</div>`;
      function draw(){
        const state=currentState(),node=activeNode();
        if(tab==='start'||tab==='next'){
          const start=tab==='start';const items=start?startSuggestions(state,selectedHotspot()):nextSuggestions(state,node,selectedHotspot());
          const context=node&&!start?`Selected thought: <strong>${escapeHtml(node.label)}</strong>`:`Selected brief language: <strong>${escapeHtml(selectedHotspot()?.text||state.brief?.slice(0,90)||'Project brief')}</strong>`;
          content.innerHTML=`<p class="d2-context">${context}</p><p class="d2-intro">${start?'Start with the selected brief language.':'Develop or test this selected thought.'} The complete example sentence is an editable proposal, not an answer or a verified fact. Selecting it does not save a node.</p>${makePrompts(items)}`;
          content.querySelectorAll('[data-d2-draft]').forEach(b=>b.onclick=()=>{const item=items[Number(b.dataset.d2Draft)];draftToComposer(item?.draft,item?.role);});
          return;
        }
        if(tab==='structure'){
          content.innerHTML=`<p class="d2-intro">Compare two interpretive lenses against exactly the same recorded thoughts. “Inferred” means the lens suggests a reading; it is <strong>not</strong> evidence of the method originally used.</p><div class="d2-framework-choice"><label>First lens<select id="d2FrameworkA">${options()}</select></label><label>Second lens<select id="d2FrameworkB">${options()}</select></label></div><div id="d2StructureResult"></div>`;
          const a=content.querySelector('#d2FrameworkA'),b=content.querySelector('#d2FrameworkB'),target=content.querySelector('#d2StructureResult');
          a.value=state.frameworkId||'tracework'; b.value=a.value==='requirements'?'reflective':'requirements';
          function refresh(){
            if(a.value===b.value){target.innerHTML='<p class="d2-intro">Choose two different lenses to compare their interpretations.</p>';return;}
            const ids=new Set(workspaceTrace(currentState()).nodes.map(n=>n.id));
            const r=compareFrameworkReadings(currentState(),a.value,b.value,ids);
            const shown=r.rows.slice(0,45);
            target.innerHTML=`<p class="d2-summary">${r.rows.length} visible thoughts · ${r.differences} differently labelled readings. ${r.rows.length>45?'Showing the first 45; use a focus map to narrow your comparison.':''}</p><div class="d2-compare-scroll"><table class="d2-compare-table"><thead><tr><th>Recorded statement</th><th>${escapeHtml(r.a.shortLabel)}</th><th>${escapeHtml(r.b.shortLabel)}</th></tr></thead><tbody>${shown.map(row=>`<tr><td><strong>${escapeHtml(row.label)}</strong><small>Recorded ${escapeHtml(typeLabels[row.type]||row.type)} · Source: ${escapeHtml(row.origin)}</small></td><td>${escapeHtml(row.a.label)}<small>${row.a.kind==='open'?'No imposed category':row.a.kind==='inferred'?'Inferred analytical reading':'Recorded role'}</small></td><td>${escapeHtml(row.b.label)}<small>${row.b.kind==='open'?'No imposed category':row.b.kind==='inferred'?'Inferred analytical reading':'Recorded role'}</small></td></tr>`).join('')}</tbody></table></div><p class="d2-footnote">Comparison never changes saved node roles, sources, positions or connections. To change the active framework, use the existing Framework selector after closing this view.</p>`;
          }
          a.onchange=refresh;b.onchange=refresh;refresh();return;
        }
        const brief=decisionBrief(state),digest=brief.digest;
        content.innerHTML=`<p class="d2-intro">A readable, print-ready takeaway from the <strong>recorded</strong> trace. This is a snapshot, not an automatic design verdict. Rejected paths are retained and clearly labelled.</p>${brief.html}<div class="d2-export-row"><button type="button" class="primary-button compact" id="d2PrintBrief">Print or Save PDF</button><button type="button" class="secondary-button compact" id="d2CopyBrief">Copy Summary</button></div><details class="d2-advanced-export"><summary>Additional export: Markdown</summary><p>Download structured text for your notes or report draft.</p><button type="button" class="secondary-button compact" id="d2DownloadDigest">Download Markdown</button></details>`;
        content.querySelector('#d2CopyBrief').onclick=async()=>{try{await navigator.clipboard.writeText(brief.plainText);toast('Reasoning Summary copied.');}catch(_){const ta=document.createElement('textarea');ta.value=brief.plainText;document.body.append(ta);ta.select();const ok=document.execCommand('copy');ta.remove();toast(ok?'Reasoning Summary copied.':'Copy unavailable; use Print or Save PDF.');}};
        content.querySelector('#d2PrintBrief').onclick=()=>{
          const windowRef=window.open('','_blank');
          if(!windowRef){toast('Browser blocked the print tab. Allow pop-ups for this site and try again.');return;}
          const sheetCSS=Array.from(document.styleSheets).find(s=>s.href?.includes('components.css'));
          const style=`body{margin:0;background:#f2f3f7;font:14px/1.5 system-ui,sans-serif;color:#161923}.decision-brief-sheet{max-width:850px;margin:24px auto;padding:32px;background:white;box-shadow:0 5px 30px #0001}.db-kicker{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#625cc1}.db-project{font-size:16px;font-weight:700}.db-caution{color:#636778}.db-stats{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0}.db-stats span{border:1px solid #ddd;padding:8px;border-radius:7px}.db-stats b{font-size:18px}.db-columns{display:grid;grid-template-columns:1fr 1fr;gap:18px}.db-section{break-inside:avoid}.db-section h3{font-size:13px;border-bottom:1px solid #ddd;padding-bottom:5px}.db-section ol{padding-left:20px}.db-section li{margin:8px 0}.db-section li small{display:block;color:#767987}.db-review{margin-top:20px}.print-button{display:block;margin:18px auto;padding:12px 20px;border:0;border-radius:8px;background:#5751bf;color:white;cursor:pointer}@page{size:A4;margin:15mm}@media print{body{background:white}.print-button{display:none}.decision-brief-sheet{margin:0;padding:0;box-shadow:none;max-width:none}}@media(max-width:650px){.db-columns{grid-template-columns:1fr}}`;
          windowRef.document.write(`<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>TRACEWORK — Reasoning Summary</title><style>${style}</style></head><body><button class="print-button" onclick="window.print()">Print or Save PDF</button>${brief.html}</body></html>`);
          windowRef.document.close();windowRef.focus();
        };
        content.querySelector('#d2DownloadDigest').onclick=()=>{const blob=new Blob([digest.markdown],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='TRACEWORK-Decision-Digest.md';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);};
      }
      bindTabs();draw();
    }
  });
}


// D2.2 architectural payoff — optional visual propositions grounded in selected reasoning.
// This is parametric architectural axonometry, not a model-rendering API or certified design.
function propositionContext(){
  const state=getState();
  const base=workspaceTrace(state);
  const visible=focusPathRootId?focusTraceAround(base,focusPathRootId):base;
  const mode=workspaceMapMode==='aggregate'?'aggregate':focusPathRootId?'focus-path':'focus-map';
  return {state,visible,mode};
}
function fileDownload(text,name,mime){
  const blob=new Blob([text],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function scopedDigest(ctx){
  const nodes=ctx.visible.nodes.filter(n=>!n.meta?.artifactKind),edges=ctx.visible.edges;
  const ids=new Set(nodes.map(n=>n.id));
  const typeGroup={input:'Source language',interpretation:'Interpretations',grounding:'Reasoning and evidence',consequence:'Spatial propositions',evaluation:'Evaluation and trade-offs',goal:'Goals',note:'Unclassified thoughts'};
  let out=`# TRACEWORK — ${ctx.mode.replaceAll('-',' ')} reasoning digest\n\nProject: ${ctx.state.projectName||'Untitled'}\nFramework: ${getFramework(ctx.state.frameworkId||'tracework').label}\n\nThis is a snapshot of recorded reasoning. Framework interpretations and unresolved questions are not verified design claims.\n\n`;
  for(const [type,heading] of Object.entries(typeGroup)){
    const rows=nodes.filter(n=>n.type===type);if(!rows.length)continue;
    out+=`## ${heading}\n${rows.map(n=>`- ${n.status==='rejected'?'[Rejected] ':n.meta?.provisional?'[Provisional] ':''}${n.label} (ID: ${n.id}; attribution: ${n.meta?.provenance||'unspecified'})`).join('\n')}\n\n`;
  }
  out+=`## Recorded connections\n${edges.filter(e=>ids.has(e.source)&&ids.has(e.target)).map(e=>{
    const a=nodes.find(n=>n.id===e.source),b=nodes.find(n=>n.id===e.target);
    return `- ${a?.label||e.source} → ${b?.label||e.target} [${e.status||'active'}]`;
  }).join('\n')||'None'}\n\n## Limitations\nNo architectural merit or validity is inferred from the presence of a connection.\n`;
  return out;
}
function safeSvgPreview(svg){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);}
async function pngForVisual(svg,{compact=false}={}){
  // Raster thumbnail is embedded into project JSON, so the output survives reopening
  // and the existing vector-map export can include it without network requests.
  const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob);
  try{
    const img=new Image();
    await new Promise((yes,no)=>{img.onload=yes;img.onerror=()=>no(Error('Proposition could not be rendered.'));img.src=url;});
    const canvas=document.createElement('canvas');canvas.width=compact?560:840;canvas.height=compact?375:591;
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('No canvas context.');
    ctx.fillStyle='#f5f7f7';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const data=canvas.toDataURL('image/png');
    if(data.length>800000)throw Error('Image too large for safe project storage. Please export the sheet instead.');
    return data;
  } finally{URL.revokeObjectURL(url);}
}
function nearVisiblePlacement(){
  const visible=propositionContext().visible.nodes;
  const right=Math.max(70,...visible.map(n=>(Number(n.x)||0)+260));
  const minY=Math.min(150,...visible.map(n=>Number(n.y)||150));
  return {x:Math.max(120,right+115),y:Math.max(70,minY)};
}
async function insertOutputNode(kind,{spec=null,markdown='',svg='',title=null}={}){
  const ctx=propositionContext();
  const sourceIds=kind==='architectural-proposition'?spec.sourceIds:ctx.visible.nodes.filter(n=>!n.meta?.artifactKind).map(n=>n.id);
  const label=title||spec?.title||`${ctx.mode.replaceAll('-',' ')} · Reasoning Digest`;
  let png=null;
  if(svg){try{png=await pngForVisual(svg);}catch(e){toast('Cannot embed visual: '+e.message);return;}}
  const point=nearVisiblePlacement();
  const matchingSources=ctx.state.nodes.filter(n=>sourceIds.includes(n.id));
  const src=matchingSources.find(n=>n.type==='consequence')||matchingSources[matchingSources.length-1];
  // Preflight browser-local storage capacity before we touch a real project.
  const newNode=createNode({type:'note',label,branchId:src?.branchId||ctx.state.activeBranchId,
    x:point.x,y:point.y,meta:{artifactKind:kind,sourceMode:ctx.mode,sourceNodeIds:sourceIds,
      imagePng:png,visualSvg:svg||null,propositionSpec:spec||null,markdownDigest:markdown,
      provenance:'system',generationActivity:'generated',evidenceKind:'suggestion',
      hotspotId:ctx.state.selectedHotspotId,outputCreatedAt:new Date().toISOString()}});
  let proposed;
  try{proposed=structuredClone(ctx.state);proposed.nodes.push(newNode);
    if(src){const edge=createEdge(src.id,newNode.id,{status:'provisional'});edge.meta={artifact:true,relation:kind==='architectural-proposition'?'visualises':'summarises'};proposed.edges.push(edge);}
    const oldBank=localStorage.getItem('tracework.projects.v3')||'';
    const bank=JSON.parse(oldBank||'{}');bank[ctx.state.projectId]=proposed;
    const serialized=JSON.stringify(bank);
    if(serialized.length>3800000)throw Error('Project storage is nearing its browser limit. Export a JSON backup before adding further images.');
    const key='tracework-proposition-write-check';localStorage.setItem(key,serialized.slice(0,1000));localStorage.removeItem(key);
  }catch(e){toast('Output not inserted: '+e.message);return;}
  checkpoint('insert reasoning output');
  updateState(st=>{st.nodes.push(newNode);if(src){const edge=createEdge(src.id,newNode.id,{status:'provisional'});edge.meta={artifact:true,relation:kind==='architectural-proposition'?'visualises':'summarises'};st.edges.push(edge);}st.activeNodeId=newNode.id;});
  focusPathRootId=null;
  // An output has no user interpretation provenance; the visual link is a generated relation.
  closeModal();renderWorkspace();
  setTimeout(()=>{const element=els.graphNodes.querySelector(`[data-id="${CSS.escape(newNode.id)}"]`);if(element)focusNode(els.graphViewport,element,canvasZoom);},100);
  toast(kind==='reasoning-digest'?'Digest inserted into the workspace.':'Architectural proposition inserted into the workspace.');
}
// D2.4: Board comparison is a saved layout of independently inspectable,
// source-linked images. It does NOT duplicate or alter participant-authored thoughts.
async function placePropositionBoard(choices,modeName){
  if(!choices.length)return;
  const ctx=propositionContext(),point=nearVisiblePlacement(),nodes=[],edges=[];
  const collectionId=`${ctx.state.projectId}-comparison-${Date.now()}`;
  try{
    for(const [i,{spec,svg}] of choices.entries()){
      const imagePng=await pngForVisual(svg,{compact:true});
      const sourceIds=spec.sourceIds||[];
      const src=ctx.state.nodes.find(n=>sourceIds.includes(n.id)&&n.type==='consequence')||ctx.state.nodes.find(n=>sourceIds.includes(n.id)&&n.type!=='input');
      const node=createNode({type:'note',label:spec.title,branchId:src?.branchId||ctx.state.activeBranchId,
        x:point.x+(i%3)*395,y:point.y+Math.floor(i/3)*390,
        meta:{artifactKind:'architectural-proposition',sourceMode:ctx.mode,sourceNodeIds:sourceIds,
          imagePng,visualSvg:svg,propositionSpec:spec,markdownDigest:propositionMarkdown(spec),
          provenance:'system',generationActivity:'generated',evidenceKind:'suggestion',
          hotspotId:ctx.mode==='aggregate'?src?.meta?.hotspotId||ctx.state.selectedHotspotId:ctx.state.selectedHotspotId,
          outputCreatedAt:new Date().toISOString(),comparisonCollection:collectionId}});
      nodes.push(node);
      if(src){const link=createEdge(src.id,node.id,{status:'provisional'});link.meta={artifact:true,relation:'visualises'};edges.push(link);}
    }
    const bank=JSON.parse(localStorage.getItem('tracework.projects.v3')||'{}');
    const proposed=structuredClone(ctx.state);
    proposed.nodes.push(...nodes);proposed.edges.push(...edges);
    bank[ctx.state.projectId]=proposed;
    if(JSON.stringify(bank).length>3800000)throw Error('The local project store is close to its limit. Export individual SVG sheets or back up your project instead.');
    const test='tracework-board-preflight';localStorage.setItem(test,JSON.stringify({bytes:JSON.stringify(bank).length,nodes:nodes.length}));localStorage.removeItem(test);
  }catch(e){toast('Comparison was not inserted: '+e.message);return;}
  checkpoint('place architectural comparison board');
  updateState(st=>{st.nodes.push(...nodes);st.edges.push(...edges);st.activeNodeId=nodes[0].id;});
  focusPathRootId=null;closeModal();renderWorkspace();
  toast(`${nodes.length} ${modeName.toLowerCase()} study images placed side by side on the map. Double-click any image to inspect or export it.`);
}
function openSavedArtifact(node){
  if(!node?.meta?.artifactKind)return;
  if(node.meta.artifactKind==='reasoning-digest'){
    const md=node.meta.markdownDigest||'';
    openModal(`<div class="prop-modal"><h2 id="modalTitle">${escapeHtml(node.label)}</h2><div class="prop-markdown">${escapeHtml(md)}</div><div class="modal-actions"><button type="button" class="secondary-button" id="artifactMdExport">Download Markdown</button><button type="button" class="secondary-button" data-close-modal>Close</button></div></div>`,{onOpen:m=>m.querySelector('#artifactMdExport').onclick=()=>fileDownload(md,'TRACEWORK-Reasoning-Digest.md','text/markdown')});return;
  }
  const svg=node.meta.visualSvg||'';
  const spec=node.meta.propositionSpec;
  openPropositionPreview(spec,svg,{saved:true});
}
function propositionPrintSheet(spec,svg){
  const win=window.open('','_blank');if(!win){toast('Allow pop-ups to print the proposition sheet.');return;}
  const annotations=(spec.annotations||[]).map(a=>`<li><strong>${escapeHtml(a.heading)}</strong> — ${escapeHtml(a.form)}<br><small>${a.grounded?'Recorded thought: '+escapeHtml(a.sourceText):'Visual assumption — not directly stated'}</small></li>`).join('');
  const doc=`<!doctype html><html><head><meta charset="utf-8"><title>TRACEWORK — Architectural Proposition Sheet</title><style>@page{size:A3 landscape;margin:12mm}body{font:14px/1.5 Arial,sans-serif;color:#23394b;margin:20px;background:#fff}header{display:flex;justify-content:space-between;border-bottom:1px solid #cdd8dc;margin-bottom:12px}h1{font-size:23px;margin:3px 0}main{display:grid;grid-template-columns:1.55fr 1fr;gap:20px}main svg{width:100%;height:auto}ol{padding-left:20px}li{margin:12px 0}small{color:#677581}.sub{color:#526d7d}button{padding:10px 15px;background:#23445a;border:none;color:#fff}@media print{button{display:none}body{margin:0}}@media(max-width:700px){main{display:block}}</style></head><body><header><div><p class="sub">TRACEWORK · ARCHITECTURAL PROPOSITION SHEET</p><h1>${escapeHtml(spec.title)}</h1></div><button onclick="print()">Print / Save PDF</button></header><main><div>${svg}</div><div><h2>Reasoning-to-form annotations</h2><ol>${annotations}</ol><p class="sub">${escapeHtml(spec.note)}</p><p class="sub">TRACEWORK produces an illustrative architectural interpretation, not a verified design or original participant drawing.</p></div></main></body></html>`;
  win.document.write(doc);win.document.close();win.focus();
}
function openPropositionPreview(spec,svg,{saved=false}={}){
  if(!spec||!svg){toast('This output has no visual data.');return;}
  const sourceInfo=`${spec.recordedClaims} linked feature${spec.recordedClaims===1?'':'s'} · ${spec.assumptions.length} disclosed visual assumption${spec.assumptions.length===1?'':'s'}`;
  openModal(`<div class="prop-modal"><h2 id="modalTitle">${escapeHtml(spec.title)}</h2><p class="prop-disclosure">${escapeHtml(sourceInfo)} · Exploratory axonometric, not to scale or structurally verified.</p><div class="prop-render" id="propRender"></div><div class="prop-annotation-list">${spec.annotations.map(a=>`<p><strong>${escapeHtml(a.heading)}:</strong> ${escapeHtml(a.grounded?a.sourceText:'Added as a visual assumption — '+a.form)}</p>`).join('')}</div><div class="modal-actions"><button type="button" class="secondary-button" id="propSaveSvg">Save SVG</button><button type="button" class="secondary-button" id="propPrint">Print rationale sheet</button><button type="button" class="secondary-button" id="propMarkdown">Markdown</button>${saved?'':`<button type="button" class="primary-button compact" id="propInsert">Insert as image node</button>`}<button type="button" class="secondary-button" data-close-modal>Close</button></div></div>`,{onOpen:m=>{
    m.querySelector('#propRender').innerHTML=svg;
    m.querySelector('#propSaveSvg').onclick=()=>fileDownload(svg,'TRACEWORK-Architectural-Proposition.svg','image/svg+xml;charset=utf-8');
    m.querySelector('#propPrint').onclick=()=>propositionPrintSheet(spec,svg);
    m.querySelector('#propMarkdown').onclick=()=>fileDownload(propositionMarkdown(spec),'TRACEWORK-Proposition-Rationale.md','text/markdown');
    const insert=m.querySelector('#propInsert');if(insert)insert.onclick=()=>insertOutputNode('architectural-proposition',{spec,svg,markdown:propositionMarkdown(spec)});
  }});
}
function propositionComparisonSheet(choices,scopeName){
  const win=window.open('','_blank');if(!win){toast('Please allow pop-ups to print the comparison.');return;}
  const cards=choices.map(({spec,svg},i)=>`<article><h2>${i+1}. ${escapeHtml(spec.title)}</h2><p>${escapeHtml(spec.layout)}</p>${svg}<p><strong>Source move:</strong> ${escapeHtml(spec.sourceStatement||'Not recorded')}</p><p>Documentary support: ${spec.documentedScore} points. Concept only; validation required.</p></article>`).join('');
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>TRACEWORK — Architectural Pathway Comparison</title><style>@page{size:A3 landscape;margin:10mm}body{font:12px Arial;color:#304851;margin:20px}header{display:flex;justify-content:space-between;align-items:center}h1{font-size:24px}main{display:grid;grid-template-columns:repeat(${Math.min(choices.length,3)},minmax(0,1fr));gap:12px}article{break-inside:avoid;border:1px solid #cad6d3;padding:8px}article svg{width:100%;height:auto}h2{font-size:15px}p{font-size:11px;line-height:1.4}button{background:#244858;color:white;border:0;padding:10px}@media print{button{display:none}body{margin:0}main{grid-template-columns:repeat(${Math.min(choices.length,3)},minmax(0,1fr))}}</style></head><body><header><h1>TRACEWORK — ${escapeHtml(scopeName)} · Pathway Comparison</h1><button onclick="print()">Print / Save PDF</button></header><p>Focus: complete pathway-specific design studies. Aggregate: conceptual architectural form translations. A geometric alternative may come from the same recorded path and is a system hypothesis. Documentary scores are not architectural quality. No output is a participant drawing.</p><main>${cards}</main></body></html>`);
  win.document.close();win.focus();
}
function openArchitecturalPropositions(){
  if(!getState().brief){toast('Open a project first.');return;}
  const ctx=propositionContext(),modeName=ctx.mode==='focus-path'?'Focus Path':ctx.mode==='focus-map'?'Focus Map':'Aggregate Map';
  const count=ctx.visible.nodes.filter(n=>!n.meta?.artifactKind).length;
  if(!count){toast('Select and develop a reasoning trace before generating an architectural proposition.');return;}
  const showAggregate=ctx.mode==='aggregate';
  const all=showAggregate
    ?aggregateFormOptions(ctx.state,ctx.visible,{min:3,max:5})
    :supportedOptions(ctx.state,ctx.visible,36,{selectedRootId:ctx.mode==='focus-path'?focusPathRootId:null});
  let layout='all',showCount=showAggregate?Math.min(5,all.length):all.length,selected=0;
  const scopeExplain=ctx.mode==='focus-path'
    ?'Focus Path: choose one recorded reasoning chain and develop a coordinated spatial scheme from its documented moves. A shared Input does not merge different designs.'
    :ctx.mode==='focus-map'
    ?'Focus Map: each reasoning pathway develops into a complete design study with relevant spatial decisions brought together. Compare the alternatives directly or place them side by side on the map.'
    :'Aggregate Map: explore 3–5 spatial propositions drawn from project-wide reasoning. Each is an interpretive form study rather than a verified design. Alternatives and assumptions are clearly labelled.';
  openModal(`<div class="prop-modal"><h2 id="modalTitle">Architectural Propositions · ${modeName}</h2><p class="prop-disclosure">${escapeHtml(scopeExplain)}</p><div class="prop-view-switch" role="tablist" aria-label="Architectural propositions output"><button type="button" class="prop-view-tab active" data-prop-tab="digest" role="tab" aria-selected="true">Reasoning Summary</button><button type="button" class="prop-view-tab" data-prop-tab="visual" role="tab" aria-selected="false">Design Studies</button></div><div id="propOutput" class="prop-option-list" role="tabpanel" aria-live="polite"></div><div class="modal-actions"><button type="button" class="secondary-button" data-close-modal>Close</button></div></div>`,{onOpen:m=>{
    const output=m.querySelector('#propOutput');let choices=[];
    const showMarkdown=()=>{
      const markdown=scopedDigest(ctx);
      output.innerHTML=`<section class="prop-digest-preview"><div class="prop-digest-heading"><h3>${escapeHtml(modeName)} · Reasoning Summary</h3><span>Based on the current recorded trace</span></div><div class="prop-markdown">${escapeHtml(markdown)}</div><div class="prop-inline-actions"><button type="button" class="secondary-button compact" id="propMdSave">Download Markdown</button><button type="button" class="primary-button compact" id="propMdInsert">Place summary on map</button></div></section>`;
      output.querySelector('#propMdSave').onclick=()=>fileDownload(markdown,`TRACEWORK-${ctx.mode}-Summary.md`,'text/markdown');
      output.querySelector('#propMdInsert').onclick=()=>insertOutputNode('reasoning-digest',{markdown,title:`${modeName} · Reasoning Summary`});
    };
    const showDetail=i=>{
      selected=i;const {spec,svg}=choices[i];
      output.innerHTML=`<div class="prop-comparison-tools"><button type="button" class="secondary-button compact" id="propBackToAll">← Back to all ${choices.length} options</button>${choices.length>1?`<label class="prop-choose-label">Pathway <select id="propChoosePath">${choices.map((x,j)=>`<option value="${j}" ${j===i?'selected':''}>${j+1} · ${escapeHtml(x.spec.concept)}</option>`).join('')}</select></label>`:''}</div><h3>${escapeHtml(spec.title)}</h3><p class="prop-disclosure">${spec.fullPavilion?'Complete design study from one pathway':'Exploratory form study from project reasoning'}: ${escapeHtml(spec.layout)}. ${spec.translation==='speculative'?'This geometry is a system-proposed alternative. ':''}Documented support ${spec.documentedScore} points; not structurally, climatically or spatially verified.</p><div class="prop-render" id="propDetailRender"></div><div class="prop-annotation-list">${spec.annotations.map(a=>`<p><strong>${escapeHtml(a.heading)}:</strong> ${escapeHtml(a.form)}<br><em>${escapeHtml(a.grounded?'Recorded source: '+a.sourceText:'System assumption — needs designer review')}</em></p>`).join('')}</div><div class="prop-inline-actions"><button type="button" class="secondary-button compact" id="propSaveSingleSvg">Save SVG</button><button type="button" class="secondary-button compact" id="propPrintSingle">Print rationale sheet</button><button type="button" class="secondary-button compact" id="propMdSingle">Markdown rationale</button><button type="button" class="primary-button compact" id="propInsertSingle">Insert image node</button></div>`;
      output.querySelector('#propDetailRender').innerHTML=svg;
      output.querySelector('#propBackToAll').onclick=()=>renderComparison();
      const chooser=output.querySelector('#propChoosePath');if(chooser)chooser.onchange=()=>showDetail(Number(chooser.value));
      output.querySelector('#propSaveSingleSvg').onclick=()=>fileDownload(svg,`TRACEWORK-${spec.strategy}-Proposition.svg`,'image/svg+xml;charset=utf-8');
      output.querySelector('#propPrintSingle').onclick=()=>propositionPrintSheet(spec,svg);
      output.querySelector('#propMdSingle').onclick=()=>fileDownload(propositionMarkdown(spec),`TRACEWORK-${spec.strategy}-Rationale.md`,'text/markdown');
      output.querySelector('#propInsertSingle').onclick=()=>insertOutputNode('architectural-proposition',{spec,svg,markdown:propositionMarkdown(spec)});
    };
    const renderComparison=()=>{
      const view=choices.slice(0,showCount);
      if(!view.length){output.innerHTML='<p class="prop-disclosure">This trace does not yet contain a documented spatial move. Add a Spatial Consequence to generate a source-led proposal rather than an arbitrary building.</p>';return;}
      const tied=showAggregate?all.filter(x=>x.score===view.at(-1)?.spec.documentedScore).length:0;
      output.innerHTML=`<div class="prop-comparison-tools"><div><strong>${view.length} ${showAggregate?'distinct architectural form studies':'complete pathway design studies'}</strong><p class="prop-disclosure">${showAggregate?`Three to five differentiated form studies from project reasoning. The system may suggest alternative geometry from the same original thought; those options are not new participant records.`:`Each selectable path produces one complete design study, combining documented secondary moves rather than showing disconnected gestures.`}</p></div><div class="prop-inline-actions"><button type="button" class="secondary-button compact ${layout==='all'?'prop-active-layout':''}" id="propAllLayout">Compare side by side</button><button type="button" class="secondary-button compact ${layout==='single'?'prop-active-layout':''}" id="propSingleLayout">One at a time</button>${showAggregate&&all.length>3?`<button type="button" class="secondary-button compact" id="propToggleAll">${showCount===3?'Show up to 5':'Show 3'}</button>`:''}<button type="button" class="secondary-button compact" id="propPrintCompare">Print comparison</button><button type="button" class="primary-button compact" id="propPlaceBoard">Place design studies on map ↗</button></div></div><div class="prop-grid ${layout==='single'?'prop-grid-single':'prop-grid-compare'}">${(layout==='single'?view.slice(selected,selected+1):view).map((x,index)=>{const i=layout==='single'?selected:index;return `<article class="prop-option"><div class="prop-option-heading"><strong>${showAggregate?'FORM STUDY '+(i+1):'PATHWAY STUDY '+(i+1)}</strong><span>${x.spec.translation==='speculative'?'System alternative':`${x.spec.documentedScore} trace points`}</span></div><div class="prop-thumb" data-visual-index="${i}"></div><h3>${escapeHtml(x.spec.concept)}</h3><p class="prop-source-line"><b>Spatial move:</b> ${escapeHtml(x.spec.sourceStatement||'No recorded spatial move')}</p><p class="prop-disclosure">${x.spec.recordedClaims} sourced features · ${x.spec.assumptions.length} stated assumptions ${x.spec.fullPavilion?`· ${(x.spec.secondaryMoves||[]).length} other spatial move(s)`:''}</p><div class="prop-inline-actions"><button type="button" class="primary-button compact" data-prop-index="${i}">Inspect, export or insert →</button></div></article>`;}).join('')}</div>${layout==='single'&&view.length>1?`<div class="prop-inline-actions"><button type="button" id="propPrevSingle" class="secondary-button compact">← Previous</button><button type="button" id="propNextSingle" class="secondary-button compact">Next →</button></div>`:''}<p class="prop-disclosure">Trace scores describe documentary completeness, never design merit. Drawings are source-linked design studies, not replicas of participant work or validated built projects.</p>`;
      output.querySelector('#propAllLayout').onclick=()=>{layout='all';renderComparison();};
      output.querySelector('#propSingleLayout').onclick=()=>{layout='single';selected=Math.min(selected,view.length-1);renderComparison();};
      const toggler=output.querySelector('#propToggleAll');if(toggler)toggler.onclick=()=>{showCount=showCount===3?Math.min(5,all.length):3;selected=0;renderComparison();};
      output.querySelector('#propPrintCompare').onclick=()=>propositionComparisonSheet(view,modeName);
      output.querySelector('#propPlaceBoard').onclick=()=>placePropositionBoard(view,modeName);
      if(layout==='single'&&view.length>1){output.querySelector('#propPrevSingle').onclick=()=>{selected=(selected-1+view.length)%view.length;renderComparison();};output.querySelector('#propNextSingle').onclick=()=>{selected=(selected+1)%view.length;renderComparison();};}
      output.querySelectorAll('[data-visual-index]').forEach(el=>{
        el.innerHTML=choices[Number(el.dataset.visualIndex)].svg;
        // Card preview: crop the source diagram rather than shrinking an entire
        // annotated A3-style sheet to illegibility. Full annotations remain in detail.
        const drawing=el.querySelector('svg');
        if(drawing){drawing.setAttribute('viewBox','20 125 735 575');drawing.setAttribute('aria-label','Design study thumbnail — open for the full annotated sheet');}
      });
      output.querySelectorAll('[data-prop-index]').forEach(button=>button.onclick=()=>showDetail(Number(button.dataset.propIndex)));
    };
    const showVisual=()=>{
      if(!all.length){output.innerHTML='<p class="prop-disclosure">No documented spatial consequence is available yet. Record a spatial move to produce a source-linked design study.</p>';return;}
      if(!choices.length)choices=all.map((opt,i)=>{const spec=makePropositionSpec({state:ctx.state,scoped:ctx.visible,mode:ctx.mode,option:opt,ordinal:i+1});return {spec,svg:renderPropositionSVG(spec)};});
      renderComparison();
    };
    const switchView=view=>{
      m.querySelectorAll('[data-prop-tab]').forEach(button=>{
        const active=button.dataset.propTab===view;
        button.classList.toggle('active',active);
        button.setAttribute('aria-selected',String(active));
      });
      if(view==='digest')showMarkdown();else showVisual();
    };
    m.querySelectorAll('[data-prop-tab]').forEach(button=>button.onclick=()=>switchView(button.dataset.propTab));
    switchView('digest');
  }});
}

function confirmRejectBranch(branchId,node){
  openModal(`<h2 id="modalTitle">Reject this path?</h2><p>The path will stay visible in the reasoning history and can be restored later. Shared source language and other branches will remain active.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Keep path</button><button class="danger-button" id="confirmRejectPath">Reject path</button></div>`,{onOpen:m=>m.querySelector('#confirmRejectPath').onclick=()=>{
    updateState(s=>rejectBranch(s,branchId)); logEvent('Path rejected',node?.label||'Retained in project history'); closeModal(); renderWorkspace(); toast('Path rejected — select it to restore.');
  }});
}

function confirmReturnHome(){
  persistViewport();saveProject(getState());
  openModal(`<h2 id="modalTitle">Return to home?</h2><p>Your current trace is saved in this browser. Going home closes the active workspace session. Pathway Bank, My Trace and Discussion stay accessible, and the project can be reopened from Your traces.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Stay here</button><button class="primary-button compact" id="confirmHome">Go home</button></div>`,{onOpen:m=>m.querySelector('#confirmHome').onclick=()=>{closeModal();resetState();selectedEdgeId=null;selectedNodeIds.clear();traceIssueNodeIds.clear();showLanding();}});
}

function confirmLeaveForAbout(){
  persistViewport();saveProject(getState());
  openModal(`<h2 id="modalTitle">Open About?</h2><p>Your current trace is saved locally before you leave the workspace.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Stay here</button><button class="primary-button compact" id="confirmAbout">Open About</button></div>`,{onOpen:m=>m.querySelector('#confirmAbout').onclick=()=>{window.location.href='about.html';}});
}

function confirmResetLocalData(){
  openModal(`<h2 id="modalTitle">Reset local TRACEWORK data?</h2><p>This removes traces saved in this browser and clears the current workspace. This cannot be undone. It also resets tutorial progress on this browser. Examples are available later through Try long + short examples; nothing will be added automatically.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Cancel</button><button class="danger-button" id="confirmResetData">Reset local data</button></div>`,{onOpen:m=>m.querySelector('#confirmResetData').onclick=()=>{
    const ok=clearAllProjects();
    if(!ok){toast('Could not clear local data.');return;}
    resetTutorialProgress();
    resetState();
    closeModal();
    els.briefLanding.value='';
    if(els.projectNameLanding)els.projectNameLanding.value='';
    setSaveStatus('Local data reset',false);
    renderProjectShelf();
    showLanding();
    toast('Local TRACEWORK data cleared.');
  }});
}

function openMapExport(){
  if(!getState().nodes?.length){toast('Add a reasoning node before exporting a map.');return;}
  const label=workspaceMapMode==='aggregate'?`Aggregate ${aggregateArrangeBlend===100?'Arrange':'Original'} Map`:`${focusPathRootId?'Focus Path':'Focus Map'} · ${focusArrangeMode?'Arrange':'Original'}`;
  // Preview uses a separate SVG snapshot; it does not change saved node positions,
  // map filters, branching history, or any existing workspace state.
  openModal(`<h2 id="modalTitle">Export reasoning map</h2>
    <p>Choose what the exported map includes, then preview the <strong>${escapeHtml(label)}</strong> before downloading. For all pathways, first switch to Aggregate Map → Show all.</p>
    <div class="map-export-options">
      <label class="map-export-toggle"><input type="checkbox" id="exportHideRejected" checked><span><strong>Hide rejected pathways</strong><small>Leave rejected reasoning in the TRACEWORK project; exclude it from this export only.</small></span></label>
      <label class="map-export-toggle"><input type="checkbox" id="exportAutoArrange" checked><span><strong>Automatically arrange export</strong><small>Create a clean, connected presentation layout without moving your saved nodes.</small></span></label>
    </div>
    <div class="map-export-preview-actions"><button class="primary-button compact" id="exportPreviewButton" type="button">Preview map</button><span id="exportPreviewStatus" role="status">No preview generated yet.</span></div>
    <div class="map-export-preview" id="exportPreviewArea" hidden><div id="exportPreviewArtwork" class="map-export-preview-artwork"></div></div>
    <div class="export-map-choice-grid"><button type="button" class="secondary-button export-map-choice" data-map-format="svg" disabled><strong>SVG · Editable vector</strong><small>For Illustrator, Inkscape and large boards</small></button>
    <button type="button" class="secondary-button export-map-choice" data-map-format="png" disabled><strong>PNG · High-resolution image</strong><small>For presentations and documentation</small></button>
    <button type="button" class="secondary-button export-map-choice" data-map-format="pdf" disabled><strong>PDF · Vector print</strong><small>A3 landscape, choose Save as PDF in Chrome</small></button></div>
    <p class="export-map-note">The preview is the version that will be exported. Hidden branches and auto-arranged positions are <strong>not</strong> deleted or saved back to the project.</p>
    <div class="modal-actions"><button type="button" class="secondary-button" data-close-modal>Close</button></div>`,{onOpen:m=>{
    const hide=m.querySelector('#exportHideRejected'),arrange=m.querySelector('#exportAutoArrange');
    const area=m.querySelector('#exportPreviewArea'),artwork=m.querySelector('#exportPreviewArtwork');
    const status=m.querySelector('#exportPreviewStatus'),choices=[...m.querySelectorAll('[data-map-format]')];
    let preview=null;
    const buildPreview=()=>{
      try{
        const snap=createMapSnapshot({
          surface:els.graphSurface,edges:els.graphEdges,projectEdges:getState().edges||[],
          projectName:getState().projectName,viewLabel:label,frameworkLabel:getFramework(getState().frameworkId).label,
          omitRejected:hide.checked,arrange:arrange.checked
        });
        // SVG content is generated from escaped node labels and trusted CSS colours.
        artwork.innerHTML=snap.svg;
        area.hidden=false;preview=snap;
        choices.forEach(button=>button.disabled=false);
        status.textContent=`Preview ready: ${snap.count} nodes, ${snap.wireCount} connections${snap.hiddenCount?`, ${snap.hiddenCount} rejected nodes hidden`:''}.`;
      }catch(err){
        preview=null;artwork.innerHTML='';area.hidden=true;
        choices.forEach(button=>button.disabled=true);
        status.textContent=err.message||'Could not preview map.';
      }
    };
    m.querySelector('#exportPreviewButton').onclick=buildPreview;
    // A changed option never exports a stale preview.
    hide.onchange=()=>{if(preview)buildPreview();};
    arrange.onchange=()=>{if(preview)buildPreview();};
    choices.forEach(button=>button.onclick=async()=>{
      if(!preview)return;
      const fmt=button.dataset.mapFormat,snap=preview;
      if(fmt==='pdf'){try{exportMapPDF(snap);}catch(err){toast(err.message);}return;}
      button.disabled=true;
      try{if(fmt==='svg')exportMapSVG(snap);else await exportMapPNG(snap);toast(`${fmt.toUpperCase()} map exported.`);}
      catch(err){toast(`Map export failed: ${err.message}`);}
      finally{button.disabled=false;}
    });
  }});
}
function openProjectAudit(){
  const a=auditProject(getState());
  const row=(items,type)=>items.length?items.map(v=>`<li>${escapeHtml(v)}</li>`).join(''):`<li>No ${type} identified.</li>`;
  openModal(`<h2 id="modalTitle">TRACEWORK project check</h2>
  <p>Checks recorded connections, source traceability and open pathways. This is <strong>not</strong> a judgement of architectural quality.</p>
  <div class="project-audit-stats"><span>${a.stats.nodes} nodes</span><span>${a.stats.edges} wires</span><span>${a.stats.hotspots} hotspots</span><span>${a.stats.branches} branches</span></div>
  <h3>${a.technicallyConsistent?'✓ Structure consistent':'Structural issues to review'}</h3><ul>${row(a.problems,'structural errors')}</ul>
  <h3>Open reasoning opportunities</h3><ul>${row(a.warnings,'additional issues')}</ul>
  <p>Observed categories: ${a.stages.map(s=>`${escapeHtml(s.label)} ${s.recorded?'✓':'–'}`).join(' · ')}</p>
  <div class="modal-actions"><button class="secondary-button" data-close-modal>Close</button></div>`);
}
async function handleProjectImport(e){
  const input=e.currentTarget,file=input.files?.[0];input.value='';if(!file)return;
  if(file.size>12_000_000){toast('JSON backup is too large (12 MB maximum).');return;}
  let data;try{data=JSON.parse(await file.text());}catch{toast('This is not valid JSON.');return;}
  const candidate=data?.project?.brief?data.project:(data?.brief?data:null);
  if(!candidate || !Array.isArray(candidate.nodes)||!Array.isArray(candidate.edges)||!Array.isArray(candidate.hotspots)){
    toast('File is not a TRACEWORK project export.');return;
  }
  const audit=auditProject(candidate);
  if(audit.problems.length){toast('This project has structural errors and was not imported.');openModal(`<h2 id="modalTitle">Import blocked</h2><p>${audit.problems.map(x=>escapeHtml(x)).join('<br>')}</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Close</button></div>`);return;}
  const existing=new Set(listProjects().map(x=>x.projectId));
  const project=structuredClone(candidate);
  if(!project.projectId||existing.has(project.projectId))project.projectId=`tw-import-${Date.now()}`;
  const prevName=String(project.projectName||'Recovered trace');
  project.projectName=existing.has(candidate.projectId)?`${prevName} (imported copy)`:prevName;
  project.updatedAt=new Date().toISOString();
  openModal(`<h2 id="modalTitle">Import TRACEWORK project?</h2><p><strong>${escapeHtml(project.projectName)}</strong> has ${project.nodes.length} nodes and ${project.edges.length} connections. It will be saved as a separate local project; existing work is not overwritten.</p>
  ${audit.warnings.length?`<p>${audit.warnings.length} reasoning warnings can be reviewed after import.</p>`:''}
  <div class="modal-actions"><button class="secondary-button" data-close-modal>Cancel</button><button class="primary-button compact" id="confirmProjectImport">Import copy</button></div>`,{onOpen:m=>m.querySelector('#confirmProjectImport').onclick=()=>{
    if(!ensureProject(project)){toast('Could not save imported project. Check available browser storage.');return;}
    closeModal();renderProjectShelf();toast('Project imported as a new local trace.');
  }});
}
function confirmNewProject(){ openModal(`<h2 id="modalTitle">Start a new trace?</h2><p>Your current trace stays saved in this browser. You can reopen it from the project shelf.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Keep working</button><button class="secondary-button" id="exportBeforeNew">Export first</button><button class="primary-button compact" id="confirmNew">Start new</button></div>`,{onOpen:m=>{m.querySelector('#exportBeforeNew').onclick=()=>exportProject(getState());m.querySelector('#confirmNew').onclick=()=>{saveProject(getState());resetState();closeModal();els.briefLanding.value='';if(els.projectNameLanding)els.projectNameLanding.value='';showLanding();};}}); }


// Deliberately user-invoked restoration. A previously deleted sample remains
// dismissed on page load, but can always be restored from the bundled fixtures.
// Existing sample edits and all other local projects are left untouched.
async function restoreTestExamples(){
  const button=$('#restoreTestExamplesButton');
  const files=['test-project.json','aggregate-test-project.json'];
  if(button){button.disabled=true;button.textContent='Restoring examples…';}
  try{
    const fixtures=await Promise.all(files.map(async name=>{
      const response=await fetch(`./data/${name}?v=c2.1`,{cache:'no-store'});
      if(!response.ok)throw new Error(`Cannot load ${name} (${response.status})`);
      const item=await response.json();
      if(!item.projectId||!item.brief||!Array.isArray(item.nodes))throw new Error(`Invalid example: ${name}`);
      return item;
    }));
    let added=0;
    for(const project of fixtures){
      if(ensureProject(project))added++;
      else if(!listProjects().some(p=>p.projectId===project.projectId))throw new Error('The browser could not save an example.');
    }
    // Reset dismissal markers only after both fixtures are confirmed saved.
    localStorage.removeItem('tracework.dismissedTestProject.v1');
    localStorage.removeItem('tracework.dismissedAggregateTestProject.v1');
    renderProjectShelf();
    const shelf=$('#projectShelfWrap');
    if(shelf&&!shelf.classList.contains('hidden'))shelf.scrollIntoView({behavior:'smooth',block:'start'});
    toast(added?`Restored ${added} test example${added===1?'':'s'}. Open them under Your traces.`:'Both examples are already saved. Open them under Your traces.');
  }catch(error){console.error('Example restoration failed',error);toast('Could not restore example traces. Existing projects were not changed.');}
  finally{if(button){button.disabled=false;button.textContent='Try long + short examples';}}
}

async function seedTestProject(){
  try{
    if(localStorage.getItem('tracework.dismissedTestProject.v1')==='1') return;
    const project=await (await fetch('./data/test-project.json')).json();
    ensureProject(project);
  }catch(err){ console.warn('TRACEWORK test project could not be seeded.',err); }
}

async function seedAggregateTestProject(){
  try{
    if(localStorage.getItem('tracework.dismissedAggregateTestProject.v1')==='1') return;
    const project=await (await fetch('./data/aggregate-test-project.json')).json();
    ensureProject(project);
  }catch(err){ console.warn('TRACEWORK aggregate test project could not be seeded.',err); }
}

function stripLegacyAggregateDemo(project){
  if(!project?.nodes?.length) return false;
  const demoIds=new Set(project.nodes.filter(n=>n?.meta?.aggregateDemoPreset).map(n=>n.id));
  if(!demoIds.size && !(project.edges||[]).some(e=>e?.aggregateDemoPreset)) return false;
  project.nodes=(project.nodes||[]).filter(n=>!demoIds.has(n.id));
  project.edges=(project.edges||[]).filter(e=>!e?.aggregateDemoPreset && !demoIds.has(e.source) && !demoIds.has(e.target));
  if(demoIds.has(project.activeNodeId)) project.activeNodeId=null;
  project.updatedAt=new Date().toISOString();
  return true;
}

// Two canonical test fixtures only. The browser may also contain older tests
// saved under unrelated generated IDs; those are retired only with confirmation.
const CANONICAL_TEST_IDS=new Set(['tracework-test-pavilion','tracework-test-aggregate-pavilion-v1']);
function isNamedTestProject(p){
  return Boolean(p && (
    String(p.projectId||'').startsWith('tracework-test-') ||
    /\b(?:test|testing)\b/i.test(String(p.projectName||''))
  ));
}
function shelfName(p){
  if(p?.projectId==='tracework-test-pavilion')return 'Short brief — Flexible Pavilion';
  if(p?.projectId==='tracework-test-aggregate-pavilion-v1')return 'Long brief — Flexible Pavilion';
  return p?.projectName||'Untitled trace';
}
function downloadRetiredTestBackup(projects){
  if(!projects.length)return;
  const content={exportedAt:new Date().toISOString(),purpose:'Retired TRACEWORK test projects',projects};
  const blob=new Blob([JSON.stringify(content,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`tracework-retired-tests-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function confirmCleanTestProjects(){
  const retired=listProjects().filter(p=>isNamedTestProject(p) && !CANONICAL_TEST_IDS.has(p.projectId));
  if(!retired.length)return;
  const descriptions=retired.map(p=>`<li>${escapeHtml(shelfName(p))}</li>`).join('');
  openModal(`<h2 id="modalTitle">Keep only the two sample projects?</h2>
    <p>Retire ${retired.length} older test trace${retired.length===1?'':'s'} listed below. TRACEWORK downloads a JSON backup before removal. The long and short test projects, and any other saved work, will stay.</p>
    <ul>${descriptions}</ul>
    <div class="modal-actions"><button class="secondary-button" data-close-modal>Cancel</button><button class="primary-button compact" id="confirmCleanTests">Back up and tidy tests</button></div>`,{
      onOpen:m=>m.querySelector('#confirmCleanTests').onclick=async()=>{
        // Preserve the user's modifications to canonical tests. Recreate them
        // only if missing, then retire only extra test-labelled traces.
        try{
          const names=['test-project.json','aggregate-test-project.json'];
          for(const name of names){
            const response=await fetch(`./data/${name}?v=b1.6`);
            if(response.ok)ensureProject(await response.json());
          }
          localStorage.removeItem('tracework.dismissedTestProject.v1');
          localStorage.removeItem('tracework.dismissedAggregateTestProject.v1');
          downloadRetiredTestBackup(retired);
          retired.forEach(p=>deleteProject(p.projectId));
          closeModal();renderProjectShelf();toast(`Tidied ${retired.length} older test traces. Backup downloaded.`);
        }catch(err){console.error(err);toast('Could not tidy tests. Your saved traces were not deleted.');}
      }
    });
}

function renderProjectShelf(){
  const wrap=$('#projectShelfWrap'),root=$('#projectShelf');
  if(!wrap||!root)return;
  const allProjects=listProjects();
  const projects=allProjects;
  wrap.classList.toggle('hidden',!projects.length);
  root.innerHTML=projects.map(p=>`<article class="project-card"><label class="project-select-label"><input type="checkbox" data-merge-project="${escapeHtml(p.projectId)}" ${projectMergeSelection.has(p.projectId)?'checked':''} aria-label="Select ${escapeHtml(shelfName(p))} for combining"></label><div class="project-description"><span class="project-card-label">${String(p.projectId||'').startsWith('tracework-test-')?'TEST PROJECT':'SAVED TRACE'}</span><h3>${escapeHtml(shelfName(p))}</h3><p>${escapeHtml((p.brief||'').slice(0,105))}${(p.brief||'').length>105?'…':''}</p></div><div class="project-card-actions"><button class="secondary-button compact-project" data-open-project="${escapeHtml(p.projectId)}">Open</button><button class="project-delete-button" data-delete-project="${escapeHtml(p.projectId)}" aria-label="Delete ${escapeHtml(p.projectName||'trace')}" title="Delete trace">×</button></div></article>`).join('');
  const combineButton=$('#combineProjectsButton');
  if(combineButton){
    combineButton.disabled=projectMergeSelection.size<2;
    combineButton.textContent=projectMergeSelection.size>=2?`Combine ${projectMergeSelection.size} projects`:'Combine projects (select 2+)';
    combineButton.onclick=confirmCombineProjects;
  }
  root.querySelectorAll('[data-merge-project]').forEach(input=>input.onchange=()=>{
    if(input.checked)projectMergeSelection.add(input.dataset.mergeProject);
    else projectMergeSelection.delete(input.dataset.mergeProject);
    if(combineButton){combineButton.disabled=projectMergeSelection.size<2;combineButton.textContent=projectMergeSelection.size>=2?`Combine ${projectMergeSelection.size} projects`:'Combine projects (select 2+)';}
  });
  root.querySelectorAll('[data-open-project]').forEach(b=>b.onclick=()=>openSavedProject(b.dataset.openProject));
  root.querySelectorAll('[data-delete-project]').forEach(b=>b.onclick=e=>{ e.stopPropagation(); confirmDeleteSavedProject(b.dataset.deleteProject); });
}

// Combines a COPY of the selected project briefs, their hotspots and their
// reasoning graphs. Original projects remain untouched in local storage.
function confirmCombineProjects(){
  const parts=listProjects().filter(p=>projectMergeSelection.has(p.projectId));
  if(parts.length<2){toast('Select at least two projects first.');return;}
  const summary=parts.map(p=>`<li>${escapeHtml(shelfName(p))}</li>`).join('');
  openModal(`<h2 id="modalTitle">Combine ${parts.length} projects?</h2><p>Creates a NEW project with each original brief kept as a separate source section. Hotspots, nodes and connections are copied into it. Your originals stay untouched.</p><ul>${summary}</ul><label class="combine-name-label">Name of combined project<input class="field-input" id="combinedProjectName" value="Combined trace" maxlength="80"></label><div class="modal-actions"><button class="secondary-button" data-close-modal>Cancel</button><button class="primary-button compact" id="confirmCombineProjects">Create combined project</button></div>`,{
    onOpen:m=>m.querySelector('#confirmCombineProjects').onclick=()=>{
      const title=m.querySelector('#combinedProjectName').value.trim()||'Combined trace';
      try{
        const merged=combineProjectCopies(parts,title);
        if(!saveProject(merged))throw new Error('Browser storage is full or unavailable');
        projectMergeSelection.clear();closeModal();replaceState(merged);enterApp(false);
        toast(`Combined ${parts.length} projects into “${title}”. Originals were preserved.`);
      }catch(err){console.error(err);toast('Could not save the combined project. Originals remain unchanged.');}
    }
  });
}
function combineProjectCopies(parts,title){
  let brief='';
  const chunks=[],hotspots=[],nodes=[],edges=[],history=[],sourceProjects=[];
  for(const [idx,p] of parts.entries()){
    const prefix=`merged-${idx+1}-`;
    const source=String(p.brief||'');
    if(!source)continue;
    sourceProjects.push({id:p.projectId,name:shelfName(p),framework:p.frameworkId||'tracework',sourceFile:p.sourceFileName||null});
    if(brief)brief+='\n\n';
    const start=brief.length;
    brief+=source;
    const chunkId=`${prefix}source`;
    chunks.push({id:chunkId,index:chunks.length,title:shelfName(p),start,end:brief.length,text:source,manual:true});
    const sourceHotspots=repairHotspotRanges(source,p.hotspots||[]);
    for(const h of sourceHotspots){
      hotspots.push({...h,id:prefix+h.id,chunkId,start:start+h.start,end:start+h.end});
    }
    for(const node of p.nodes||[]){
      const meta={...(node.meta||{}),sourceProjectId:p.projectId,sourceProjectName:shelfName(p)};
      if(meta.hotspotId)meta.hotspotId=prefix+meta.hotspotId;
      if(meta.groupId)meta.groupId=prefix+meta.groupId;
      nodes.push({...structuredClone(node),id:prefix+node.id,branchId:prefix+(node.branchId||'branch-1'),meta,
        x:Number.isFinite(Number(node.x))?Number(node.x):null,
        y:Number.isFinite(Number(node.y))?Number(node.y)+(idx*230):null});
    }
    for(const edge of p.edges||[])edges.push({...structuredClone(edge),id:prefix+edge.id,source:prefix+edge.source,target:prefix+edge.target});
    history.push({id:`${prefix}merge`,action:'Project included',detail:shelfName(p),time:new Date().toISOString()});
  }
  return {version:2,projectId:`tw-combined-${Date.now()}`,projectName:title,brief,briefMode:'document',briefChunks:chunks,
    activeBriefChunkId:chunks[0]?.id||null,sourceFileName:'Combined projects',frameworkId:parts[0]?.frameworkId||'tracework',
    frameworkLocked:false,hotspots,nodes,edges,selectedHotspotId:null,activeNodeId:null,activeBranchId:'branch-1',
    view:'workspace',history,sourceProjects,comments:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
}

function openSavedProject(id){
  if(getState().brief)persistViewport();
  const project=loadProject(id);
  if(!project)return;
  repairSharedInputs(project);
  if(stripLegacyAggregateDemo(project)) saveProject(project);
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
      if(id==='tracework-test-aggregate-pavilion-v1') localStorage.setItem('tracework.dismissedAggregateTestProject.v1','1');
      if(getState().projectId===id) resetState();
      closeModal();
      renderProjectShelf();
      toast('Trace deleted from this browser.');
    }
  });
}

function renderDiscussion(){
  const state=getState(),list=$('#discussionList'),scope=$('#discussionScope'),preview=$('#discussionAnchorPreview');
  const text=$('#discussionText'),button=$('#addDiscussionButton'); if(text){text.disabled=false;text.placeholder='Question, critique, rationale or note for another designer…';} if(button)button.disabled=false; if(scope)scope.disabled=false;
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

let classificationHelpPopover=null;
function hideClassificationHelp(){
  classificationHelpPopover?.remove();
  classificationHelpPopover=null;
}
function showClassificationHelp(target){
  const help=target?.dataset?.help;
  if(!help)return;
  hideClassificationHelp();
  const tip=document.createElement('div');
  tip.className='classification-help-popover';
  tip.textContent=help;
  document.body.appendChild(tip);
  const r=target.getBoundingClientRect();
  const tr=tip.getBoundingClientRect();
  const gap=10,pad=12;
  let left=r.left+(r.width/2)-(tr.width/2);
  left=Math.max(pad,Math.min(left,window.innerWidth-tr.width-pad));
  let top=r.top-tr.height-gap;
  if(top<pad) top=r.bottom+gap;
  top=Math.max(pad,Math.min(top,window.innerHeight-tr.height-pad));
  tip.style.left=`${Math.round(left)}px`;
  tip.style.top=`${Math.round(top)}px`;
  classificationHelpPopover=tip;
}
function bindClassificationHelp(){
  // Help is delegated globally so every role/legend/classifier tooltip uses the
  // same viewport-aware popover. This avoids pseudo-elements being clipped by
  // half-screen panels or the command dock.
}
function bindGlobalHelpPopovers(){
  if(document.documentElement.dataset.helpPopoversBound==='1')return;
  document.documentElement.dataset.helpPopoversBound='1';
  document.addEventListener('pointerover',e=>{
    const target=e.target.closest?.('[data-help]');
    if(!target)return;
    if(e.relatedTarget && target.contains(e.relatedTarget))return;
    showClassificationHelp(target);
  });
  document.addEventListener('pointerout',e=>{
    const target=e.target.closest?.('[data-help]');
    if(!target)return;
    if(e.relatedTarget && target.contains(e.relatedTarget))return;
    hideClassificationHelp();
  });
  document.addEventListener('click',e=>{
    const target=e.target.closest?.('.metadata-help, .thought-help-button');
    if(!target){if(classificationHelpPopover && !e.target.closest?.('.classification-help-popover'))hideClassificationHelp();return;}
    e.preventDefault();e.stopPropagation();
    showClassificationHelp(target);
  });
  document.addEventListener('focusin',e=>{ const target=e.target.closest?.('[data-help]'); if(target)showClassificationHelp(target); });
  document.addEventListener('focusout',e=>{ if(e.target.closest?.('[data-help]'))hideClassificationHelp(); });
  window.addEventListener('resize',hideClassificationHelp,{passive:true});
  window.addEventListener('scroll',hideClassificationHelp,{passive:true,capture:true});
}

function updateThoughtSuggestion(){
  if(!els.freeThoughtInput)return;
  const text=els.freeThoughtInput.value.trim();
  const state=getState();
  const framework=getFramework(state.frameworkId||'tracework');
  const commandFrameworkId=framework.id==='freeform'?'tracework':framework.id;
  const active=state.nodes.find(n=>n.id===state.activeNodeId);
  const activeRole=active?frameworkRoleForNode(active,commandFrameworkId)?.id:null;
  const result=commandFrameworkId==='tracework'
    ? classifyThought(text,{afterType:active?.type==='note'?null:active?.type,provenance:els.thoughtProvenanceSelect?.value||'designer'})
    : classifyFrameworkThought(text,commandFrameworkId,{canonicalType:null,afterRole:activeRole});
  const hasText=Boolean(text);
  document.getElementById('thoughtDock')?.classList.toggle('has-thought-text',hasText);
  els.addFreeThoughtButton.disabled=!hasText;
  els.addLooseNoteButton.disabled=!hasText;

  if(framework.id==='freeform') els.addFreeThoughtButton.textContent=els.thoughtTypeSelect.dataset.manual==='1'?'Add with Chosen Role →':'Add to Field (Unclassified) →';
  if(!hasText){
    els.thoughtReason.textContent=framework.id==='freeform'
      ? 'Start typing to see an optional TRACEWORK structure suggestion.'
      : `Start typing to see a ${framework.shortLabel} suggestion.`;
    els.thoughtTypeSelect.dataset.manual='';
    if(els.thoughtMatches) els.thoughtMatches.innerHTML='';
    return;
  }

  const manual=els.thoughtTypeSelect.dataset.manual==='1';
  const suggested=commandFrameworkId==='tracework'?result.type:result.role;
  if(!manual && suggested) els.thoughtTypeSelect.value=suggested;
  const selected=els.thoughtTypeSelect.value;
  const best=result.matches?.[0];
  const selectedLabel=commandFrameworkId==='tracework'
    ? (typeLabels[selected]||selected)
    : (getFrameworkCategory(commandFrameworkId,selected)?.label||selected);
  const prefix=framework.id==='freeform'?'Optional structure':framework.shortLabel;
  els.thoughtReason.textContent=manual
    ? `Manual override · ${prefix} will read this as ${selectedLabel}.`
    : `${best?.strength??Math.round((result.confidence||0)*100)}% match · ${result.reason}`;

  if(els.thoughtMatches){
    const allMatches=result.matches||[];
    const visibleMatches=commandFrameworkId==='tracework'?allMatches:allMatches.slice(0,4);
    els.thoughtMatches.innerHTML=visibleMatches.map((m,i)=>{
      const role=commandFrameworkId==='tracework'?m.type:m.role;
      const label=commandFrameworkId==='tracework'?(typeLabels[role]||role):(m.category?.label||role);
      const definition=m.definition||m.category?.description||'Framework role';
      const cues=(m.cues||[]).length?` Cues: ${(m.cues||[]).join(' + ')}.`:'';
      const distinction=m.distinction?` ${m.distinction}`:'';
      const help=`${definition}${cues}${distinction} Match strength is a wording fit, not a probability.`;
      return `<button type="button" class="thought-match classification-help ${role===selected?'selected':''} ${i===0?'strongest':''}" data-help="${escapeHtml(help)}" data-match-role="${escapeHtml(role)}"><span>${escapeHtml(label)}</span><strong>${m.strength}%</strong></button>`;
    }).join('');
    els.thoughtMatches.querySelectorAll('[data-match-role]').forEach(b=>b.onclick=()=>{
      els.thoughtTypeSelect.value=b.dataset.matchRole;
      els.thoughtTypeSelect.dataset.manual='1';
      updateThoughtSuggestion();
    });
    bindClassificationHelp();
  }
}

function visibleCanvasPlacement(seed=0){
  const zoom=Math.max(.1,canvasZoom||1);
  const originX=Number(els.graphSurface?.dataset.originX||360);
  const originY=Number(els.graphSurface?.dataset.originY||680);
  const left=(els.graphViewport?.scrollLeft||0)/zoom;
  const top=(els.graphViewport?.scrollTop||0)/zoom;
  const width=(els.graphViewport?.clientWidth||900)/zoom;
  const height=(els.graphViewport?.clientHeight||620)/zoom;
  const offsets=[[-90,-50],[70,-35],[-45,65],[95,55],[0,0]];
  const [ox,oy]=offsets[Math.abs(seed)%offsets.length];
  return {x:Math.max(-300,left+width*.5-originX-115+ox),y:Math.max(-500,top+height*.48-originY-50+oy)};
}

function addFreeThought(){
  const text=els.freeThoughtInput.value.trim(); if(!text)return;
  // In Freeform, no inferred category is imposed unless the user explicitly chooses one.
  if(getState().frameworkId==='freeform' && els.thoughtTypeSelect.dataset.manual!=='1'){addLooseNote();return;}
  focusPathRootId=null;
  checkpoint('add reasoning node');
  const state=getState();
  const framework=getFramework(state.frameworkId||'tracework');
  const commandFrameworkId=framework.id==='freeform'?'tracework':framework.id;
  const active=state.nodes.find(n=>n.id===state.activeNodeId);
  const activeRole=active?frameworkRoleForNode(active,commandFrameworkId)?.id:null;
  const classification=commandFrameworkId==='tracework'
    ? classifyThought(text,{afterType:active?.type==='note'?null:active?.type,provenance:els.thoughtProvenanceSelect?.value||'designer'})
    : classifyFrameworkThought(text,commandFrameworkId,{afterRole:activeRole});
  const selectedRole=els.thoughtTypeSelect.value||(commandFrameworkId==='tracework'?classification.type:classification.role)||'interpretation';
  const type=commandFrameworkId==='tracework'
    ? selectedRole
    : canonicalTypeForFrameworkRole(commandFrameworkId,selectedRole,classification.category?.canonicalType||'interpretation');
  const selectedHotspotId=workspaceMapMode==='aggregate' ? (active?.meta?.hotspotId || state.selectedHotspotId || null) : state.selectedHotspotId;
  const scoped=workspaceMapMode==='aggregate'?aggregateTrace(state,{ignoreFilters:true}):scopedTrace(state);
  const placement=visibleCanvasPlacement(scoped.nodes.length);
  const branchId=active?.branchId||`free-${Date.now()}`;
  let created=null;
  updateState(s=>{
    const provenance=els.thoughtProvenanceSelect?.value||'designer';
    const frameworkRoles=commandFrameworkId!=='tracework'?{[commandFrameworkId]:selectedRole}:{};
    const node=createNode({type,label:text,branchId,x:placement.x,y:placement.y,meta:{freeform:true,hotspotId:selectedHotspotId,classifiedBy:framework.id==='freeform'?'TRACEWORK (optional)':framework.label,classificationReason:classification.reason,classificationConfidence:classification.confidence,provenance,attributionName:els.thoughtAttributionName?.value.trim()||'',generationActivity:els.thoughtGenerationActivity?.value||'unspecified',evidenceKind:els.thoughtEvidenceKind?.value||'unspecified',activityDetails:els.thoughtActivityDetails?.value.trim()||'',recordTitle:els.thoughtRecordTitle?.value.trim()||'',sourceReference:els.thoughtSourceReference?.value.trim()||'',frameworkRoles}});
    s.nodes.push(node);
    s.activeNodeId=node.id; s.activeBranchId=branchId;
    created=node;
  });
  lastAddedNodeId=created?.id||null;
  if(created?.id){selectedNodeIds.clear();selectedNodeIds.add(created.id);}
  const visibleRole=commandFrameworkId==='tracework'?(typeLabels[type]||type):(getFrameworkCategory(commandFrameworkId,selectedRole)?.label||selectedRole);
  logEvent('Free reasoning added',`${visibleRole} · ${text}`);
  els.freeThoughtInput.value=''; els.thoughtTypeSelect.dataset.manual=''; if(els.thoughtProvenanceSelect)els.thoughtProvenanceSelect.value='designer';if(els.thoughtGenerationActivity)els.thoughtGenerationActivity.value='unspecified';if(els.thoughtEvidenceKind)els.thoughtEvidenceKind.value='unspecified';if(els.thoughtAttributionName)els.thoughtAttributionName.value='';for(const el of [els.thoughtActivityDetails,els.thoughtRecordTitle,els.thoughtSourceReference])if(el)el.value=''; updateThoughtSuggestion(); renderWorkspace();
  toast(`Added as ${visibleRole}${commandFrameworkId==='tracework'?'':` · ${getFramework(commandFrameworkId).shortLabel}`}.`);
}

function addLooseNote(){
  const text=els.freeThoughtInput.value.trim(); if(!text)return;
  focusPathRootId=null;
  checkpoint('add note');
  const state=getState(); const active=state.nodes.find(n=>n.id===state.activeNodeId);
  const classification=classifyThought(text,{afterType:active?.type==='note'?null:active?.type,provenance:els.thoughtProvenanceSelect?.value||'designer'});
  const scoped=workspaceMapMode==='aggregate'?aggregateTrace(state,{ignoreFilters:true}):scopedTrace(state); const placement=visibleCanvasPlacement(scoped.nodes.length+2);
  const selectedHotspotId=workspaceMapMode==='aggregate' ? (active?.meta?.hotspotId || state.selectedHotspotId || null) : state.selectedHotspotId;
  let created=null;
  updateState(s=>{
    const provenance=els.thoughtProvenanceSelect?.value||'designer';
    const node=createNode({type:'note',label:text,branchId:`note-${Date.now()}`,x:placement.x,y:placement.y,meta:{hotspotId:selectedHotspotId,suggestedType:classification.type||'interpretation',classificationReason:classification.reason,classificationConfidence:classification.confidence,provenance,attributionName:els.thoughtAttributionName?.value.trim()||'',generationActivity:els.thoughtGenerationActivity?.value||'unspecified',evidenceKind:els.thoughtEvidenceKind?.value||'unspecified',activityDetails:els.thoughtActivityDetails?.value.trim()||'',recordTitle:els.thoughtRecordTitle?.value.trim()||'',sourceReference:els.thoughtSourceReference?.value.trim()||''}});
    s.nodes.push(node); s.activeNodeId=node.id; created=node;
  });
  lastAddedNodeId=created?.id||null;
  if(created?.id){selectedNodeIds.clear();selectedNodeIds.add(created.id);}
  logEvent('Loose note added',text);
  els.freeThoughtInput.value=''; els.thoughtTypeSelect.dataset.manual=''; if(els.thoughtProvenanceSelect)els.thoughtProvenanceSelect.value='designer';if(els.thoughtGenerationActivity)els.thoughtGenerationActivity.value='unspecified';if(els.thoughtEvidenceKind)els.thoughtEvidenceKind.value='unspecified';if(els.thoughtAttributionName)els.thoughtAttributionName.value='';for(const el of [els.thoughtActivityDetails,els.thoughtRecordTitle,els.thoughtSourceReference])if(el)el.value=''; updateThoughtSuggestion(); renderWorkspace();
  toast('Added as an unclassified note.');
}

function convertNote(node,type){
  if(!node || node.type!=='note')return;
  checkpoint('classify note');
  updateState(s=>{ const n=s.nodes.find(x=>x.id===node.id); if(!n)return; n.type=type; n.meta={...n.meta,convertedFromNote:true,freeform:true}; delete n.meta.suggestedType; n.updatedAt=new Date().toISOString(); });
  logEvent('Note classified',`${typeLabels[type]||type} · ${node.label}`); renderWorkspace(); toast(`Converted to ${typeLabels[type]||type}.`);
}

function connectNodes(source,target,result){
  if(!source || !target){
    coach('Gap in Reasoning','The wire needs to land on another node. A TRACEWORK connection states an explicit reasoning dependency, so leave the thought floating if the relationship is not clear yet.',{duration:6500,pinnable:true});
    return;
  }
  const provenanceGap=provenanceConnectionCheck(source,target);
  if(!result?.ok){
    coach('Gap in Reasoning',`${result?.reason||'Those reasoning moves cannot be connected yet.'}${result?.detail?' '+result.detail:''} ${bridgePrompt(source,target)}`,{duration:8500,pinnable:true});
    // Reasoning structure and authorship are independent checks. Never suppress either.
    if(provenanceGap.flagged)coach('Provenance Gap',`${provenanceGap.reason} ${provenanceGap.next}`,{duration:9500,pinnable:true});
    return;
  }
  checkpoint('connect reasoning');
  let created=null;
  updateState(s=>{
    if(s.edges.some(e=>e.source===source.id&&e.target===target.id))return;
    created=createEdge(source.id,target.id,{status:(source.meta?.provisional||target.meta?.provisional)?'provisional':'active'});
    created.meta={...(created.meta||{}),pilotSignal:result?.signal||null};
    s.edges.push(created);
    s.activeNodeId=target.id;
  });
  if(!created)return;
  selectedEdgeId=null;
  selectedNodeIds.clear(); selectedNodeIds.add(target.id);
  traceIssueNodeIds.clear();
  clearNewNodeHalo();
  logEvent('Reasoning connected',`${typeLabels[source.type]||source.type} → ${typeLabels[target.type]||target.type}`);
  renderWorkspace();
  // Both advisories can apply to the same link; each remains pinnable independently.
  if(result?.gap)coach('Gap in Reasoning',`${result.gap.reason} ${result.gap.next} Connection was saved; the warning is advisory.`,{duration:8500,pinnable:true});
  if(provenanceGap.flagged)coach('Provenance Gap',`${provenanceGap.reason} ${provenanceGap.next} Connection saved for review, not confirmed evidence.`,{duration:9500,pinnable:true});
  if(!result?.gap&&!provenanceGap.flagged)toast('Reasoning moves connected.');
}

function isTextEditingContext(e){
  // Keyboard shortcuts must never steal Backspace/Delete/Ctrl+Z from an active
  // text field. Check both the event target and activeElement because rerenders
  // or nested labels can make the event target less specific than the focused field.
  const candidates=[e?.target,document.activeElement].filter(Boolean);
  return candidates.some(el=>{
    if(!(el instanceof Element))return false;
    return Boolean(el.matches?.('input,textarea,select,[contenteditable="true"]') || el.closest?.('input,textarea,select,[contenteditable="true"]'));
  });
}

function handleWorkspaceKeydown(e){
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z'){
    if(isTextEditingContext(e))return;
    e.preventDefault(); undoLast(); return;
  }
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='f'){
    if(isTextEditingContext(e))return;
    if(els.app?.classList.contains('hidden') || $('#workspaceView')?.classList.contains('hidden'))return;
    e.preventDefault();openNodeSearch();return;
  }
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='g'){
    if(isTextEditingContext(e))return;
    if(els.app?.classList.contains('hidden') || $('#workspaceView')?.classList.contains('hidden'))return;
    e.preventDefault();toggleGroupSelected(Boolean(e.shiftKey));return;
  }
  if(!['Delete','Backspace'].includes(e.key))return;
  const target=e.target;
  if(isTextEditingContext(e) || target?.closest?.('.modal'))return;
  if(els.app?.classList.contains('hidden') || $('#workspaceView')?.classList.contains('hidden'))return;

  if(selectedEdgeId){
    const edge=getState().edges.find(x=>x.id===selectedEdgeId);
    if(!edge)return;
    e.preventDefault();
    checkpoint('disconnect reasoning');
    updateState(s=>{s.edges=s.edges.filter(x=>x.id!==selectedEdgeId);});
    selectedEdgeId=null;traceIssueNodeIds.clear();
    logEvent('Connection removed','A reasoning connection was disconnected manually.');
    renderWorkspace();toast('Connection removed.');return;
  }

  if(selectedNodeIds.size>1){
    const state=getState();
    const ids=[...selectedNodeIds].filter(id=>state.nodes.some(n=>n.id===id));
    if(!ids.length)return;
    const protectedIds=new Set(ids.filter(id=>{const n=state.nodes.find(x=>x.id===id);return n?.type==='input'&&n?.meta?.source==='brief';}));
    const deletable=ids.filter(id=>!protectedIds.has(id));
    e.preventDefault();
    if(!deletable.length){toast('Brief-source Inputs are protected. Change the hotspot/source rather than deleting those nodes.');return;}
    checkpoint('delete selected reasoning nodes');
    const remove=new Set(deletable);
    updateState(s=>{
      s.nodes=s.nodes.filter(n=>!remove.has(n.id));
      s.edges=s.edges.filter(edge=>!remove.has(edge.source)&&!remove.has(edge.target));
      if(remove.has(s.activeNodeId))s.activeNodeId=null;
    });
    deletable.forEach(id=>{selectedNodeIds.delete(id);traceIssueNodeIds.delete(id);});
    selectedEdgeId=null;
    renderWorkspace();
    toast(`${deletable.length} selected node${deletable.length===1?'':'s'} deleted.${protectedIds.size?` ${protectedIds.size} brief-source Input${protectedIds.size===1?' was':'s were'} kept.`:''} Ctrl+Z restores the deletion.`);
    return;
  }

  const id=getState().activeNodeId;
  if(!id)return;
  const node=getState().nodes.find(n=>n.id===id);
  if(!node)return;
  e.preventDefault();
  if(node.type==='input' && node.meta?.source==='brief'){ toast('This source Input stays tied to the selected brief language. Delete or change the hotspot instead.'); return; }
  checkpoint('delete reasoning node');
  updateState(s=>{
    s.nodes=s.nodes.filter(n=>n.id!==id);
    s.edges=s.edges.filter(edge=>edge.source!==id&&edge.target!==id);
    s.activeNodeId=null;
  });
  selectedNodeIds.delete(id);
  traceIssueNodeIds.delete(id);
  logEvent('Reasoning node deleted',node.label||typeLabels[node.type]||node.type);
  renderWorkspace();toast('Node deleted. Downstream reasoning remains available to reconnect.');
}

function captureUndoUI(){
  return {
    workspaceMapMode,
    mapWorkspaceViews:structuredClone(mapWorkspaceViews),
    aggregateHotspotFilter,
    aggregateChunkFilter,
    aggregateTypeFilter,
    aggregateStatusFilter,
    aggregateArrangeSession:aggregateArrangeSession?structuredClone(aggregateArrangeSession):null,
    aggregateArrangeBlend,
    focusArrangeMode,
    canvasZoom,
    focusPathRootId,
    selectedEdgeId,
    selectedNodeIds:[...selectedNodeIds]
  };
}
function restoreUndoUI(ui={}){
  workspaceMapMode=ui.workspaceMapMode==='aggregate'?'aggregate':'focus';
  mapWorkspaceViews=ui.mapWorkspaceViews?structuredClone(ui.mapWorkspaceViews):{focus:null,aggregate:null};
  aggregateHotspotFilter=ui.aggregateHotspotFilter||'all';
  aggregateChunkFilter=ui.aggregateChunkFilter||'all';
  aggregateTypeFilter=ui.aggregateTypeFilter||'all';
  aggregateStatusFilter=ui.aggregateStatusFilter||'all';
  aggregateArrangeSession=ui.aggregateArrangeSession?structuredClone(ui.aggregateArrangeSession):null;
  aggregateArrangeBlend=Number.isFinite(Number(ui.aggregateArrangeBlend))?Number(ui.aggregateArrangeBlend):0;
  focusArrangeMode=Boolean(ui.focusArrangeMode);
  canvasZoom=Number.isFinite(Number(ui.canvasZoom))?Number(ui.canvasZoom):1;
  focusPathRootId=ui.focusPathRootId||null;
  selectedEdgeId=ui.selectedEdgeId||null;
  selectedNodeIds=new Set(ui.selectedNodeIds||[]);
}
function checkpoint(label='change'){
  undoStack.push({label,state:structuredClone(getState()),ui:captureUndoUI()});
  if(undoStack.length>MAX_UNDO)undoStack.shift();
  updateUndoButton();
}
function undoLast(){
  const entry=undoStack.pop();
  if(!entry){toast('Nothing to undo yet.');return;}
  replaceState(entry.state);
  restoreUndoUI(entry.ui||{});
  traceIssueNodeIds.clear();closeNodeContext();
  updateUndoButton();
  renderWorkspace();
  updateZoomLabel();
  toast(`Undid ${entry.label}.`);
}
function updateUndoButton(){if(els.undoButton)els.undoButton.disabled=undoStack.length===0;}
function clearNewNodeHalo(){document.querySelectorAll('.graph-node.just-added').forEach(el=>el.classList.remove('just-added'));}

function disconnectEdge(id){
  const edge=getState().edges.find(e=>e.id===id); if(!edge)return;
  checkpoint('disconnect reasoning');
  updateState(s=>{s.edges=s.edges.filter(e=>e.id!==id);});
  selectedEdgeId=null;traceIssueNodeIds.clear();
  logEvent('Connection removed','A reasoning connection was disconnected manually.');
  renderWorkspace();toast('Connection removed.');
}

function openNodeContext(id,x,y){
  closeNodeContext();
  const state=getState();
  const node=state.nodes.find(n=>n.id===id); if(!node)return;
  if(!selectedNodeIds.has(id)){ selectedNodeIds.clear(); selectedNodeIds.add(id); }
  const menu=document.createElement('div');
  menu.id='nodeContextMenu';menu.className='node-context-menu';
  const locked=Boolean(node.meta?.locked);
  const protectedSource=node.type==='input'&&node.meta?.source==='brief';
  const selected=[...selectedNodeIds].map(nid=>state.nodes.find(n=>n.id===nid)).filter(Boolean);
  const groupMembers=node.meta?.groupId?state.nodes.filter(n=>n.meta?.groupId===node.meta.groupId):[];
  const canGroup=selected.length>1;
  const sameGroup=canGroup && selected.every(n=>n.meta?.groupId && n.meta.groupId===selected[0].meta?.groupId);
  const connected=state.edges.filter(e=>e.source===id||e.target===id);
  const wireActions=connected.map(e=>{
    const outgoing=e.source===id;
    const other=state.nodes.find(n=>n.id===(outgoing?e.target:e.source));
    const label=(other?.label||typeLabels[other?.type]||'connected node').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const short=label.length>38?`${label.slice(0,35)}…`:label;
    return `<button type="button" class="node-context-wire" data-edge-action="${e.id}">Disconnect wire ${outgoing?'to':'from'} “${short}”</button>`;
  }).join('');
  const groupAction=canGroup?`<button type="button" data-node-action="group">${sameGroup?'Ungroup selected':'Group selected'} (${selected.length})</button>`:(groupMembers.length>1?`<button type="button" data-node-action="ungroup">Ungroup this group (${groupMembers.length})</button>`:'');
  const multiDelete=selected.length>1?`<button type="button" data-node-action="delete-selected">Delete selected (${selected.length})</button>`:'';
  menu.innerHTML=`<button type="button" data-node-action="lock">${locked?'Unlock position':'Lock position'}</button>${groupAction}<button type="button" data-node-action="focus">${focusPathRootId===id?'Show full pathway field':'Focus this pathway'}</button><button type="button" data-node-action="disconnect">Disconnect all wires</button>${wireActions?`<div class="node-context-divider"></div>${wireActions}`:''}${multiDelete}<button type="button" data-node-action="delete" ${protectedSource?'disabled':''}>Delete node</button><small>${protectedSource?'Brief-source Inputs are protected.':'Shift-click selects several nodes · Delete/Backspace removes the selection · Ctrl+G groups · Ctrl+F finds.'}</small>`;
  document.body.appendChild(menu);
  const rect=menu.getBoundingClientRect();
  menu.style.left=`${Math.max(8,Math.min(x,window.innerWidth-rect.width-8))}px`;
  menu.style.top=`${Math.max(8,Math.min(y,window.innerHeight-rect.height-8))}px`;
  menu.querySelector('[data-node-action="lock"]').onclick=()=>{toggleNodeLock(id);closeNodeContext();};
  menu.querySelector('[data-node-action="focus"]').onclick=()=>{
    focusPathRootId=focusPathRootId===id?null:id;
    patchState({activeNodeId:id},{silent:true});
    selectedNodeIds.clear();selectedNodeIds.add(id);
    closeNodeContext();renderWorkspace();
    toast(focusPathRootId?'Pathway isolated. Show all restores the full field.':workspaceMapMode==='aggregate'?'Showing the full aggregate field again.':'Showing the full hotspot trace again.');
  };
  menu.querySelector('[data-node-action="group"]')?.addEventListener('click',()=>{
    checkpoint(sameGroup?'ungroup selected':'group selected');
    updateState(s=>{
      const ids=new Set(selectedNodeIds);
      if(sameGroup){
        s.nodes.forEach(n=>{if(ids.has(n.id)){n.meta={...n.meta};delete n.meta.groupId;}});
      }else{
        const gid=`group-${Date.now()}`;
        s.nodes.forEach(n=>{if(ids.has(n.id))n.meta={...n.meta,groupId:gid};});
      }
    });
    closeNodeContext();renderWorkspace();toast(sameGroup?'Nodes ungrouped.':'Nodes grouped — drag one to move the group.');
  });
  menu.querySelector('[data-node-action="ungroup"]')?.addEventListener('click',()=>{
    const gid=node.meta?.groupId;if(!gid)return;
    checkpoint('ungroup nodes');updateState(s=>s.nodes.forEach(n=>{if(n.meta?.groupId===gid){n.meta={...n.meta};delete n.meta.groupId;}}));
    closeNodeContext();renderWorkspace();toast('Group released.');
  });
  menu.querySelector('[data-node-action="disconnect"]').onclick=()=>{
    const count=getState().edges.filter(e=>e.source===id||e.target===id).length;
    if(!count){toast('This node has no wires to disconnect.');closeNodeContext();return;}
    checkpoint('disconnect node');updateState(s=>{s.edges=s.edges.filter(e=>e.source!==id&&e.target!==id);});closeNodeContext();renderWorkspace();toast(`${count} ${count===1?'wire':'wires'} disconnected.`);
  };
  menu.querySelectorAll('[data-edge-action]').forEach(b=>b.onclick=()=>{const edgeId=b.dataset.edgeAction;closeNodeContext();disconnectEdge(edgeId);});
  menu.querySelector('[data-node-action="delete-selected"]')?.addEventListener('click',()=>{
    const current=getState();
    const ids=[...selectedNodeIds].filter(nid=>current.nodes.some(n=>n.id===nid));
    const protectedSet=new Set(ids.filter(nid=>{const n=current.nodes.find(x=>x.id===nid);return n?.type==='input'&&n?.meta?.source==='brief';}));
    const deletable=ids.filter(nid=>!protectedSet.has(nid));
    if(!deletable.length){toast('Brief-source Inputs are protected.');closeNodeContext();return;}
    checkpoint('delete selected reasoning nodes');
    const remove=new Set(deletable);
    updateState(s=>{s.nodes=s.nodes.filter(n=>!remove.has(n.id));s.edges=s.edges.filter(e=>!remove.has(e.source)&&!remove.has(e.target));if(remove.has(s.activeNodeId))s.activeNodeId=null;});
    deletable.forEach(nid=>selectedNodeIds.delete(nid));
    closeNodeContext();renderWorkspace();toast(`${deletable.length} selected node${deletable.length===1?'':'s'} deleted. Ctrl+Z restores them.`);
  });
  const del=menu.querySelector('[data-node-action="delete"]');
  if(del&&!del.disabled)del.onclick=()=>{checkpoint('delete reasoning node');updateState(s=>{s.nodes=s.nodes.filter(n=>n.id!==id);s.edges=s.edges.filter(e=>e.source!==id&&e.target!==id);if(s.activeNodeId===id)s.activeNodeId=null;});selectedNodeIds.delete(id);closeNodeContext();renderWorkspace();toast('Node deleted. Ctrl+Z restores it.');};
}

function toggleGroupSelected(forceUngroup=false){
  const state=getState();
  const ids=[...selectedNodeIds].filter(id=>state.nodes.some(n=>n.id===id));
  if(ids.length<2){ toast('Shift-click at least two nodes before grouping.'); return; }
  const selected=ids.map(id=>state.nodes.find(n=>n.id===id)).filter(Boolean);
  const sharedGroup=selected[0]?.meta?.groupId && selected.every(n=>n.meta?.groupId===selected[0].meta.groupId);
  const ungroup=forceUngroup||Boolean(sharedGroup);
  checkpoint(ungroup?'ungroup selected':'group selected');
  updateState(s=>{
    const set=new Set(ids);
    if(ungroup){
      s.nodes.forEach(n=>{if(set.has(n.id)){n.meta={...n.meta};delete n.meta.groupId;}});
    }else{
      const gid=`group-${Date.now()}`;
      s.nodes.forEach(n=>{if(set.has(n.id))n.meta={...n.meta,groupId:gid};});
    }
  });
  renderWorkspace();
  toast(ungroup?'Nodes ungrouped.':'Nodes grouped. Ctrl+Shift+G releases them.');
}


function focusTraceAround(scoped,rootId){
  if(!rootId)return scoped;
  const ids=new Set([rootId]);
  const upstream=[rootId],downstream=[rootId];
  while(upstream.length){
    const id=upstream.shift();
    scoped.edges.filter(e=>e.target===id).forEach(e=>{
      if(ids.has(e.source))return;
      ids.add(e.source);upstream.push(e.source);
    });
  }
  while(downstream.length){
    const id=downstream.shift();
    scoped.edges.filter(e=>e.source===id).forEach(e=>{
      if(ids.has(e.target))return;
      ids.add(e.target);downstream.push(e.target);
    });
  }
  return {
    nodes:scoped.nodes.filter(n=>ids.has(n.id)),
    edges:scoped.edges.filter(e=>ids.has(e.source)&&ids.has(e.target))
  };
}

function togglePathFocus(){
  if(focusPathRootId){
    focusPathRootId=null;
    renderWorkspace();
    toast(workspaceMapMode==='aggregate'?'Showing the full aggregate reasoning field again.':'Showing the full hotspot trace again.');
    return;
  }
  const state=getState();
  const id=state.activeNodeId || [...selectedNodeIds][0];
  if(!id){toast('Select a node first, then Focus path.');return;}
  const base=workspaceTrace(state);
  if(!base.nodes.some(n=>n.id===id)){toast('That node is outside the current visible reasoning field.');return;}
  focusPathRootId=id;
  selectedEdgeId=null;traceIssueNodeIds.clear();
  renderWorkspace();
  const focused=focusTraceAround(workspaceTrace(getState()),id);
  toast(`Focused on ${focused.nodes.length} reasoning move${focused.nodes.length===1?'':'s'}. Show all restores the ${workspaceMapMode==='aggregate'?'aggregate map':'canvas'}.`);
}

function showNodeCaseStudy(id){
  selectNode(id);
  // Inspector case studies are based on the selected node's wording and framework,
  // not merely the parent pavilion brief. Scroll only after async matching completes.
  let attempts=0;
  const focus=()=>{
    const section=document.querySelector('#inspectorContent .case-study-section');
    if(section){section.scrollIntoView({behavior:'smooth',block:'nearest'});return;}
    if(attempts++<8)requestAnimationFrame(focus);
  };
  requestAnimationFrame(focus);
}
function openNodeQuickLink(id){
  const source=getState().nodes.find(n=>n.id===id);
  if(!source)return;
  const choices=getState().nodes.filter(n=>n.id!==id);
  if(!choices.length){toast('Add a second reasoning node, then connect these two thoughts.');return;}
  const optionHtml=choices.map(n=>`<option value="${escapeHtml(n.id)}">${escapeHtml((typeLabels[n.type]||n.type)+' — '+n.label.slice(0,100))}</option>`).join('');
  openModal(`<div class="link-guide-modal"><h2 id="modalTitle">Connect two reasoning nodes</h2>
    <p>A link is a relationship between two thoughts. The starting node is already chosen; now choose which other node it connects to.</p>
    <div class="link-endpoint"><span>1 · THIS NODE (START)</span><strong>${escapeHtml(source.label)}</strong><small>${escapeHtml(typeLabels[source.type]||source.type)}</small></div>
    <div class="link-direction-symbol">↓ relationship direction ↓</div>
    <label class="field-label" for="quickLinkTarget">2 · CHOOSE THE OTHER NODE (DESTINATION)</label>
    <select class="field-input" id="quickLinkTarget">${optionHtml}</select>
    <div class="link-endpoint link-target-preview" id="linkTargetPreview"></div>
    <label class="field-label" for="quickLinkDirection">Which thought leads to which?</label>
    <select class="field-input" id="quickLinkDirection"><option value="out">This node → other node (a next move)</option><option value="in">Other node → this node (what led here)</option></select>
    <p class="guided-validation" id="quickLinkValidation" role="status"></p>
    <div class="modal-actions"><button class="secondary-button" data-close-modal>Cancel</button><button class="primary-button compact" id="confirmQuickLink">Create connection →</button></div></div>`,{onOpen:modal=>{
    const picker=modal.querySelector('#quickLinkTarget');
    const preview=modal.querySelector('#linkTargetPreview');
    const direction=modal.querySelector('#quickLinkDirection');
    const updatePreview=()=>{
      const target=getState().nodes.find(n=>n.id===picker.value);
      if(!target)return;
      preview.innerHTML=`<span>SELECTED DESTINATION</span><strong>${escapeHtml(target.label)}</strong><small>${escapeHtml(typeLabels[target.type]||target.type)}</small>`;
      const from=direction.value==='out'?source:target;
      const to=direction.value==='out'?target:source;
      const result=connectionCheck(from,to,getState().edges,pilotEvidence,{frameworkId:getState().frameworkId||'tracework'});
      const provenanceGap=provenanceConnectionCheck(from,to);
      modal.querySelector('#quickLinkValidation').textContent=(result.ok?`${result.gap?'Gap in Reasoning: '+result.gap.reason+' '+result.gap.next+' | ':''}Possible connection: ${result.reason} ${result.detail||''}`:`Cannot connect: ${result.reason} ${result.detail||''}`)+(provenanceGap.flagged?` | Provenance Gap: ${provenanceGap.reason} ${provenanceGap.next}`:'');
      modal.querySelector('#quickLinkValidation').classList.toggle('provenance-review',provenanceGap.flagged);
      modal.querySelector('#confirmQuickLink').disabled=!result.ok;
    };
    picker.onchange=updatePreview;direction.onchange=updatePreview;updatePreview();
    modal.querySelector('#confirmQuickLink').onclick=()=>{
      const target=getState().nodes.find(n=>n.id===picker.value);
      if(!target)return;
      const from=direction.value==='out'?source:target;
      const to=direction.value==='out'?target:source;
      const result=connectionCheck(from,to,getState().edges,pilotEvidence,{frameworkId:getState().frameworkId||'tracework'});
      if(!result.ok){modal.querySelector('#quickLinkValidation').textContent=result.reason;return;}
      closeModal();connectNodes(from,to,result);
    };
  }});
}

function showSpatialRead(text,type,focusedText=''){
  openModal(spatialReadModalMarkup(text,type,caseStudies,focusedText),{onOpen:modal=>bindSpatialModal(modal,{onSearch:query=>showSpatialRead(text,type,query)})});
}
function showSpatialReadForNode(id){
  const node=getState().nodes.find(n=>n.id===id);
  if(node){
    const fromHotspot=node.meta?.hotspotId?getState().hotspots?.find(h=>h.id===node.meta.hotspotId)?.text:'';
    const candidates=[node.label,node.text,node.meta?.sourceText,fromHotspot].filter(Boolean);
    const text=candidates.find(v=>detectSpatialTerms(v).length)||candidates[0]||'';
    showSpatialRead(text,node.type);
  }
}

// Inspector: the same spatial studio is available across all reasoning frameworks.
document.addEventListener('click',event=>{
  const button=event.target.closest('.spatial-open-modal');
  if(!button)return;
  event.preventDefault();
  // Inspector may be redrawn after activation; never open the dictionary with an empty node sentence.
  const state=getState();
  const active=state.nodes?.find(n=>n.id===state.activeNodeId)||state.nodes?.find(n=>selectedNodeIds.has(n.id));
  const hot=state.hotspots?.find(h=>h.id===state.activeHotspotId);
  const inspectorHeading=button.closest('#inspectorContent')?.querySelector('.inspector-head h3')?.textContent?.trim();
  // Prefer a term-bearing sentence from the ACTIVE inspector. Some old saved
  // hotspots and asynchronous inspector redraws retain outdated data-* text.
  const candidates=[inspectorHeading,button.dataset.spatialText,active?.label,hot?.text].filter(v=>typeof v==='string'&&v.trim());
  const text=candidates.find(v=>detectSpatialTerms(v).length)||candidates[0]||'';
  const role=button.dataset.spatialType||active?.type||(hot?'input':'note');
  showSpatialRead(text,role);
});

function toggleSpatialPreview(id){
  const node=getState().nodes.find(n=>n.id===id);
  if(!node)return;
  updateState(s=>{
    const n=s.nodes.find(n=>n.id===id);
    if(n)n.meta={...(n.meta||{}),spatialPreviewOpen:!n.meta?.spatialPreviewOpen};
  });
  selectedNodeIds.clear();selectedNodeIds.add(id);
  patchState({activeNodeId:id},{silent:true});
  renderWorkspace();
}

function openNodeSearch(){
  document.getElementById('nodeSearchPopover')?.remove();
  const scoped=workspaceTrace(getState());
  const panel=document.createElement('aside');
  panel.id='nodeSearchPopover';
  panel.className='node-search-popover';
  panel.innerHTML=`<div class="node-search-head"><strong>Find reasoning</strong><button type="button" aria-label="Close">×</button></div><input class="field-input" id="nodeSearchInput" placeholder="Type a remembered word or phrase…"><div class="node-search-results" id="nodeSearchResults"></div>`;
  document.body.appendChild(panel);
  const input=panel.querySelector('#nodeSearchInput');
  const results=panel.querySelector('#nodeSearchResults');
  const draw=()=>{
    const q=input.value.trim().toLowerCase();
    const hits=(q?scoped.nodes.filter(n=>(n.label||'').toLowerCase().includes(q)):scoped.nodes).slice(0,10);
    results.innerHTML=hits.length?hits.map(n=>`<button type="button" data-find-node="${escapeHtml(n.id)}"><span>${escapeHtml(typeLabels[n.type]||n.type)}</span><strong>${escapeHtml(n.label)}</strong></button>`).join(''):'<small>No matching reasoning in this trace.</small>';
    results.querySelectorAll('[data-find-node]').forEach(b=>b.onclick=()=>{
      const id=b.dataset.findNode;
      panel.remove();
      showView('workspace');
      selectNode(id);
      requestAnimationFrame(()=>focusNode(els.graphViewport,document.querySelector(`[data-id="${CSS.escape(id)}"]`),canvasZoom));
    });
  };
  panel.querySelector('button').onclick=()=>panel.remove();
  input.oninput=draw;
  draw();
  input.focus();
}

function openNodeStatusMenu(id,x,y){
  document.getElementById('nodeStatusMenu')?.remove();
  const node=getState().nodes.find(n=>n.id===id);
  if(!node||node.type==='note'||node.status==='rejected')return;
  const current=node.meta?.provisional?'provisional':'active';
  const menu=document.createElement('div');
  menu.id='nodeStatusMenu';
  menu.className='node-status-menu';
  menu.innerHTML=`<small>Working status</small><button type="button" data-status="active" class="${current==='active'?'selected':''}">Active<span>Retained in the working reasoning</span></button><button type="button" data-status="provisional" class="${current==='provisional'?'selected':''}">Provisional<span>Kept open for testing or revision</span></button>`;
  document.body.appendChild(menu);
  const rect=menu.getBoundingClientRect();
  menu.style.left=`${Math.max(8,Math.min(x,window.innerWidth-rect.width-8))}px`;
  menu.style.top=`${Math.max(8,Math.min(y,window.innerHeight-rect.height-8))}px`;
  menu.querySelectorAll('[data-status]').forEach(b=>b.onclick=()=>{
    const next=b.dataset.status;
    checkpoint(`set ${next} status`);
    updateState(s=>{
      const n=s.nodes.find(n=>n.id===id);
      if(n)n.meta={...n.meta,provisional:next==='provisional'};
    });
    menu.remove();
    renderWorkspace();
    toast(`Node marked ${next}.`);
  });
}


function openNodeTypeMenu(id,x,y){
  document.getElementById('nodeTypeMenu')?.remove();
  const state=getState();
  const node=state.nodes.find(n=>n.id===id);
  if(!node)return;
  const framework=getFramework(state.frameworkId||'tracework');

  if(framework.id!=='tracework' && framework.id!=='freeform' && node.type!=='note'){
    const current=frameworkRoleForNode(node,framework.id)?.id;
    const menu=document.createElement('div');
    menu.id='nodeTypeMenu';
    menu.className='node-status-menu node-type-menu';
    menu.innerHTML=`<small>${escapeHtml(framework.label)} role</small>${framework.categories.map(c=>`<button type="button" data-framework-role="${escapeHtml(c.id)}" class="${current===c.id?'selected':''}">${escapeHtml(c.label)}<span>${escapeHtml(c.description||'Change how this thought is read through the current framework.')}</span></button>`).join('')}<button type="button" data-framework-role="auto"><strong>Auto-read from text</strong><span>Remove the manual role and let TRACEWORK infer this framework again.</span></button>`;
    document.body.appendChild(menu);
    const rect=menu.getBoundingClientRect();
    menu.style.left=`${Math.max(8,Math.min(x,window.innerWidth-rect.width-8))}px`;
    menu.style.top=`${Math.max(8,Math.min(y,window.innerHeight-rect.height-8))}px`;
    menu.querySelectorAll('[data-framework-role]').forEach(b=>b.onclick=()=>{
      const nextRole=b.dataset.frameworkRole;
      checkpoint('change framework role');
      updateState(s=>{
        const n=s.nodes.find(n=>n.id===id); if(!n)return;
        const roles={...(n.meta?.frameworkRoles||{})};
        if(nextRole==='auto') delete roles[framework.id]; else roles[framework.id]=nextRole;
        n.meta={...(n.meta||{}),frameworkRoles:roles};
        n.updatedAt=new Date().toISOString();
      });
      menu.remove(); renderWorkspace();
      const label=nextRole==='auto'?'automatic reading':(getFrameworkCategory(framework.id,nextRole)?.label||nextRole);
      toast(`${framework.shortLabel} role · ${label}. Underlying TRACEWORK type was not changed.`);
    });
    return;
  }

  if(node.type==='input' && node.meta?.source==='brief'){
    toast('This Input stays tied to the selected brief language. Other reasoning nodes can change type.');
    return;
  }
  const editableTypes=['interpretation','grounding','consequence','evaluation','goal','note'];
  const menu=document.createElement('div');
  menu.id='nodeTypeMenu';
  menu.className='node-status-menu node-type-menu';
  menu.innerHTML=`<small>TRACEWORK reasoning role</small>${editableTypes.map(t=>`<button type="button" data-node-type="${t}" class="${node.type===t?'selected':''}">${escapeHtml(typeLabels[t]||t)}<span>${t==='note'?'Leave this thought deliberately unclassified.':nodeGuidance[t]?.use||'Change how this thought functions in the trace.'}</span></button>`).join('')}`;
  document.body.appendChild(menu);
  const rect=menu.getBoundingClientRect();
  menu.style.left=`${Math.max(8,Math.min(x,window.innerWidth-rect.width-8))}px`;
  menu.style.top=`${Math.max(8,Math.min(y,window.innerHeight-rect.height-8))}px`;
  menu.querySelectorAll('[data-node-type]').forEach(b=>b.onclick=()=>{
    const nextType=b.dataset.nodeType;
    if(!nextType||nextType===node.type){menu.remove();return;}
    checkpoint('change reasoning role');
    updateState(s=>{
      const n=s.nodes.find(n=>n.id===id); if(!n)return;
      n.type=nextType; n.updatedAt=new Date().toISOString();
      n.meta={...(n.meta||{}),typeEdited:true};
      if(nextType==='note'){
        const c=classifyThought(n.label||'',{provenance:inferLegacyProvenance(n)});
        n.meta.suggestedType=c.type||'interpretation'; n.meta.classificationReason=c.reason; n.meta.classificationConfidence=c.confidence;
      }else delete n.meta.suggestedType;
      s.edges.filter(e=>e.source===id||e.target===id).forEach(e=>{e.meta={...(e.meta||{}),typeEdited:true};});
    });
    menu.remove(); renderWorkspace();
    toast(`Changed node to ${typeLabels[nextType]||nextType}. Existing wires were kept for review.`);
  });
}

function toggleNodeLock(id){
  const node=getState().nodes.find(n=>n.id===id);if(!node)return;
  const locked=Boolean(node.meta?.locked);
  checkpoint(locked?'unlock node':'lock node');
  updateState(s=>{const n=s.nodes.find(n=>n.id===id);if(n)n.meta={...n.meta,locked:!locked};});
  renderWorkspace();toast(locked?'Node unlocked.':'Node position locked.');
}
function closeNodeContext(){document.getElementById('nodeContextMenu')?.remove();}

function inspectCaseStudy(id){
  const c=caseStudies.find(x=>x.id===id); if(!c)return;
  openModal(`<h2 id="modalTitle">${escapeHtml(c.name)}</h2><p>${escapeHtml(c.designer)} · ${escapeHtml(String(c.year))}${c.feature?` · ${escapeHtml(c.feature)}`:''}</p>
    <div class="node-use-card"><strong>Feature to inspect</strong><p>${escapeHtml(c.note)}</p>${c.whyRelevant?`<p><strong>Why this may matter here:</strong> ${escapeHtml(c.whyRelevant)}</p>`:''}<p><strong>Question to carry back:</strong> ${escapeHtml(c.prompt)}</p></div>
    <div class="inspector-section"><h4>Spatial moves to inspect</h4><div class="hotspot-list">${(c.moves||[]).map(m=>`<span class="hotspot-chip">${escapeHtml(m)}</span>`).join('')}</div></div>
    <div class="modal-actions">${c.sourceUrl?`<a class="secondary-button" href="${escapeHtml(c.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.sourceLabel||'Project source')} ↗</a>`:''}<button class="primary-button compact" data-close-modal>Back to trace</button></div>`);
}


function traceIssues(state=getState()){
  const scoped=workspaceMapMode==='aggregate'?aggregateTrace(state,{ignoreFilters:true}):scopedTrace(state);
  const activeNodes=scoped.nodes.filter(n=>n.status!=='rejected'&&!n.meta?.artifactKind);
  const activeEdges=scoped.edges.filter(e=>e.status!=='rejected'&&!e.meta?.artifact);
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
  traceIssueNodeIds=new Set(issues.map(i=>i.node.id));
  if(!$('#workspaceView')?.classList.contains('hidden')) renderGraphState();
  showTraceCheckPanel(issues);
}

function showTraceCheckPanel(issues){
  document.getElementById('traceCheckPopover')?.remove();
  const panel=document.createElement('aside');
  panel.id='traceCheckPopover';
  panel.className='trace-check-popover';
  panel.innerHTML=issues.length
    ? `<div class="trace-check-popover-head"><div><strong>Trace check · ${issues.length} open</strong><span>Prompts, not errors. Orange halos show where reasoning currently stops or floats.</span></div><button type="button" data-close-trace-check aria-label="Close trace check">×</button></div><div class="trace-check-popover-list">${issues.map(i=>`<button class="trace-check-popover-item" data-trace-issue="${escapeHtml(i.node.id)}"><span>${escapeHtml(typeLabels[i.node.type]||i.node.type)}</span><strong>${escapeHtml(i.node.label)}</strong><small>${escapeHtml(i.message)}</small></button>`).join('')}</div>`
    : `<div class="trace-check-popover-head"><div><strong>Trace check · clear</strong><span>No obvious loose ends in this selected trace. TRACEWORK is checking continuity, not correctness.</span></div><button type="button" data-close-trace-check aria-label="Close trace check">×</button></div>`;
  document.body.appendChild(panel);
  const close=()=>{panel.remove();traceIssueNodeIds.clear();if(!$('#workspaceView')?.classList.contains('hidden')&&getState().nodes.length)renderGraphState();};
  panel.querySelector('[data-close-trace-check]')?.addEventListener('click',close);
  panel.querySelectorAll('[data-trace-issue]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.traceIssue;
    showView('workspace');
    selectNode(id);
    traceIssueNodeIds=new Set(issues.map(i=>i.node.id));
    renderGraphState();
    setTimeout(()=>focusNode(els.graphViewport,document.querySelector(`[data-id="${id}"]`),canvasZoom),60);
  });
}

function zoomTo(next){
  canvasZoom=applyZoom(els.graphViewport,els.graphStage,els.graphSurface,next);
  updateZoomLabel();queueViewportSave();
}
function updateZoomLabel(){ const label=$('#zoomLabel'); if(label)label.textContent=`${Math.round(canvasZoom*100)}%`; }



function updateFrameworkControls(state){
  const framework=getFramework(state.frameworkId||'tracework');
  if(els.frameworkSelect){
    els.frameworkSelect.value=framework.id;
    els.frameworkSelect.disabled=Boolean(state.frameworkLocked);
    els.frameworkSelect.setAttribute('aria-disabled',state.frameworkLocked?'true':'false');
  }
  if(els.frameworkLockButton){
    const locked=Boolean(state.frameworkLocked);
    els.frameworkLockButton.classList.toggle('locked',locked);
    els.frameworkLockButton.setAttribute('aria-pressed',locked?'true':'false');
    els.frameworkLockButton.title=locked
      ? `Unlock ${framework.label} to choose a different framework for this project`
      : `Lock ${framework.label} so this project's framework cannot be changed accidentally`;
    els.frameworkLockButton.setAttribute('aria-label',locked?`Unlock ${framework.label}`:`Lock ${framework.label}`);
    const text=els.frameworkLockButton.querySelector('.framework-lock-text');
    if(text) text.textContent=locked?'Locked':'Lock';
  }
  document.body.dataset.framework=framework.id;
  document.body.classList.toggle('framework-types-visible',Boolean(showNodeTypes));
  els.thoughtDock?.classList.toggle('d2-freeform-unclassified',framework.id==='freeform'&&!showNodeTypes);

  const commandFrameworkId=framework.id==='freeform'?'tracework':framework.id;
  const categories=commandFrameworkId==='tracework'
    ? frameworkCategories('tracework')
    : frameworkCategories(commandFrameworkId);
  if(els.thoughtTypeSelect){
    const previous=els.thoughtTypeSelect.value;
    const frameworkChanged=els.thoughtTypeSelect.dataset.framework!==commandFrameworkId;
    els.thoughtTypeSelect.innerHTML=categories.map(c=>`<option value="${escapeHtml(c.id)}">${escapeHtml(c.label)}</option>`).join('');
    if(!frameworkChanged && [...els.thoughtTypeSelect.options].some(o=>o.value===previous)) els.thoughtTypeSelect.value=previous;
    els.thoughtTypeSelect.dataset.framework=commandFrameworkId;
    if(frameworkChanged) els.thoughtTypeSelect.dataset.manual='';
  }

  if(els.addFreeThoughtButton){els.addFreeThoughtButton.textContent=framework.id==='freeform'?'Add to Field (Unclassified) →':'Add to field →';}
  if(els.thoughtReadingLabel){
    els.thoughtReadingLabel.textContent=framework.id==='freeform'
      ? 'Optional TRACEWORK structure'
      : `${framework.shortLabel} reads this as`;
  }
  if(els.toggleNodeTypesButton){
    if(framework.id==='freeform') els.toggleNodeTypesButton.textContent=showNodeTypes?'Hide inferred types':'Reveal inferred types';
    else if(framework.id==='tracework') els.toggleNodeTypesButton.textContent=showNodeTypes?'Hide framework roles':'Show framework roles';
    else els.toggleNodeTypesButton.textContent=showNodeTypes?'Hide inferred roles':'Reveal inferred roles';
  }
  const arranged=workspaceMapMode==='focus'?focusArrangeMode:aggregateArrangeSession?.frameworkId===framework.id && aggregateArrangeBlend===100;
  if(els.arrangeAggregateButton){
    els.arrangeAggregateButton.classList.toggle('active',arranged);
    els.arrangeAggregateButton.setAttribute('aria-pressed',String(arranged));
    els.arrangeAggregateButton.title=`Arrange the visible ${workspaceMapMode==='focus'?'focus or path':'aggregate'} map using ${framework.label}. Original positions are preserved.`;
  }
  if(els.reflowArrangeButton)els.reflowArrangeButton.classList.toggle('hidden',!arranged);
  if(els.originalAggregateButton){
    els.originalAggregateButton.classList.toggle('active',!arranged);
    els.originalAggregateButton.setAttribute('aria-pressed',String(!arranged));
  }
  if(els.workspaceTutorialButton){
    if(framework.id==='tracework'){
      els.workspaceTutorialButton.textContent='? Tutorial';
      els.workspaceTutorialButton.dataset.tutorial='workspace';
      delete els.workspaceTutorialButton.dataset.frameworkTutorial;
      els.workspaceTutorialButton.title='Workspace tutorial';
    }else{
      els.workspaceTutorialButton.textContent=`? ${framework.shortLabel} guide`;
      els.workspaceTutorialButton.dataset.frameworkTutorial=framework.id;
      delete els.workspaceTutorialButton.dataset.tutorial;
      els.workspaceTutorialButton.title=`Reopen the ${framework.label} framework guide`;
    }
  }
  renderLegend(frameworkLegend(framework.id));
}

function setFrameworkMode(id='tracework'){
  const state=getState();
  const framework=getFramework(id);
  const current=state.frameworkId||'tracework';
  if(state.frameworkLocked && framework.id!==current){
    if(els.frameworkSelect) els.frameworkSelect.value=current;
    toast(`${getFramework(current).label} is locked for this project. Unlock it before changing frameworks.`);
    return;
  }
  if(framework.id===current){ updateFrameworkControls(state); updateThoughtSuggestion(); return; }
  patchState({frameworkId:framework.id});
  // Persist the last-used framework immediately so reopening this trace restores the same lens,
  // even if the page is closed before the normal autosave debounce finishes.
  saveProject(getState());
  showNodeTypes=framework.id!=='freeform';
  aggregateTypeFilter='all';
  selectedEdgeId=null; traceIssueNodeIds.clear(); focusPathRootId=null;
  aggregateArrangeSession=null; aggregateArrangeBlend=0;focusArrangeMode=false;
  renderWorkspace();
  updateThoughtSuggestion();
  maybeOpenFrameworkTutorial(framework.id);
  toast(`${framework.label}${framework.source&&framework.source!==framework.label?` · ${framework.source}`:''} · ${framework.description}`);
}


function toggleFrameworkLock(){
  const state=getState();
  if(!state.brief)return;
  const next=!Boolean(state.frameworkLocked);
  patchState({frameworkLocked:next});
  saveProject(getState());
  updateFrameworkControls(getState());
  const framework=getFramework(getState().frameworkId||'tracework');
  toast(next?`${framework.label} locked for this project.`:`${framework.label} unlocked. Frameworks can be changed again.`);
}


function setWorkspaceMapMode(mode='focus'){
  const next=mode==='aggregate'?'aggregate':'focus';
  if(next===workspaceMapMode)return;
  // Capture the outgoing canvas *before* changing its layout or viewport.
  rememberActiveMapView();
  const saved=mapWorkspaceViews[next];
  if(next==='focus'){
    const state=getState();
    let hotspotId=saved?.hotspotId;
    if(!hotspotId||!state.hotspots.some(h=>h.id===hotspotId)){
      const active=state.nodes.find(n=>n.id===state.activeNodeId);
      hotspotId=active?.meta?.hotspotId||state.selectedHotspotId||state.nodes.find(n=>n.meta?.hotspotId)?.meta?.hotspotId||state.hotspots?.[0]?.id||null;
    }
    if(!hotspotId){toast('Choose a hotspot first to open a focus map.');return;}
    patchState({selectedHotspotId:hotspotId},{silent:true});
  }
  workspaceMapMode=next;
  selectedEdgeId=null;traceIssueNodeIds.clear();selectedNodeIds.clear();
  if(saved && next==='focus'){
    focusPathRootId=getState().nodes.some(n=>n.id===saved.focusRoot)?saved.focusRoot:null;
    focusArrangeMode=Boolean(saved.arranged);
  }
  if(saved && next==='aggregate'){
    aggregateArrangeBlend=saved.arranged?100:0;
    if(saved.arranged && !aggregateArrangeSession){
      const state=getState(),frameworkId=state.frameworkId||'tracework';
      aggregateArrangeSession={frameworkId,before:aggregateOriginalPositions(state),target:frameworkAggregateLayout(state,frameworkId)};
    }
  }
  const restored=applySavedMapView(saved);
  if(!restored){
    canvasZoom=1;updateZoomLabel();
    if(els.graphViewport)els.graphViewport.dataset.needsInitialPosition='1';
  }
  renderWorkspace();
  if(!restored && next==='aggregate'){
    setTimeout(()=>{if(workspaceMapMode!==next)return;canvasZoom=fitGraph(els.graphViewport,els.graphStage,els.graphSurface);updateZoomLabel();queueViewportSave();},50);
  }
  // Save both per-map views, not just the currently selected mode.
  setTimeout(()=>queueViewportSave(),80);
}

function updateMapModeControls(state){
  if(els.focusMapModeButton) els.focusMapModeButton.classList.toggle('active',workspaceMapMode==='focus');
  if(els.aggregateMapModeButton){
    els.aggregateMapModeButton.classList.toggle('active',workspaceMapMode==='aggregate');
    els.aggregateMapModeButton.disabled=!state.nodes.length;
  }
  if(els.aggregateControls) els.aggregateControls.classList.toggle('hidden',workspaceMapMode!=='aggregate');
}

function resetAggregateFilters({render=true}={}){
  aggregateHotspotFilter='all'; aggregateChunkFilter='all'; aggregateTypeFilter='all'; aggregateStatusFilter='all';
  if(els.aggregateHotspotFilter) els.aggregateHotspotFilter.value='all';
  if(els.aggregateChunkFilter) els.aggregateChunkFilter.value='all';
  if(els.aggregateTypeFilter) els.aggregateTypeFilter.value='all';
  if(els.aggregateStatusFilter) els.aggregateStatusFilter.value='all';
  focusPathRootId=null; selectedEdgeId=null;
  if(render && workspaceMapMode==='aggregate') renderWorkspace();
}

function updateAggregateControls(state){
  const hotspotCounts=new Map();
  state.nodes.forEach(n=>{ const id=n.meta?.hotspotId; if(id)hotspotCounts.set(id,(hotspotCounts.get(id)||0)+1); });
  const hotspotOptions=['<option value="all">All hotspots</option>',...state.hotspots.filter(h=>hotspotCounts.has(h.id)).map(h=>`<option value="${escapeHtml(h.id)}">${escapeHtml(h.text)} · ${hotspotCounts.get(h.id)}</option>`)].join('');
  if(els.aggregateHotspotFilter){ els.aggregateHotspotFilter.innerHTML=hotspotOptions; if([...els.aggregateHotspotFilter.options].some(o=>o.value===aggregateHotspotFilter)) els.aggregateHotspotFilter.value=aggregateHotspotFilter; else aggregateHotspotFilter=els.aggregateHotspotFilter.value='all'; }

  const chunkById=new Map((state.briefChunks||[]).map(c=>[c.id,c]));
  const chunkCounts=new Map();
  state.nodes.forEach(n=>{ const h=state.hotspots.find(x=>x.id===n.meta?.hotspotId); const cid=h?.chunkId; if(cid)chunkCounts.set(cid,(chunkCounts.get(cid)||0)+1); });
  const chunkOptions=['<option value="all">All sections</option>',...[...chunkCounts.entries()].map(([id,count])=>`<option value="${escapeHtml(id)}">${escapeHtml(chunkById.get(id)?.title||'Source section')} · ${count}</option>`)].join('');
  if(els.aggregateChunkFilter){ els.aggregateChunkFilter.innerHTML=chunkOptions; if([...els.aggregateChunkFilter.options].some(o=>o.value===aggregateChunkFilter)) els.aggregateChunkFilter.value=aggregateChunkFilter; else aggregateChunkFilter=els.aggregateChunkFilter.value='all'; }

  const framework=getFramework(state.frameworkId||'tracework');
  if(els.aggregateTypeFilter){
    if(framework.id!=='freeform' && framework.id!=='tracework'){
      els.aggregateTypeFilter.innerHTML=['<option value="all">All framework roles</option>',...framework.categories.map(c=>`<option value="${escapeHtml(c.id)}">${escapeHtml(c.label)}</option>`),'<option value="note">Notes</option>'].join('');
    }else{
      const typeOrder=['input','interpretation','grounding','consequence','evaluation','goal','note'];
      els.aggregateTypeFilter.innerHTML=['<option value="all">All node types</option>',...typeOrder.map(t=>`<option value="${t}">${escapeHtml(typeLabels[t]||t)}</option>`)].join('');
    }
    if([...els.aggregateTypeFilter.options].some(o=>o.value===aggregateTypeFilter)) els.aggregateTypeFilter.value=aggregateTypeFilter;
    else aggregateTypeFilter=els.aggregateTypeFilter.value='all';
  }
  if(els.aggregateStatusFilter) els.aggregateStatusFilter.value=aggregateStatusFilter;
}

function aggregateOriginalPositions(state){
  // Original is intentionally the combined *unstructured reasoning network*.
  // Never fabricate TRACEWORK-grammar columns here; framework sorting is Arrange's job.
  // Honour manually saved original placements, while spreading overlapping focus-local
  // node coordinates just enough to make a legible, naturally tangled overview.
  const nodes=state.nodes||[],hotspots=state.hotspots||[];
  const hotspotOrder=new Map(hotspots.map((h,i)=>[h.id,i]));
  const hotspotCount=Math.max(1,new Set(nodes.map(n=>n.meta?.hotspotId||'__loose__')).size);
  const out=new Map();
  nodes.forEach((n,index)=>{
    const original=n.meta?.aggregateOriginalPosition;
    if(original&&Number.isFinite(Number(original.x))&&Number.isFinite(Number(original.y))){
      out.set(n.id,{x:Number(original.x),y:Number(original.y)});return;
    }
    const spot=hotspotOrder.get(n.meta?.hotspotId)??hotspots.length;
    // Source-local x/y maintain the reasoning geometry. Small radial offsets
    // separate otherwise-identical traces, without inventing role-based columns.
    const angle=(spot*2.399963229728653)%(2*Math.PI);
    const radius=92+Math.sqrt(spot)*112;
    const x=(Number.isFinite(Number(n.x))?Number(n.x):80)+Math.cos(angle)*radius+480;
    const y=(Number.isFinite(Number(n.y))?Number(n.y):80)+Math.sin(angle)*radius+490;
    out.set(n.id,{x:Math.max(0,x),y:Math.max(0,y)});
  });
  return out;
}

function currentAggregateArrangement(state){
  const frameworkId=state.frameworkId||'tracework';
  if(!aggregateArrangeSession || aggregateArrangeSession.frameworkId!==frameworkId)return aggregateOriginalPositions(state);
  const t=Math.max(0,Math.min(100,Number(aggregateArrangeBlend)||0))/100;
  const positions=new Map();
  const ids=new Set([...aggregateArrangeSession.before.keys(),...aggregateArrangeSession.target.keys()]);
  ids.forEach(id=>{
    const a=aggregateArrangeSession.before.get(id)||aggregateArrangeSession.target.get(id);
    const b=aggregateArrangeSession.target.get(id)||a;
    if(a&&b)positions.set(id,{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
  });
  return positions;
}


function deoverlapAggregateLayout(nodes,positions){
  // Framework layouts are semantic guides, not packing diagrams. Keep generous
  // clearance between cards so long labels never land on top of neighbours.
  const placed=(nodes||[]).map((n,index)=>{
    const p=positions.get(n.id)||{x:n.x||0,y:n.y||0};
    const lines=Math.max(0,Math.ceil(String(n.label||'').length/34)-2);
    const isVisual=n.meta?.artifactKind==='architectural-proposition';
    const isDigest=n.meta?.artifactKind==='reasoning-digest';
    const h=isVisual?435:isDigest?260:Math.min(225,112+(lines*18)+(n.meta?.provenance&&n.meta.provenance!=='designer'?14:0));
    return {id:n.id,index,x:p.x,y:p.y,w:isVisual?350:isDigest?285:230,h};
  }).sort((a,b)=>a.y-b.y||a.x-b.x||a.index-b.index);
  const gapX=64,gapY=58;
  for(let pass=0;pass<24;pass++){
    let moved=false;
    for(let i=0;i<placed.length;i++){
      const a=placed[i];
      for(let j=i+1;j<placed.length;j++){
        const b=placed[j];
        const overlapX=Math.min(a.x+a.w+gapX,b.x+b.w+gapX)-Math.max(a.x,b.x);
        const overlapY=Math.min(a.y+a.h+gapY,b.y+b.h+gapY)-Math.max(a.y,b.y);
        if(overlapX>0 && overlapY>0){
          // Preserve the framework's horizontal role bands whenever possible;
          // resolve collisions vertically rather than shuffling nodes into new roles.
          b.y += overlapY + 8;
          moved=true;
        }
      }
    }
    if(!moved)break;
  }
  const out=new Map(positions);
  placed.forEach(p=>out.set(p.id,{x:p.x,y:p.y}));
  return out;
}

function frameworkAggregateLayout(state,frameworkId=state.frameworkId||'tracework'){
  const nodes=state.nodes||[];
  // Generate a fresh framework layout only when Arrange Map is explicitly requested.
  const savedPosition=n=>{
    const pos=n.meta?.aggregateArrangedPositions?.[frameworkId];
    return pos && Number.isFinite(Number(pos.x)) && Number.isFinite(Number(pos.y))
      ? {x:Number(pos.x),y:Number(pos.y)} : null;
  };

  if(frameworkId==='freeform'){
    const hotspotIndex=new Map((state.hotspots||[]).map((h,i)=>[h.id,i]));
    const ordered=[...nodes].sort((a,b)=>{
      const ah=hotspotIndex.get(a.meta?.hotspotId)??9999,bh=hotspotIndex.get(b.meta?.hotspotId)??9999;
      return ah-bh || String(a.createdAt||'').localeCompare(String(b.createdAt||'')) || String(a.id).localeCompare(String(b.id));
    });
    const columns=Math.max(4,Math.min(7,Math.ceil(Math.sqrt(Math.max(1,ordered.length)*1.25))));
    const hash=value=>{ let h=0; for(const ch of String(value||''))h=((h<<5)-h+ch.charCodeAt(0))|0; return Math.abs(h); };
    const positions=new Map();
    ordered.forEach((n,i)=>{
      const saved=savedPosition(n); if(saved){positions.set(n.id,saved);return;}
      const col=i%columns,row=Math.floor(i/columns);
      const serpentine=row%2===1?(columns-1-col):col;
      const jitterX=(hash(n.id)%31)-15,jitterY=(hash(`${n.id}-free-y`)%29)-14;
      positions.set(n.id,{x:90+serpentine*420+jitterX,y:80+row*270+jitterY});
    });
    return deoverlapAggregateLayout(nodes,positions);
  }

  const framework=getFramework(frameworkId);
  const categories=framework.categories||frameworkCategories('tracework');

  // Some literature frameworks are not linear taxonomies. Arrange the aggregate
  // according to the character of the selected lens without changing any reasoning.
  if(framework.arrangement==='network') {
    const positions=new Map();
    const hash=value=>{ let h=0; for(const ch of String(value||''))h=((h<<5)-h+ch.charCodeAt(0))|0; return Math.abs(h); };
    const cols=Math.max(2,Math.ceil(Math.sqrt(Math.max(1,categories.length))));
    const centers=new Map(categories.map((c,i)=>[c.id,{x:170+(i%cols)*760,y:130+Math.floor(i/cols)*690}]));
    const counts=new Map();
    nodes.forEach(n=>{
      const saved=savedPosition(n); if(saved){positions.set(n.id,saved);return;}
      if(n.type==='note'&&!n.meta?.artifactKind){
        const nth=counts.get('__note__')||0; counts.set('__note__',nth+1);
        positions.set(n.id,{x:190+(nth%3)*420,y:140+Math.ceil(categories.length/cols)*690+Math.floor(nth/3)*265});
        return;
      }
      const role=n.meta?.artifactKind?null:frameworkRoleForNode(n,frameworkId);
      const roleId=n.meta?.artifactKind?'__visuals__':role?.id||categories[0]?.id;
      const center=centers.get(roleId)||(n.meta?.artifactKind?{x:190+(cols-1)*760,y:130+Math.ceil(categories.length/cols)*690}:{x:130,y:110});
      const nth=counts.get(roleId)||0; counts.set(roleId,nth+1);
      const localCol=nth%3,localRow=Math.floor(nth/3);
      const jitterX=(hash(n.id)%25)-12,jitterY=(hash(`${n.id}-network-y`)%23)-11;
      positions.set(n.id,{x:center.x+(localCol-1)*420+jitterX,y:center.y+localRow*265+jitterY});
    });
    return deoverlapAggregateLayout(nodes,positions);
  }

  if(framework.arrangement==='cycle') {
    const positions=new Map();
    const counts=new Map();
    const cx=1180,cy=760,rx=1010,ry=610;
    const centers=new Map(categories.map((c,i)=>{
      const angle=(-Math.PI/2)+(Math.PI*2*i/Math.max(1,categories.length));
      return [c.id,{x:cx+Math.cos(angle)*rx,y:cy+Math.sin(angle)*ry}];
    }));
    nodes.forEach(n=>{
      const saved=savedPosition(n); if(saved){positions.set(n.id,saved);return;}
      if(n.type==='note'&&!n.meta?.artifactKind){
        const nth=counts.get('__note__')||0; counts.set('__note__',nth+1);
        positions.set(n.id,{x:cx-235+(nth%2)*450,y:cy-65+Math.floor(nth/2)*235});
        return;
      }
      const role=n.meta?.artifactKind?null:frameworkRoleForNode(n,frameworkId);
      const roleId=n.meta?.artifactKind?'__visuals__':role?.id||categories[0]?.id;
      const center=centers.get(roleId)||(n.meta?.artifactKind?{x:cx+rx*.65,y:cy+ry*.35}:{x:cx,y:cy});
      const nth=counts.get(roleId)||0; counts.set(roleId,nth+1);
      const ring=Math.floor(nth/4),slot=nth%4;
      positions.set(n.id,{x:center.x+(slot%2)*420-210,y:center.y+Math.floor(slot/2)*225+ring*380-110});
    });
    return deoverlapAggregateLayout(nodes,positions);
  }

  // Ordered/framework layouts: each role gets a readable column, while hotspot
  // groups stay adjacent within that role. Avoid old 405px row lanes, which
  // multiplied whitespace and made Arrange look like a stretched spreadsheet.
  const hotspotIndex=new Map((state.hotspots||[]).map((h,i)=>[h.id,i]));
  const byRole=new Map([...categories.map(c=>[c.id,[]]),['__note__',[]],['__artifact__',[]]]);
  nodes.forEach(n=>{
    const role=n.meta?.artifactKind?'__artifact__':n.type==='note'?'__note__':frameworkRoleForNode(n,frameworkId)?.id||categories[0]?.id;
    if(!byRole.has(role))byRole.set(role,[]);
    byRole.get(role).push(n);
  });
  const positions=new Map();
  [...byRole.entries()].forEach(([role,group],index)=>{
    group.sort((a,b)=>{
      const ah=hotspotIndex.get(a.meta?.hotspotId)??9999,bh=hotspotIndex.get(b.meta?.hotspotId)??9999;
      return ah-bh||String(a.createdAt||'').localeCompare(String(b.createdAt||''))||String(a.id).localeCompare(String(b.id));
    });
    let cursorY=96,lastHotspot=null;
    group.forEach(n=>{
      const saved=savedPosition(n);
      if(saved){positions.set(n.id,saved);return;}
      if(lastHotspot!==null && lastHotspot!==n.meta?.hotspotId)cursorY+=25;
      lastHotspot=n.meta?.hotspotId;
      const lines=Math.max(0,Math.ceil(String(n.label||'').length/34)-2);
      const height=n.meta?.artifactKind==='architectural-proposition'?455:n.meta?.artifactKind==='reasoning-digest'?270:Math.min(240,112+lines*18+(n.meta?.provenance&&n.meta.provenance!=='designer'?14:0));
      positions.set(n.id,{x:100+index*425,y:cursorY});
      cursorY+=height+72;
    });
  });
  return deoverlapAggregateLayout(nodes,positions);
}

function aggregateTrace(state,{ignoreFilters=false}={}){
  const positions=currentAggregateArrangement(state);
  const hotspotById=new Map((state.hotspots||[]).map(h=>[h.id,h]));
  let nodes=(state.nodes||[]).map(n=>{ const pos=positions.get(n.id)||{x:n.x||0,y:n.y||0}; return {...n,x:pos.x,y:pos.y}; });
  if(!ignoreFilters){
    nodes=nodes.filter(n=>{
      const hotspot=hotspotById.get(n.meta?.hotspotId);
      if(aggregateHotspotFilter!=='all' && n.meta?.hotspotId!==aggregateHotspotFilter) return false;
      if(aggregateChunkFilter!=='all' && hotspot?.chunkId!==aggregateChunkFilter) return false;
      if(aggregateTypeFilter!=='all'&&!n.meta?.artifactKind){
        const framework=getFramework(state.frameworkId||'tracework');
        if(framework.id!=='freeform' && framework.id!=='tracework'){
          const role=n.type==='note'?'note':frameworkRoleForNode(n,framework.id)?.id;
          if(role!==aggregateTypeFilter) return false;
        }else if(n.type!==aggregateTypeFilter) return false;
      }
      const status=(n.status==='rejected'||n.meta?.status==='rejected')?'rejected':n.meta?.provisional?'provisional':'active';
      if(aggregateStatusFilter!=='all' && status!==aggregateStatusFilter) return false;
      return true;
    });
  }
  const ids=new Set(nodes.map(n=>n.id));
  const edges=(state.edges||[]).filter(e=>ids.has(e.source)&&ids.has(e.target));
  return {nodes,edges};
}

function focusArrangementKey(state){
  return `${state.frameworkId||'tracework'}|${state.selectedHotspotId||'none'}|${focusPathRootId||'all'}`;
}
function focusArrangedTrace(state,scoped){
  if(!focusArrangeMode||workspaceMapMode==='aggregate')return scoped;
  const key=focusArrangementKey(state),frameworkId=state.frameworkId||'tracework';
  // Delegate role-aware placement to existing framework layout, but use a distinct
  // focus-only coordinate store. Never pull from aggregate/Original positions.
  const nodes=scoped.nodes.map(n=>({...n,meta:{...n.meta,aggregateArrangedPositions:{[frameworkId]:n.meta?.focusArrangedPositions?.[key]}}}));
  const positions=frameworkAggregateLayout({...state,nodes},frameworkId);
  return {nodes:scoped.nodes.map(n=>{const pos=positions.get(n.id)||n;return {...n,x:pos.x,y:pos.y};}),edges:scoped.edges};
}
function workspaceTrace(state){
  return workspaceMapMode==='aggregate'?aggregateTrace(state):focusArrangedTrace(state,scopedTrace(state));
}

// Stage C: deliberately reflow the active framework without affecting source positions.
function reflowAggregateMap(){
  if(workspaceMapMode==='focus'){
    if(!focusArrangeMode)return;
    const state=getState(),key=focusArrangementKey(state);
    checkpoint('reflow focused framework layout');
    updateState(st=>st.nodes.forEach(n=>{if(!n.meta?.focusArrangedPositions?.[key])return;
      const copy={...n.meta.focusArrangedPositions};delete copy[key];n.meta={...n.meta,focusArrangedPositions:copy};}));
    renderWorkspace();
    setTimeout(()=>{canvasZoom=fitGraph(els.graphViewport,els.graphStage,els.graphSurface);updateZoomLabel();queueViewportSave();},40);
    toast('Focused arrangement regenerated. Original nodes remain unchanged.');return;
  }
  if(workspaceMapMode!=='aggregate'||aggregateArrangeBlend!==100)return;
  const state=getState(),frameworkId=state.frameworkId||'tracework';
  checkpoint(`reflow ${frameworkId} presentation`);
  updateState(st=>st.nodes.forEach(node=>{
    const saved=node.meta?.aggregateArrangedPositions;
    if(!saved||!Object.prototype.hasOwnProperty.call(saved,frameworkId))return;
    const remaining={...saved};delete remaining[frameworkId];
    node.meta={...(node.meta||{}),aggregateArrangedPositions:remaining};
  }));
  const target=frameworkAggregateLayout(getState(),frameworkId);
  aggregateArrangeSession={frameworkId,before:aggregateOriginalPositions(getState()),target:new Map(target)};
  aggregateArrangeBlend=100;
  renderWorkspace();
  setTimeout(()=>{canvasZoom=fitGraph(els.graphViewport,els.graphStage,els.graphSurface);updateZoomLabel();},40);
  toast('Framework arrangement regenerated. Original and Focus maps are unchanged; Ctrl+Z restores the previous arrangement.');
}

// A deliberate two-position toggle, never a blend slider.
function arrangeAggregateMap(){setAggregateLayout('arranged');}
function setAggregateLayout(mode='original'){
  if(workspaceMapMode==='focus'){
    const arranged=mode==='arranged';
    if(arranged&&!focusArrangeMode)checkpoint('arrange focused map');
    focusArrangeMode=arranged;
    selectedNodeIds.clear();selectedEdgeId=null;
    renderWorkspace();
    setTimeout(()=>{canvasZoom=fitGraph(els.graphViewport,els.graphStage,els.graphSurface);updateZoomLabel();queueViewportSave();},40);
    toast(arranged?'Arrange · framework-aware focused view; Original unchanged.':'Original · restored the authored node positions.');
    return;
  }
  const arranged=mode==='arranged';
  const state=getState(),frameworkId=state.frameworkId||'tracework';
  if(arranged && (!aggregateArrangeSession || aggregateArrangeSession.frameworkId!==frameworkId)){
    checkpoint(`arrange ${frameworkId} aggregate map`);
    const before=aggregateOriginalPositions(state);
    const target=frameworkAggregateLayout(state,frameworkId);
    aggregateArrangeSession={frameworkId,before:new Map(before),target:new Map(target)};
  }
  aggregateArrangeBlend=arranged?100:0;
  selectedNodeIds.clear();selectedEdgeId=null;
  renderWorkspace();
  setTimeout(()=>{canvasZoom=fitGraph(els.graphViewport,els.graphStage,els.graphSurface);updateZoomLabel();},40);
  toast(arranged?'Arrange map · framework-aware layout. Rearrange without altering Original.':'Original map · unstructured combined network. Source movements are reflected in Arrange.');
}

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
