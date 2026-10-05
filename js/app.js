import { getState, resetState, replaceState, patchState, updateState, subscribe, logEvent } from './core/state.js';
import { saveProject, loadProject, listProjects, ensureProject, deleteProject, clearAllProjects, exportProject } from './core/storage.js';
import { loadOntology, typeLabels } from './core/ontology.js';
import { createNode, createEdge } from './core/trace-model.js';
import { normaliseBrief } from './input/brief-parser.js';
import { chunkBrief, attachChunksToHotspots } from './input/brief-chunker.js';
import { readBriefFile } from './input/document-loader.js';
import { detectHotspots } from './input/hotspot-detector.js';
import { classifyThought } from './input/thought-classifier.js';
import { addInterpretation } from './reasoning/interpretation.js';
import { addGrounding } from './reasoning/grounding.js';
import { addConsequence } from './reasoning/consequences.js';
import { addEvaluation, addGoal } from './reasoning/evaluation.js';
import { createBranch, forkNext, nextNodeType, rejectBranch, restoreBranch, repairSharedInputs } from './reasoning/branching.js';
import { renderGraph } from './graph/graph-renderer.js';
import { applyZoom, fitGraph, focusNode, bindCanvasPan, bindWheelZoom } from './graph/graph-interactions.js';
import { connectionCheck } from './graph/connection-rules.js';
import { loadPathways, searchPathways } from './evidence/pathway-bank.js';
import { loadCaseStudies } from './evidence/case-studies.js';
import { loadPilotEvidence, transitionEvidence, transitionSummary } from './evidence/pilot-evidence.js';
import { branchSummaries, compareBranches } from './compare/pathway-compare.js';
import { renderBrief, renderLegend, toggleBriefEditor } from './ui/workspace.js';
import { renderEmptyInspector, renderHotspotInspector, renderNodeInspector } from './ui/panels.js';
import { renderTraceDashboard } from './ui/trace-panel.js';
import { openModal, closeModal } from './ui/modals.js';
import { toast, coach, setSaveStatus } from './ui/notifications.js';

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
let lastAddedNodeId = null;
let selectedEdgeId = null;
let selectedNodeIds = new Set();
let traceIssueNodeIds = new Set();
const undoStack = [];
const MAX_UNDO = 30;

async function init(){
  cacheEls();
  ontology = await loadOntology();
  pathways = await loadPathways();
  caseStudies = await loadCaseStudies();
  pilotEvidence = await loadPilotEvidence();
  renderLegend(ontology);
  bindGlobalEvents();
  updateUndoButton();
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
    briefLanding:$('#landingBrief'),projectNameLanding:$('#landingProjectName'),briefEditor:$('#briefEditor'),briefFileInput:$('#briefFileInput'),briefFileStatus:$('#briefFileStatus'),briefChunkPreview:$('#briefChunkPreview'),documentBriefTools:$('#documentBriefTools'),hotspotViewSelect:$('#hotspotViewSelect'),graphViewport:$('#graphViewport'),graphStage:$('#graphStage'),graphSurface:$('#graphSurface'),graphNodes:$('#graphNodes'),graphEdges:$('#graphEdges'),canvasEmpty:$('#canvasEmpty'),
    thoughtDock:$('#thoughtDock'),freeThoughtInput:$('#freeThoughtInput'),thoughtTypeSelect:$('#thoughtTypeSelect'),thoughtReason:$('#thoughtReason'),thoughtMatches:$('#thoughtMatches'),addFreeThoughtButton:$('#addFreeThoughtButton'),addLooseNoteButton:$('#addLooseNoteButton'),toggleHotspotsButton:$('#toggleHotspotsButton'),traceCheckButton:$('#traceCheckButton'),toggleNodeTypesButton:$('#toggleNodeTypesButton'),toggleWireSignalsButton:$('#toggleWireSignalsButton'),undoButton:$('#undoButton'),findNodeButton:$('#findNodeButton')
  });
}

function bindGlobalEvents(){
  $('#loadDemoButton').onclick=async()=>{ const demo=await (await fetch('./data/demo-project.json')).json(); els.briefLanding.value=demo.brief; if(els.projectNameLanding)els.projectNameLanding.value=demo.projectName||'Flexible Pavilion — example'; pendingBriefFileName=''; pendingBriefChunks=landingBriefMode==='document'?chunkBrief(demo.brief):[]; updateLandingChunkPreview(); els.briefLanding.focus(); };
  document.querySelectorAll('[data-brief-mode]').forEach(b=>b.onclick=()=>setLandingBriefMode(b.dataset.briefMode,{clear:true}));
  els.briefFileInput?.addEventListener('change',handleBriefFileUpload);
  els.briefLanding.addEventListener('input',()=>{ if(landingBriefMode==='document'){ pendingBriefChunks=chunkBrief(els.briefLanding.value); updateLandingChunkPreview(); } });
  $('#startTracingButton').onclick=()=>startFromBrief(els.briefLanding.value,{mode:landingBriefMode,fileName:pendingBriefFileName,projectName:els.projectNameLanding?.value||''});
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
  els.toggleNodeTypesButton.onclick=()=>{ showNodeTypes=!showNodeTypes; els.toggleNodeTypesButton.textContent=showNodeTypes?'Hide node types':'Show node types'; renderGraphState(); };
  if(els.toggleWireSignalsButton) els.toggleWireSignalsButton.onclick=()=>{ showWireSignals=!showWireSignals; els.toggleWireSignalsButton.textContent=showWireSignals?'Hide wire signals':'Show wire signals'; renderGraphState(); };
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
  if(els.undoButton) els.undoButton.onclick=undoLast;
  if(els.findNodeButton) els.findNodeButton.onclick=openNodeSearch;
  document.addEventListener('keydown',handleWorkspaceKeydown);
  document.addEventListener('pointerdown',e=>{ if(!e.target.closest?.('.node-context-menu')) closeNodeContext(); if(!e.target.closest?.('.node-status-menu,.node-status')) document.getElementById('nodeStatusMenu')?.remove(); });
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
    if(els.briefFileInput)els.briefFileInput.value='';
    if(els.briefFileStatus)els.briefFileStatus.textContent='PDF, DOCX, TXT or MD · processed locally in your browser.';
  }
  document.querySelectorAll('[data-brief-mode]').forEach(b=>b.classList.toggle('active',b.dataset.briefMode===landingBriefMode));
  els.documentBriefTools?.classList.toggle('hidden',landingBriefMode!=='document');
  els.briefLanding.placeholder=landingBriefMode==='document'
    ? 'Paste a long brief here, or upload PDF, DOCX, TXT or MD…'
    : 'Paste a brief, requirement, design statement or project intention…';
  pendingBriefChunks=landingBriefMode==='document'?chunkBrief(els.briefLanding.value):[];
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
    if(els.briefFileStatus)els.briefFileStatus.textContent=`${pendingBriefFileName} · ${pendingBriefChunks.length} section${pendingBriefChunks.length===1?'':'s'} detected · processed locally`;
    updateLandingChunkPreview();
  }catch(err){
    pendingBriefChunks=[];
    if(els.briefFileStatus)els.briefFileStatus.textContent=`Could not read ${pendingBriefFileName}. ${err?.message||'Try pasting the brief instead.'}`;
    toast('Could not read that brief file. You can still paste the text directly.');
  }
}

function updateLandingChunkPreview(){
  if(!els.briefChunkPreview)return;
  const show=landingBriefMode==='document' && pendingBriefChunks.length>1;
  els.briefChunkPreview.classList.toggle('hidden',!show);
  if(!show){els.briefChunkPreview.innerHTML='';return;}
  els.briefChunkPreview.innerHTML=`<div><strong>${pendingBriefChunks.length} brief sections detected</strong><span>TRACEWORK keeps them inside one project so hotspots can be read section by section.</span></div><div class="brief-chunk-preview-list">${pendingBriefChunks.slice(0,5).map((c,i)=>`<span>${i+1}. ${escapeHtml(c.title)}</span>`).join('')}${pendingBriefChunks.length>5?`<span>+ ${pendingBriefChunks.length-5} more</span>`:''}</div>`;
}

async function startFromBrief(raw,{mode=landingBriefMode,fileName=pendingBriefFileName,projectName=''}={}){
  const brief=normaliseBrief(raw);
  if(!brief){toast('Paste or upload a design brief first.');return;}
  const useChunks=mode==='document' || brief.length>2600;
  const chunks=useChunks?chunkBrief(brief):[];
  const detected=await detectHotspots(brief);
  const hotspots=attachChunksToHotspots(detected,chunks);
  resetState();
  patchState({
    brief,
    briefMode:useChunks?'document':'quick',
    briefChunks:chunks,
    activeBriefChunkId:chunks[0]?.id||null,
    sourceFileName:fileName||'',
    hotspots,
    projectName:projectName.trim()||projectNameFromBrief(brief)
  });
  logEvent('Brief analysed',`${hotspots.length} interpretive hotspots surfaced${chunks.length>1?` across ${chunks.length} sections`:''}`);
  enterApp(true);
}

function enterApp(autoSelect=true){
  canvasZoom=1; selectedEdgeId=null; selectedNodeIds.clear(); traceIssueNodeIds.clear(); undoStack.length=0; updateUndoButton(); updateZoomLabel();
  els.graphViewport.dataset.needsInitialPosition='1';
  els.landing.classList.add('hidden'); els.app.classList.remove('hidden');
  showView('workspace');
  renderWorkspace();
  if(autoSelect && getState().hotspots.length) selectHotspot(getState().hotspots[0].id);
}

function showLanding(){
  closeNodeContext(); document.getElementById('traceCheckPopover')?.remove(); document.getElementById('nodeSearchPopover')?.remove(); document.getElementById('nodeStatusMenu')?.remove(); traceIssueNodeIds.clear();
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

  const exportButton=$('#exportJsonButton'); if(exportButton) exportButton.disabled=!hasProject;
  window.scrollTo({top:0,behavior:'auto'});
}

function renderWorkspace(){
  const state=getState();
  renderBrief(state,{onHotspot:selectHotspot,onChunk:selectBriefChunk},{showSuggestions:showHotspotSuggestions,hotspotFilter:hotspotViewMode});
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
    onNodeClick:(id,e)=>selectNode(id,e),
    onEdgeClick:id=>selectEdge(id),
    onEdgeQuickDisconnect:id=>disconnectEdge(id),
    onNodeContext:(id,e)=>openNodeContext(id,e.clientX,e.clientY),
    onNodeStatusClick:(id,e)=>openNodeStatusMenu(id,e.clientX,e.clientY),
    onConnect:(source,target,result)=>connectNodes(source,target,result),
    canConnect:(source,target,edges)=>connectionCheck(source,target,edges,pilotEvidence),
    onNodeMove:(id,x,y)=>updateState(s=>{const n=s.nodes.find(n=>n.id===id);if(n){n.x=x;n.y=y;}}),
    getScale:()=>canvasZoom,
    selectedEdgeId,
    selectedNodeIds:[...selectedNodeIds],
    issueNodeIds:[...traceIssueNodeIds],
    showNodeTypes,
    showWireSignals,
    pilotEvidence
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

function selectBriefChunk(id){
  const state=getState();
  if(!state.briefChunks?.some(c=>c.id===id))return;
  patchState({activeBriefChunkId:id,selectedHotspotId:null,activeNodeId:null},{silent:true});
  selectedNodeIds.clear(); selectedEdgeId=null; traceIssueNodeIds.clear();
  renderWorkspace();
}

async function selectHotspot(id){
  const state=getState(), hotspot=state.hotspots.find(h=>h.id===id); if(!hotspot)return;
  let input=state.nodes.find(n=>n.type==='input'&&n.meta?.hotspotId===id);
  updateState(s=>{
    s.selectedHotspotId=id;
    if(hotspot.chunkId) s.activeBriefChunkId=hotspot.chunkId;
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
    onInterpretation:(text,prompt)=>addHotspotInterpretation(text,prompt,inputNodeId || getState().activeNodeId),
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
    created=addInterpretation(s,inputNodeId,value,input?.branchId||s.activeBranchId,{guided:true,sourcePrompt:prompt?.question||''});
    if(created){
      const baseX=Number.isFinite(Number(input?.x))?Number(input.x):fallback.x;
      const baseY=Number.isFinite(Number(input?.y))?Number(input.y):fallback.y;
      created.x=baseX+270;
      created.y=baseY;
      s.activeNodeId=created.id;
    }
  });
  lastAddedNodeId=created?.id||null;
  if(created?.id){selectedNodeIds.clear();selectedNodeIds.add(created.id);selectedEdgeId=null;}
  logEvent('Interpretation added',value);
  renderWorkspace();
  if(created)toast('Interpretation added and linked. Continue from the new node, or leave it open.');
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
  clearNewNodeHalo(); selectedNodeIds.clear(); selectedEdgeId=id; renderGraphState();
  const state=getState();
  const edge=state.edges.find(e=>e.id===id);
  const source=edge&&state.nodes.find(n=>n.id===edge.source);
  const target=edge&&state.nodes.find(n=>n.id===edge.target);
  const empirical=source&&target?transitionSummary(source.type,target.type,pilotEvidence):null;
  toast(empirical?`${empirical} · Delete/Backspace disconnects only this wire.`:'Only this connection is selected · press Delete/Backspace, or Shift-click it, to disconnect.');
}

function nodeHandlers(){
  return {
    onNext:(node,text,extra)=>{
      checkpoint('add guided reasoning step');
      let created=null;
      const fallback=visibleCanvasPlacement(getState().nodes.length+1);
      updateState(s=>{
        if(node.type==='interpretation') created=addGrounding(s,node.id,text,extra.sourceKind||'Designer rationale',node.branchId);
        else if(node.type==='grounding') created=addConsequence(s,node.id,text,node.branchId,extra.tags||[]);
        else if(node.type==='consequence') created=addEvaluation(s,node.id,text,node.branchId,extra.tags||[]);
        else if(node.type==='evaluation') created=addGoal(s,node.id,text,node.branchId);
        if(created){
          const baseX=Number.isFinite(Number(node.x))?Number(node.x):fallback.x;
          const baseY=Number.isFinite(Number(node.y))?Number(node.y):fallback.y;
          created.x=baseX+270;
          created.y=baseY;
          created.meta={...(created.meta||{}),guided:true,hotspotId:node.meta?.hotspotId||s.selectedHotspotId};
          s.activeNodeId=created.id;
        }
      });
      lastAddedNodeId=created?.id||null;
      if(created?.id){selectedNodeIds.clear();selectedNodeIds.add(created.id);selectedEdgeId=null;}
      const labels={interpretation:'Grounding added',grounding:'Spatial consequence added',consequence:'Evaluation added',evaluation:'Goal added'};
      logEvent(labels[node.type]||'Reasoning added',text); renderWorkspace();
      if(created) toast(`${typeLabels[created.type]||created.type} added and linked.`);
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
  openModal(`<h2 id="modalTitle">Edit ${escapeHtml(node.type==='note'?'note':node.type)}.</h2><p>Changing a reasoning move does not erase the rest of the trace. It makes revision visible.</p><textarea class="field-textarea" id="editNodeText">${escapeHtml(node.label)}</textarea><div class="modal-actions"><button class="secondary-button" data-close-modal>Cancel</button><button class="primary-button compact" id="saveNodeEdit">Save change</button></div>`,{
    onOpen:m=>m.querySelector('#saveNodeEdit').onclick=()=>{ const val=m.querySelector('#editNodeText').value.trim(); if(!val)return; updateState(s=>{const n=s.nodes.find(x=>x.id===node.id);n.label=val;if(n.type==='note'){const c=classifyThought(val);n.meta={...n.meta,suggestedType:c.type||'interpretation',classificationReason:c.reason,classificationConfidence:c.confidence};}n.updatedAt=new Date().toISOString();}); logEvent('Reasoning revised',val); closeModal(); renderWorkspace(); }
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
        const text=brief.slice(a,b).trim();
        if(!text){ picked=null; preview.textContent='Nothing selected yet'; confirm.disabled=true; return; }
        const leading=brief.slice(a,b).indexOf(text);
        const localStart=a+Math.max(0,leading);
        picked={text,start:baseOffset+localStart,end:baseOffset+localStart+text.length};
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

function renderPathwayBlank(){
  const root=$('#pathwayGrid');
  if(!root)return;
  const search=$('#pathwaySearch'); if(search){search.value='';search.disabled=true;}
  root.innerHTML='<div class="front-subview-note">Start or open a trace in Workspace first. Pathway Bank will then respond to the language and reasoning in that project rather than showing generic pathways.</div>';
}

function renderSavedTraceLibrary(){
  const root=$('#traceDashboard'); if(!root)return;
  const projects=listProjects();
  if(!projects.length){ root.innerHTML='<div class="empty-state-card" style="grid-column:1/-1">No traces are saved in this browser yet. Start one in Workspace and it will appear here.</div>'; return; }
  root.innerHTML=`<section class="saved-trace-library">${projects.map(p=>`<article class="project-card"><div><span class="project-card-label">${p.projectId==='tracework-test-pavilion'?'TEST PROJECT':'SAVED TRACE'}</span><h3>${escapeHtml(p.projectName||'Untitled trace')}</h3><p>${escapeHtml((p.brief||'').slice(0,105))}${(p.brief||'').length>105?'…':''}</p></div><div class="project-card-actions"><button class="secondary-button compact-project" data-open-library-project="${escapeHtml(p.projectId)}">Open</button><button class="project-delete-button" data-delete-library-project="${escapeHtml(p.projectId)}" title="Delete trace">×</button></div></article>`).join('')}</section>`;
  root.querySelectorAll('[data-open-library-project]').forEach(b=>b.onclick=()=>openSavedProject(b.dataset.openLibraryProject));
  root.querySelectorAll('[data-delete-library-project]').forEach(b=>b.onclick=()=>confirmDeleteSavedProject(b.dataset.deleteLibraryProject));
}

function renderDiscussionBlank(){
  const list=$('#discussionList'),scope=$('#discussionScope'),text=$('#discussionText'),button=$('#addDiscussionButton'),preview=$('#discussionAnchorPreview');
  if(list)list.innerHTML='<div class="empty-state-card" style="padding:28px">Open or start a trace first. Discussion belongs to a specific project, so nothing is shared or attached globally.</div>';
  if(scope){scope.innerHTML='<option>Open a trace to attach a note</option>';scope.disabled=true;}
  if(text){text.value='';text.disabled=true;text.placeholder='Open a trace first…';}
  if(button)button.disabled=true;
  if(preview){preview.classList.add('hidden');preview.innerHTML='';}
}

async function renderPathwayCards(query=''){
  const search=$('#pathwaySearch'); if(search)search.disabled=false;
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
  openModal(`<h2 id="modalTitle">Return to home?</h2><p>Your current trace is saved in this browser. Going home closes the active workspace session, so Pathway Bank, My Trace and Discussion will no longer carry this project until you reopen it.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Stay here</button><button class="primary-button compact" id="confirmHome">Go home</button></div>`,{onOpen:m=>m.querySelector('#confirmHome').onclick=()=>{closeModal();resetState();selectedEdgeId=null;selectedNodeIds.clear();traceIssueNodeIds.clear();showLanding();}});
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
    if(els.projectNameLanding)els.projectNameLanding.value='';
    setSaveStatus('Local data reset',false);
    renderProjectShelf();
    showLanding();
    toast('Local TRACEWORK data cleared.');
  }});
}

function confirmNewProject(){ openModal(`<h2 id="modalTitle">Start a new trace?</h2><p>Your current trace stays saved in this browser. You can reopen it from the project shelf.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Keep working</button><button class="secondary-button" id="exportBeforeNew">Export first</button><button class="primary-button compact" id="confirmNew">Start new</button></div>`,{onOpen:m=>{m.querySelector('#exportBeforeNew').onclick=()=>exportProject(getState());m.querySelector('#confirmNew').onclick=()=>{saveProject(getState());resetState();closeModal();els.briefLanding.value='';if(els.projectNameLanding)els.projectNameLanding.value='';showLanding();};}}); }


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
  checkpoint('add reasoning node');
  const state=getState(); const active=state.nodes.find(n=>n.id===state.activeNodeId);
  const classification=classifyThought(text,{afterType:active?.type==='note'?null:active?.type});
  const type=els.thoughtTypeSelect.value||classification.type||'interpretation';
  const selectedHotspotId=state.selectedHotspotId;
  const scoped=scopedTrace(state);
  const placement=visibleCanvasPlacement(scoped.nodes.length);
  const branchId=active?.branchId||`free-${Date.now()}`;
  let created=null;
  updateState(s=>{
    const node=createNode({type,label:text,branchId,x:placement.x,y:placement.y,meta:{freeform:true,hotspotId:selectedHotspotId,classifiedBy:'TRACEWORK',classificationReason:classification.reason,classificationConfidence:classification.confidence}});
    s.nodes.push(node);
    s.activeNodeId=node.id; s.activeBranchId=branchId;
    created=node;
  });
  lastAddedNodeId=created?.id||null;
  if(created?.id){selectedNodeIds.clear();selectedNodeIds.add(created.id);}
  logEvent('Free reasoning added',`${typeLabels[type]||type} · ${text}`);
  els.freeThoughtInput.value=''; els.thoughtTypeSelect.dataset.manual=''; updateThoughtSuggestion(); renderWorkspace();
  toast(`Added as ${typeLabels[type]||type}.`);
}

function addLooseNote(){
  const text=els.freeThoughtInput.value.trim(); if(!text)return;
  checkpoint('add note');
  const state=getState(); const active=state.nodes.find(n=>n.id===state.activeNodeId);
  const classification=classifyThought(text,{afterType:active?.type==='note'?null:active?.type});
  const scoped=scopedTrace(state); const placement=visibleCanvasPlacement(scoped.nodes.length+2);
  let created=null;
  updateState(s=>{
    const node=createNode({type:'note',label:text,branchId:`note-${Date.now()}`,x:placement.x,y:placement.y,meta:{hotspotId:s.selectedHotspotId,suggestedType:classification.type||'interpretation',classificationReason:classification.reason,classificationConfidence:classification.confidence}});
    s.nodes.push(node); s.activeNodeId=node.id; created=node;
  });
  lastAddedNodeId=created?.id||null;
  if(created?.id){selectedNodeIds.clear();selectedNodeIds.add(created.id);}
  logEvent('Loose note added',text);
  els.freeThoughtInput.value=''; els.thoughtTypeSelect.dataset.manual=''; updateThoughtSuggestion(); renderWorkspace();
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
    coach('Connection paused — here’s why','The wire needs to land on another node. A TRACEWORK connection states an explicit reasoning dependency, so leave the thought floating if the relationship is not clear yet.',{duration:6500,pinnable:true});
    return;
  }
  if(!result?.ok){
    coach('Connection paused — here’s why',`${result?.reason||'Those reasoning moves cannot be connected yet.'}${result?.detail?' '+result.detail:''}` ,{duration:7500,pinnable:true});
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
  toast('Reasoning moves connected.');
}

function handleWorkspaceKeydown(e){
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z'){
    const target=e.target;
    if(target && target.matches?.('input,textarea,select,[contenteditable="true"]'))return;
    e.preventDefault(); undoLast(); return;
  }
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='f'){
    const target=e.target;
    if(target && target.matches?.('input,textarea,select,[contenteditable="true"]'))return;
    if(els.app?.classList.contains('hidden') || $('#workspaceView')?.classList.contains('hidden'))return;
    e.preventDefault();openNodeSearch();return;
  }
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='g'){
    const target=e.target;
    if(target && target.matches?.('input,textarea,select,[contenteditable="true"]'))return;
    if(els.app?.classList.contains('hidden') || $('#workspaceView')?.classList.contains('hidden'))return;
    e.preventDefault();toggleGroupSelected(Boolean(e.shiftKey));return;
  }
  if(!['Delete','Backspace'].includes(e.key))return;
  const target=e.target;
  if(target && (target.matches?.('input,textarea,select,[contenteditable="true"]') || target.closest?.('.modal')))return;
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

function checkpoint(label='change'){
  undoStack.push({label,state:structuredClone(getState())});
  if(undoStack.length>MAX_UNDO)undoStack.shift();
  updateUndoButton();
}
function undoLast(){
  const entry=undoStack.pop();
  if(!entry){toast('Nothing to undo yet.');return;}
  replaceState(entry.state);
  selectedEdgeId=null;selectedNodeIds.clear();traceIssueNodeIds.clear();closeNodeContext();
  updateUndoButton();
  renderWorkspace();
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
  menu.innerHTML=`<button type="button" data-node-action="lock">${locked?'Unlock position':'Lock position'}</button>${groupAction}<button type="button" data-node-action="disconnect">Disconnect all wires</button>${wireActions?`<div class="node-context-divider"></div>${wireActions}`:''}<button type="button" data-node-action="delete" ${protectedSource?'disabled':''}>Delete node</button><small>${protectedSource?'Brief-source Inputs are protected.':'Shift-click selects several nodes · Ctrl+G groups them · Ctrl+F finds a node.'}</small>`;
  document.body.appendChild(menu);
  const rect=menu.getBoundingClientRect();
  menu.style.left=`${Math.max(8,Math.min(x,window.innerWidth-rect.width-8))}px`;
  menu.style.top=`${Math.max(8,Math.min(y,window.innerHeight-rect.height-8))}px`;
  menu.querySelector('[data-node-action="lock"]').onclick=()=>{toggleNodeLock(id);closeNodeContext();};
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

function openNodeSearch(){
  document.getElementById('nodeSearchPopover')?.remove();
  const scoped=scopedTrace(getState());
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
