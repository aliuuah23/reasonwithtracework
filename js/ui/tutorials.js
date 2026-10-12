import { openModal, closeModal } from './modals.js';
import { getFramework, frameworkTutorialSteps } from '../core/frameworks.js';

const TUTORIAL_KEY = 'tracework:tutorial-seen:v3';
const FRAMEWORK_KEY = id => `tracework:framework-tutorial:${id}:v2`;
let activeSpotlightCleanup=null;

const tutorials = {
  welcome: {
    eyebrow:'FIRST-TIME TOUR', title:'Welcome to TRACEWORK',
    steps:[
      {selector:'.brief-mode-toggle',title:'Choose how the source enters',body:'Quick brief is for compact prompts. Long brief / document is for larger briefs that can be filed into editable chunks.'},
      {selector:'#landingBrief',title:'Start from real language',body:'Paste the wording you actually received or are working with. TRACEWORK begins from language rather than assuming the design problem is already resolved.'},
      {selector:'#startTracingButton',title:'Enter the reasoning workspace',body:'Start tracing creates the project locally in this browser. Nothing is published by opening a trace.'},
      {selector:'#projectShelf',title:'Return to saved traces',body:'Projects saved in this browser remain available here. Opening one restores its reasoning without making it the active project forever.'}
    ]
  },
  landing: {
    eyebrow:'STARTING A TRACE', title:'Starting a project',
    steps:[
      {selector:'.brief-mode-toggle',title:'Quick or long brief',body:'Use Quick brief for a short statement. Long brief / document supports uploads, detected sections and manually added chunks.'},
      {selector:'#landingProjectName',title:'Name the trace',body:'A name makes saved projects easier to recognise. It can stay blank if the brief itself is enough.'},
      {selector:'#briefChunkPreview',title:'File long briefs before tracing',body:'Detected sections can be opened, edited or supplemented with + Chunk before entering the Workspace.'},
      {selector:'#startTracingButton',title:'Start when the source is ready',body:'TRACEWORK keeps the source attached to the project so later reasoning can remain traceable back to where it began.'}
    ]
  },
  workspace: {
    eyebrow:'WORKSPACE TOUR', title:'Reading and building a trace',
    steps:[
      {selector:'.source-panel',title:'Source panel',body:'Move between brief sections, select hotspots, or drag across source words to create new hotspots. The brief is read-only until you choose Edit Brief.'},
      {selector:'#hotspotList',title:'Change or remove a hotspot',body:'Use ✎ beside a hotspot to replace its selected source wording. Type an exact passage or drag-select words in the edit window; Save updates the original hotspot without disconnecting its reasoning. Use × to delete a hotspot.'},
      {selector:'#undoButton',title:'Undo meaningful edits',body:'Ctrl+Z or Undo reverses edits such as hotspot changes, additions, deletions and node moves. When typing inside a text field, Ctrl+Z instead uses normal text undo. Navigation and ordinary clicks are not undoable edits.'},
      {selector:'#frameworkSelect',title:'Choose a reasoning lens',body:'TRACEWORK Grammar is the default. Literature frameworks change the legend, prompts and classifications without rewriting the underlying thought.'},
      {selector:'#frameworkLockButton',title:'Lock the project lens',body:'Lock the chosen framework when a project should stay in one reading mode. The lock persists with the project and can be reopened at any time.'},
      {selector:'#graphViewport',title:'Work directly on the reasoning field',body:'Drag nodes, multi-select with Shift, connect from either port or choose “Connect to…” on a node, then select a clearly labelled destination and direction, double-click to edit, and right-click for lock, grouping or disconnection controls. Every node can open the Spatial Reading Studio: a full-size term-sensitive plan and section, distinct feature examples, verified project references and readings. If no precise term matches, the studio explains what to ground rather than inventing a drawing.'},
      {selector:'#thoughtDock',title:'Write freely when a prompt is not useful',body:'The command line suggests a role inside the active framework, but the suggestion is editable. Match strengths are independent wording fits, not probabilities. Hover a role to see its definition and the cues that triggered it.'},
      {selector:'#inspectorPanel',title:'Use the inspector as a probing partner',body:'Select a node to ask what led to it or what could follow from it. The questions change with the active framework. Overall suggestions describe system-level moves; Detail suggestions suggest a spatial test. Both are prompts, not automated solutions.'},
      {selector:'.map-mode-toggle',title:'Move between focus and overview',body:'Focus Map isolates one hotspot. Aggregate Map brings the project’s reasoning fields together. The Original/Arrange toggle changes the layout; manual node movement stays synchronised with Focus Map.'}
    ]
  },
  pathways: {
    eyebrow:'PATHWAY BANK TOUR',title:'Use precedent without prescription',
    steps:[
      {selector:'#pathwaySearch',title:'Search by the problem at hand',body:'Search a concept, condition or spatial concern rather than looking for a single “correct” precedent.'},
      {selector:'#pathwayGrid',title:'Compare how language travels',body:'Related pathways are prompts for comparison. They show other reasoning structures without prescribing what this project should do.'}
    ]
  },
  trace: {
    eyebrow:'MY TRACE TOUR',title:'Read the project’s reasoning memory',
    steps:[
      {selector:'#traceDashboard',title:'Keep the project history visible',body:'Active, provisional, alternative and rejected reasoning can remain visible rather than being flattened into only the final decision.'},
      {selector:'#exportJsonButton',title:'Export when needed',body:'Export Project creates a portable project record. Reset local data is destructive, so use it only when deliberately clearing browser-stored traces.'}
    ]
  },
  discussion: {
    eyebrow:'DISCUSSION TOUR',title:'Make the reasoning discussable',
    steps:[
      {selector:'#discussionList',title:'Read project discussion',body:'Comments can stay with the project instead of disappearing into separate critique notes.'},
      {selector:'#discussionScope',title:'Anchor critique',body:'Attach discussion to the whole project or a selected reasoning move when the critique concerns something specific.'},
      {selector:'#discussionText',title:'Write the critique or rationale',body:'Discussion is local in this prototype. The longer-term model is invited studios and collaborators rather than one public feed.'}
    ]
  },
  about: {
    eyebrow:'ABOUT TOUR',title:'What TRACEWORK is — and is not',
    steps:[
      {selector:'.about-hero',title:'The problem TRACEWORK addresses',body:'TRACEWORK makes the interpretive interval between language and spatial decisions inspectable.'},
      {selector:'.about-frameworks',title:'Read the framework reference',body:'The base grammar and six literature lenses are explained here in more depth than the Workspace needs.'},
      {selector:'.about-research',title:'See the research foundations',body:'The interface is operational, but the categories and prompts are grounded in the research trajectory rather than presented as arbitrary UI labels.'}
    ]
  }
};

function hasSeenTutorial(){ try { return localStorage.getItem(TUTORIAL_KEY) === '1'; } catch { return false; } }
function markSeen(){ try { localStorage.setItem(TUTORIAL_KEY,'1'); } catch {} }
function hasSeenFramework(id){ try { return localStorage.getItem(FRAMEWORK_KEY(id))==='1'; } catch { return false; } }
function markFrameworkSeen(id){ try { localStorage.setItem(FRAMEWORK_KEY(id),'1'); } catch {} }

function removeSpotlight(){
  if(activeSpotlightCleanup){const fn=activeSpotlightCleanup;activeSpotlightCleanup=null;fn();}
}

function openSpotlightTour({eyebrow='TUTORIAL',title='TRACEWORK guide',steps=[],onFinish=null,skipLabel='Close'}={}){
  removeSpotlight();
  const usable=steps.filter(Boolean);
  if(!usable.length)return;
  let index=0;
  const root=document.createElement('div');
  root.className='tutorial-spotlight-root';
  root.innerHTML=`
    <div class="tutorial-mask tutorial-mask-top"></div><div class="tutorial-mask tutorial-mask-left"></div><div class="tutorial-mask tutorial-mask-right"></div><div class="tutorial-mask tutorial-mask-bottom"></div>
    <div class="tutorial-spotlight-ring" aria-hidden="true"></div>
    <section class="tutorial-popover" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <span class="tutorial-popover-caret" aria-hidden="true"></span>
      <div class="tutorial-popover-top"><span class="tutorial-eyebrow">${escapeHtml(eyebrow)}</span><span class="tutorial-step-count"></span><button type="button" class="tutorial-close tutorial-popover-close" aria-label="Close tutorial">×</button></div>
      <div class="tutorial-popover-progress"></div>
      <span class="tutorial-step-number"></span><h3></h3><p></p>
      <div class="tutorial-popover-actions"><button type="button" class="text-button tutorial-popover-skip">${escapeHtml(skipLabel)}</button><div><button type="button" class="secondary-button tutorial-popover-back">Back</button><button type="button" class="primary-button compact tutorial-popover-next">Next →</button></div></div>
    </section>`;
  document.body.appendChild(root);
  document.documentElement.classList.add('tutorial-tour-active');
  const masks=[...root.querySelectorAll('.tutorial-mask')],ring=root.querySelector('.tutorial-spotlight-ring'),popover=root.querySelector('.tutorial-popover');
  const back=root.querySelector('.tutorial-popover-back'),next=root.querySelector('.tutorial-popover-next'),skip=root.querySelector('.tutorial-popover-skip');
  const finish=()=>{removeSpotlight();onFinish?.();};
  const getTarget=step=>{
    if(!step?.selector)return null;
    const el=document.querySelector(step.selector);
    if(!el || el.classList.contains('hidden') || el.getClientRects().length===0)return null;
    return el;
  };
  const place=()=>{
    const step=usable[index],target=getTarget(step);
    const vw=window.innerWidth,vh=window.innerHeight,pad=8;
    let rect=target?.getBoundingClientRect?.()||{left:vw*.5-80,right:vw*.5+80,top:vh*.5-40,bottom:vh*.5+40,width:160,height:80};
    const offscreen=rect.bottom<0||rect.top>vh||rect.right<0||rect.left>vw;
    if(target && offscreen){target.scrollIntoView({block:'center',inline:'center',behavior:'smooth'});setTimeout(place,180);return;}
    rect=target?.getBoundingClientRect?.()||rect;
    const left=Math.max(pad,rect.left-pad),right=Math.min(vw-pad,rect.right+pad),top=Math.max(pad,rect.top-pad),bottom=Math.min(vh-pad,rect.bottom+pad);
    const width=Math.max(30,right-left),height=Math.max(30,bottom-top);
    Object.assign(masks[0].style,{left:'0px',top:'0px',width:'100vw',height:`${Math.max(0,top)}px`});
    Object.assign(masks[1].style,{left:'0px',top:`${top}px`,width:`${Math.max(0,left)}px`,height:`${height}px`});
    Object.assign(masks[2].style,{left:`${right}px`,top:`${top}px`,width:`${Math.max(0,vw-right)}px`,height:`${height}px`});
    Object.assign(masks[3].style,{left:'0px',top:`${bottom}px`,width:'100vw',height:`${Math.max(0,vh-bottom)}px`});
    Object.assign(ring.style,{left:`${left}px`,top:`${top}px`,width:`${width}px`,height:`${height}px`});
    const pw=Math.min(340,vw-24),ph=popover.offsetHeight||240,gap=14;
    let px=right+gap,py=Math.max(12,Math.min(top,vh-ph-12)),side='right';
    if(px+pw>vw-12){px=left-pw-gap;side='left';}
    if(px<12){
      px=Math.max(12,Math.min(left,vw-pw-12));py=bottom+gap;side='below';
      if(py+ph>vh-12){py=Math.max(12,top-ph-gap);side='above';}
    }
    popover.dataset.side=side;
    popover.style.left=`${px}px`;popover.style.top=`${py}px`;popover.style.width=`${pw}px`;
  };
  const render=()=>{
    const step=usable[index];
    root.querySelector('.tutorial-step-number').textContent=`STEP ${String(index+1).padStart(2,'0')}`;
    const count=root.querySelector('.tutorial-step-count');if(count)count.textContent=`${index+1} / ${usable.length}`;
    root.querySelector('.tutorial-popover h3').textContent=step.title||title;
    root.querySelector('.tutorial-popover p').textContent=step.body||'';
    root.querySelector('.tutorial-popover-progress').innerHTML=usable.map((_,i)=>`<span class="tutorial-progress-dot ${i===index?'active':''} ${i<index?'done':''}"></span>`).join('');
    back.disabled=index===0;next.textContent=index===usable.length-1?'Done':'Next →';
    requestAnimationFrame(place);
  };
  back.onclick=()=>{if(index>0){index--;render();}};
  next.onclick=()=>{if(index<usable.length-1){index++;render();}else finish();};
  skip.onclick=finish;root.querySelector('.tutorial-popover-close').onclick=finish;
  const onResize=()=>place(),onKey=e=>{if(e.key==='Escape')finish();};
  window.addEventListener('resize',onResize);window.addEventListener('scroll',onResize,true);document.addEventListener('keydown',onKey);
  activeSpotlightCleanup=()=>{window.removeEventListener('resize',onResize);window.removeEventListener('scroll',onResize,true);document.removeEventListener('keydown',onKey);root.remove();document.documentElement.classList.remove('tutorial-tour-active');};
  render();
}

function fallbackModal(tutorial,{firstVisit=false}={}){
  let index=0;
  openModal(`<div class="tutorial-shell"><div class="tutorial-topline"><span class="tutorial-eyebrow">${tutorial.eyebrow}</span><button class="tutorial-close" type="button" aria-label="Close tutorial" data-close-modal>×</button></div><h2 id="modalTitle">${tutorial.title}</h2><div class="tutorial-progress" id="tutorialProgress"></div><div class="tutorial-step" id="tutorialStep"></div><div class="tutorial-actions"><button class="text-button" id="tutorialSkip" type="button">${firstVisit?'Skip for now':'Close'}</button><div class="tutorial-nav-actions"><button class="secondary-button" id="tutorialBack" type="button">Back</button><button class="primary-button compact" id="tutorialNext" type="button">Next →</button></div></div></div>`,{onOpen:modal=>{
    const stepEl=modal.querySelector('#tutorialStep'),progressEl=modal.querySelector('#tutorialProgress'),back=modal.querySelector('#tutorialBack'),next=modal.querySelector('#tutorialNext'),skip=modal.querySelector('#tutorialSkip');
    const finish=()=>{if(firstVisit)markSeen();closeModal();};
    const render=()=>{const step=tutorial.steps[index];stepEl.innerHTML=`<span class="tutorial-step-number">${String(index+1).padStart(2,'0')}</span><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.body)}</p>`;progressEl.innerHTML=tutorial.steps.map((_,i)=>`<span class="tutorial-progress-dot ${i===index?'active':''} ${i<index?'done':''}"></span>`).join('');back.disabled=index===0;next.textContent=index===tutorial.steps.length-1?'Done':'Next →';};
    back.onclick=()=>{if(index>0){index--;render();}};next.onclick=()=>{if(index<tutorial.steps.length-1){index++;render();}else finish();};skip.onclick=finish;render();
  }});
}

export function openTutorial(name='welcome',{firstVisit=false}={}){
  const tutorial=tutorials[name]||tutorials.welcome;
  const anchored=tutorial.steps.some(step=>step.selector&&document.querySelector(step.selector));
  if(!anchored){fallbackModal(tutorial,{firstVisit});return;}
  openSpotlightTour({eyebrow:tutorial.eyebrow,title:tutorial.title,steps:tutorial.steps,skipLabel:firstVisit?'Skip for now':'Close',onFinish:()=>{if(firstVisit)markSeen();}});
}

export function openFrameworkTutorial(frameworkId,{firstEncounter=false}={}){
  const data=frameworkTutorialSteps(frameworkId),framework=getFramework(frameworkId);
  if(!framework)return;
  const roleSummary=data.roles.map(r=>`• ${r.label}: ${r.description}`).join('\n');
  const steps=[
    {selector:'#frameworkSelect',title:`${data.title} · ${data.source||''}`,body:`${data.note}\n\n${data.description}`},
    {selector:'#frameworkLockButton',title:'Keep this lens fixed when needed',body:'Use the lock beside the framework selector to prevent accidental framework changes in this project. Unlock it whenever you want to compare another lens.'},
    {selector:'#ontologyLegend',title:'Read this framework’s roles',body:roleSummary||'The legend changes with the active framework.'},
    {selector:'#thoughtDock',title:'Classify without pretending certainty',body:`The command line now reads text through ${framework.shortLabel}. Match strengths can overlap; they are independent cues, not probabilities. Hover each suggested role for its definition and reasons, informed by P01–P10 pilot-coded examples where relevant. Match strengths are not probabilities, and you can always change the role.`},
    {selector:'#inspectorPanel',title:'Probe the selected node',body:'The inspector reads the node you selected. Use “What led here?” to expose prior reasoning or “What follows?” to develop consequences, values, moves or revisions through this framework.'},
    {selector:'#aggregateMapModeButton',title:'Use the framework without losing the original map',body:'Switching frameworks does not rearrange the Aggregate Map. In Aggregate Map, switch directly between Original map and Arrange map. Original combines reasoning traces without sorting them into roles. Arrange interprets the same network through the chosen framework. Source edits carry into Arrange, but Arrange-only edits do not alter Original or Focus.'}
  ];
  openSpotlightTour({eyebrow:`FRAMEWORK GUIDE · ${data.source||''}`,title:data.title,steps,skipLabel:firstEncounter?'Skip guide':'Close',onFinish:()=>markFrameworkSeen(frameworkId)});
}

export function maybeOpenFrameworkTutorial(frameworkId){
  if(!frameworkId || frameworkId==='tracework' || hasSeenFramework(frameworkId))return;
  window.setTimeout(()=>openFrameworkTutorial(frameworkId,{firstEncounter:true}),180);
}

export function bindTutorialTriggers(root=document){
  if(root.documentElement?.dataset.traceworkTutorialBound==='1')return;
  if(root.documentElement)root.documentElement.dataset.traceworkTutorialBound='1';
  root.addEventListener('click',e=>{
    const frameworkButton=e.target.closest?.('[data-framework-tutorial]');
    if(frameworkButton){e.preventDefault();openFrameworkTutorial(frameworkButton.dataset.frameworkTutorial||'tracework');return;}
    const button=e.target.closest?.('[data-tutorial]');if(!button)return;
    e.preventDefault();openTutorial(button.dataset.tutorial||'welcome');
  });
}

export function maybeOpenFirstVisitTutorial(section='welcome'){
  if(hasSeenTutorial())return;
  window.setTimeout(()=>openTutorial(section,{firstVisit:true}),320);
}

function escapeHtml(t=''){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
