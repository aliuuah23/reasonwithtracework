import { getState, resetState, replaceState, patchState, updateState, subscribe, logEvent } from './core/state.js';
import { saveProject, loadProject, clearProject, exportProject } from './core/storage.js';
import { loadOntology } from './core/ontology.js';
import { createNode, createEdge } from './core/trace-model.js';
import { normaliseBrief } from './input/brief-parser.js';
import { detectHotspots } from './input/hotspot-detector.js';
import { addInterpretation } from './reasoning/interpretation.js';
import { addGrounding } from './reasoning/grounding.js';
import { addConsequence } from './reasoning/consequences.js';
import { addEvaluation, addGoal } from './reasoning/evaluation.js';
import { createBranch, rejectBranch } from './reasoning/branching.js';
import { renderGraph } from './graph/graph-renderer.js';
import { fitGraph, focusNode, bindCanvasPan } from './graph/graph-interactions.js';
import { loadPathways, searchPathways } from './evidence/pathway-bank.js';
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
let saveTimer = null;

async function init(){
  cacheEls();
  ontology = await loadOntology();
  pathways = await loadPathways();
  renderLegend(ontology);
  bindGlobalEvents();
  bindCanvasPan(els.graphViewport);
  const saved = loadProject();
  if(saved?.brief){
    replaceState(saved);
    enterApp(false);
  } else {
    renderEmptyInspector();
  }
  subscribe(state => {
    setSaveStatus('Saving…',true);
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>{ saveProject(state); setSaveStatus('Saved locally',false); },220);
  });
}

function cacheEls(){
  Object.assign(els,{
    landing:$('#landingView'),app:$('#appView'),workspace:$('#workspaceView'),pathways:$('#pathwaysView'),trace:$('#traceView'),
    briefLanding:$('#landingBrief'),briefEditor:$('#briefEditor'),graphViewport:$('#graphViewport'),graphSurface:$('#graphSurface'),graphNodes:$('#graphNodes'),graphEdges:$('#graphEdges'),canvasEmpty:$('#canvasEmpty')
  });
}

function bindGlobalEvents(){
  $('#loadDemoButton').onclick=async()=>{ const demo=await (await fetch('./data/demo-project.json')).json(); els.briefLanding.value=demo.brief; els.briefLanding.focus(); };
  $('#startTracingButton').onclick=()=>startFromBrief(els.briefLanding.value);
  $('#brandButton').onclick=()=>{ if(getState().brief)showView('workspace'); else showLanding(); };
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view));
  $('#newProjectButton').onclick=confirmNewProject;
  $('#editBriefButton').onclick=()=>toggleBriefEditor(true,getState());
  $('#cancelBriefEdit').onclick=()=>toggleBriefEditor(false,getState());
  $('#applyBriefEdit').onclick=()=>applyEditedBrief();
  $('#addPhraseButton').onclick=manualPhrase;
  $('#branchButton').onclick=branchActive;
  $('#compareButton').onclick=openCompare;
  $('#fitButton').onclick=()=>fitGraph(els.graphViewport,els.graphSurface);
  $('#pathwaySearch').addEventListener('input',e=>renderPathwayCards(e.target.value));
  $('#exportJsonButton').onclick=()=>{exportProject(getState());toast('Project exported.');};
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
  els.landing.classList.add('hidden'); els.app.classList.remove('hidden');
  showView('workspace');
  renderWorkspace();
  if(autoSelect && getState().hotspots.length) selectHotspot(getState().hotspots[0].id);
}

function showLanding(){ els.app.classList.add('hidden'); els.landing.classList.remove('hidden'); }

function showView(view){
  if(!getState().brief && view!=='workspace'){showLanding();return;}
  patchState({view},{silent:true});
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  els.workspace.classList.toggle('hidden',view!=='workspace');
  els.pathways.classList.toggle('hidden',view!=='pathways');
  els.trace.classList.toggle('hidden',view!=='trace');
  if(view==='workspace')renderWorkspace();
  if(view==='pathways')renderPathwayCards($('#pathwaySearch').value);
  if(view==='trace')renderTraceDashboard(getState());
}

function renderWorkspace(){
  const state=getState();
  renderBrief(state,{onHotspot:selectHotspot});
  const hasNodes=state.nodes.length>0;
  els.canvasEmpty.classList.toggle('hidden',hasNodes);
  els.graphViewport.classList.toggle('hidden',!hasNodes);
  const scopedBranches=currentBranches(state);
  $('#branchCount').textContent=`${scopedBranches.length || 1} ${(scopedBranches.length || 1)===1?'path':'paths'}`;
  $('#canvasTitle').textContent=state.selectedHotspotId ? `Tracing “${state.hotspots.find(h=>h.id===state.selectedHotspotId)?.text || 'language'}”` : 'Your trace';
  if(hasNodes)renderGraphState();
  const active=state.nodes.find(n=>n.id===state.activeNodeId);
  $('#branchButton').disabled=active?.type!=='interpretation' || active?.status==='rejected';
  $('#compareButton').disabled=scopedBranches.length<2;
  if(active) renderNodeInspector(active,state,nodeHandlers());
  else if(state.selectedHotspotId){ const h=state.hotspots.find(x=>x.id===state.selectedHotspotId); if(h)renderHotspotInspector(h,hotspotHandlers()); }
  else renderEmptyInspector();
}

function renderGraphState(){
  const state=getState();
  const scoped=scopedTrace(state);
  renderGraph({...state,nodes:scoped.nodes,edges:scoped.edges},{surface:els.graphSurface,svg:els.graphEdges,nodes:els.graphNodes},{
    onNodeClick:id=>selectNode(id),
    onNodeMove:(id,x,y)=>updateState(s=>{const n=s.nodes.find(n=>n.id===id);if(n){n.x=x;n.y=y;}})
  });
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
  setTimeout(()=>focusNode(els.graphViewport,document.querySelector(`[data-id="${latest?.id}"]`)),80);
}

function hotspotHandlers(inputNodeId=null){
  return {
    onInterpretation:(text,prompt)=>captureContext(text,prompt,inputNodeId || getState().activeNodeId),
    onRelatedPath:id=>inspectPathway(pathways.find(p=>p.id===id))
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
        updateState(s=>{ const input=s.nodes.find(n=>n.id===inputNodeId); addInterpretation(s,inputNodeId,text,input?.branchId||s.activeBranchId,meta); });
        logEvent('Interpretation added',text); closeModal(); renderWorkspace();
      }
    });
}

function selectNode(id){ patchState({activeNodeId:id},{silent:true}); renderWorkspace(); }

function nodeHandlers(){
  return {
    onNext:(node,text,extra)=>{
      updateState(s=>{
        if(node.type==='interpretation') addGrounding(s,node.id,text,extra.sourceKind||'Designer rationale',node.branchId);
        else if(node.type==='grounding') addConsequence(s,node.id,text,node.branchId,extra.tags||[]);
        else if(node.type==='consequence') addEvaluation(s,node.id,text,node.branchId,extra.tags||[]);
        else if(node.type==='evaluation') addGoal(s,node.id,text,node.branchId);
      });
      const labels={interpretation:'Grounding added',grounding:'Spatial consequence added',consequence:'Evaluation added',evaluation:'Goal added'};
      logEvent(labels[node.type]||'Reasoning added',text); renderWorkspace();
    },
    onBranch:id=>branchFrom(id),
    onEdit:node=>editNode(node),
    onReject:branchId=>{
      updateState(s=>rejectBranch(s,branchId)); logEvent('Path rejected','Retained in project history'); renderWorkspace(); toast('Path retained as rejected reasoning.');
    }
  };
}

function branchActive(){ const n=getState().nodes.find(x=>x.id===getState().activeNodeId); if(n?.type==='interpretation')branchFrom(n.id); }
function branchFrom(id){
  const origin=getState().nodes.find(n=>n.id===id); if(!origin)return;
  openModal(`<h2 id="modalTitle">Branch this interpretation.</h2><p>Keep the existing reading and create another possible meaning alongside it.</p><label class="field-label">Alternative interpretation</label><textarea class="field-textarea" id="branchText" placeholder="Describe another plausible reading of this language…"></textarea><div class="modal-actions"><button class="secondary-button" data-close-modal>Cancel</button><button class="primary-button compact" id="confirmBranch">Create branch →</button></div>`,{
    onOpen:m=>m.querySelector('#confirmBranch').onclick=()=>{ const val=m.querySelector('#branchText').value.trim(); if(!val)return; updateState(s=>createBranch(s,id,val)); logEvent('Alternative branch created',val); closeModal(); renderWorkspace(); }
  });
}

function editNode(node){
  openModal(`<h2 id="modalTitle">Edit ${escapeHtml(node.type)}.</h2><p>Changing a reasoning move does not erase the rest of the trace. It makes revision visible.</p><textarea class="field-textarea" id="editNodeText">${escapeHtml(node.label)}</textarea><div class="modal-actions"><button class="secondary-button" data-close-modal>Cancel</button><button class="primary-button compact" id="saveNodeEdit">Save change</button></div>`,{
    onOpen:m=>m.querySelector('#saveNodeEdit').onclick=()=>{ const val=m.querySelector('#editNodeText').value.trim(); if(!val)return; updateState(s=>{const n=s.nodes.find(x=>x.id===node.id);n.label=val;n.updatedAt=new Date().toISOString();}); logEvent('Reasoning revised',val); closeModal(); renderWorkspace(); }
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
  openModal(`<h2 id="modalTitle">Trace another phrase.</h2><p>Enter a phrase exactly as it appears in your brief. TRACEWORK will add it as a hotspot.</p><input class="field-input" id="manualPhraseInput" placeholder="e.g. peak periods"><div class="modal-actions"><button class="secondary-button" data-close-modal>Cancel</button><button class="primary-button compact" id="confirmPhrase">Add phrase</button></div>`,{
    onOpen:m=>m.querySelector('#confirmPhrase').onclick=()=>{ const phrase=m.querySelector('#manualPhraseInput').value.trim(); const start=brief.toLowerCase().indexOf(phrase.toLowerCase()); if(start<0){toast('That exact phrase is not in the brief.');return;} const h={id:`hotspot-manual-${Date.now()}`,text:brief.slice(start,start+phrase.length),concept:'custom',start,end:start+phrase.length,reason:'Selected by designer for interpretation'}; updateState(s=>{s.hotspots.push(h);s.hotspots.sort((a,b)=>a.start-b.start);}); closeModal(); renderWorkspace(); selectHotspot(h.id); }
  });
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
  updateState(s=>{
    const branchId=`branch-${Date.now().toString().slice(-5)}`; let source=input.id;
    p.steps.forEach(step=>{ const n=createNode({type:step.type,label:step.text,branchId,meta:{sourcePathway:p.id,sourceLabel:p.source,provisional:true}}); s.nodes.push(n); s.edges.push(createEdge(source,n.id,{status:'provisional'})); source=n.id; });
    s.activeNodeId=source;s.activeBranchId=branchId;
  });
  logEvent('Starter pathway added',p.concept); toast('Added as a provisional branch.'); showView('workspace');
}

function openCompare(){
  const state=getState(); const summaries=currentBranches(state); if(summaries.length<2){toast('Create a second branch first.');return;}
  const a=summaries[0].branchId,b=summaries[1].branchId,rows=compareBranches(state,a,b);
  openModal(`<h2 id="modalTitle">Compare pathways.</h2><p>TRACEWORK aligns consequences and trade-offs without selecting a winner.</p><div style="display:grid;grid-template-columns:90px 1fr 1fr;gap:8px;font-size:11px"><strong></strong><strong>Path A</strong><strong>Path B</strong>${rows.map(r=>`<span style="color:var(--muted);text-transform:capitalize">${escapeHtml(r.type)}</span><div>${r.a?escapeHtml(r.a.label):'<span style="color:var(--muted-2)">Not developed</span>'}</div><div>${r.b?escapeHtml(r.b.label):'<span style="color:var(--muted-2)">Not developed</span>'}</div>`).join('')}</div><div class="modal-actions"><button class="secondary-button" data-close-modal>Close</button></div>`);
}

function confirmNewProject(){ openModal(`<h2 id="modalTitle">Start a new trace?</h2><p>Your current project is saved in this browser and can be exported first. Starting over will clear the local project.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Keep working</button><button class="secondary-button" id="exportBeforeNew">Export first</button><button class="primary-button compact" id="confirmNew">Start new</button></div>`,{onOpen:m=>{m.querySelector('#exportBeforeNew').onclick=()=>exportProject(getState());m.querySelector('#confirmNew').onclick=()=>{clearProject();resetState();closeModal();els.briefLanding.value='';showLanding();};}}); }


function scopedTrace(state){
  const input=state.nodes.find(n=>n.type==='input'&&n.meta?.hotspotId===state.selectedHotspotId);
  if(!input)return {nodes:[],edges:[]};
  const ids=new Set([input.id]); const queue=[input.id];
  while(queue.length){
    const id=queue.shift();
    state.edges.filter(e=>e.source===id).forEach(e=>{ if(!ids.has(e.target)){ids.add(e.target);queue.push(e.target);} });
  }
  return {nodes:state.nodes.filter(n=>ids.has(n.id)),edges:state.edges.filter(e=>ids.has(e.source)&&ids.has(e.target))};
}
function currentBranches(state){
  const scoped=scopedTrace(state);
  return branchSummaries({...state,nodes:scoped.nodes.filter(n=>n.type!=='input')});
}

function projectNameFromBrief(brief){ const first=brief.split(/[.!?]/)[0].trim(); return first.length>54?`${first.slice(0,54)}…`:first; }
function escapeHtml(t=''){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

init();
