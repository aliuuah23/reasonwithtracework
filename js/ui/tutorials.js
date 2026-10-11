import { openModal, closeModal } from './modals.js';
import { getFramework, frameworkTutorialSteps } from '../core/frameworks.js';

const TUTORIAL_KEY = 'tracework:tutorial-seen:v2';
const FRAMEWORK_KEY = id => `tracework:framework-tutorial:${id}:v1`;

const tutorials = {
  welcome: {
    eyebrow: 'FIRST-TIME TOUR',
    title: 'Welcome to TRACEWORK',
    steps: [
      { title:'Start from real language', body:'Use Quick brief for a short statement, or Long brief / document for larger briefs. Long briefs can be split into editable chunks so each section can be read without losing the whole project.' },
      { title:'Find what needs interpretation', body:'TRACEWORK suggests interpretive hotspots, but those suggestions are optional. Hide them, keep them, or select exact words and phrases from the brief yourself.' },
      { title:'Choose a reasoning lens', body:'TRACEWORK Grammar is the default, but the same reasoning can also be inspected through Requirements Elicitation, Five Whys, Laddering, Design Framing, Reflective Practice or Design Semantics. Switching frameworks changes the lens, not the underlying thought.' },
      { title:'Externalise the reasoning', body:'Use the right-hand guiding questions when a prompt helps, or use the command line to write freely. The prompt, legend, suggested roles and tutorial change with the active framework.' },
      { title:'Work as a network', body:'Drag nodes, connect either port, edit roles, mark thoughts Active or Provisional, group or lock nodes, undo changes, and isolate a pathway whenever the field becomes dense.' },
      { title:'Move between focus and overview', body:'Focus Map isolates one hotspot. Aggregate Map brings the project’s focus maps together so overlaps, cross-links and shared spatial consequences can become visible. Arrange Map can organise that field through the active framework.' }
    ]
  },
  landing: {
    eyebrow: 'STARTING A TRACE',
    title: 'Starting a project',
    steps: [
      { title:'Choose the source format', body:'Quick brief is best for a compact statement. Long brief / document supports uploads, detected sections and manually added chunks.' },
      { title:'Name and organise it', body:'Give the trace a project name if useful. In Long brief mode, inspect, edit or add chunks before entering the workspace.' },
      { title:'Nothing here is public', body:'This prototype saves projects in this browser. Opening a saved trace restores it; leaving the workspace closes the active session without deleting the project.' }
    ]
  },
  workspace: {
    eyebrow: 'WORKSPACE TOUR',
    title: 'Reading and building a trace',
    steps: [
      { title:'Source panel', body:'Move between brief chunks, inspect suggested hotspots, or select exact text manually. The source stays traceable even as the reasoning network grows.' },
      { title:'Frameworks are lenses', body:'The framework menu changes the legend, command-line roles, guidance questions and Arrange Map. It does not overwrite the designer’s thought. Open the framework-specific guide from this tutorial button whenever a lens is unfamiliar.' },
      { title:'Two ways to continue', body:'Click a hotspot or node for framework-aware guided questions in the inspector, or write freely in the command line. Guided moves are scaffolded; free moves remain editable and connectable.' },
      { title:'Edit the network directly', body:'Drag from either node port to connect. Double-click a reasoning node to edit it. Shift-click selects multiple nodes; Ctrl/Cmd+G groups them; right-click exposes lock, disconnect and delete controls.' },
      { title:'Focus versus Aggregate', body:'Focus Map keeps one hotspot readable. Aggregate Map merges the project’s reasoning fields while preserving the individual Focus Map layouts. Arrange Map can be blended back toward the pre-arranged layout.' },
      { title:'Checks are prompts, not answers', body:'Trace Check flags open reasoning. Wire signals can be hidden. Framework percentages are relative textual matches, not certainty, and every role can be changed manually.' }
    ]
  },
  pathways: {
    eyebrow: 'PATHWAY BANK TOUR', title: 'Use precedent without prescription',
    steps:[
      { title:'Search by the problem at hand', body:'Pathway Bank responds to the active project and surfaces related reasoning or precedents rather than a universal answer list.' },
      { title:'Compare how language travels', body:'Use related pathways to see alternative interpretations, grounding and spatial consequences. They are prompts for comparison, not instructions to copy.' },
      { title:'Return to authorship', body:'Bring anything useful back into the Workspace by developing or challenging it in the project’s own reasoning network.' }
    ]
  },
  trace: {
    eyebrow:'MY TRACE TOUR', title:'Read the project’s reasoning memory',
    steps:[
      { title:'Nothing has to disappear', body:'Active, provisional, alternative and rejected reasoning can remain visible as project history instead of being flattened into only the final decision.' },
      { title:'Review before presentation', body:'Use My Trace to inspect what the project currently contains and where reasoning is still unresolved.' },
      { title:'Export when needed', body:'Export Project creates a portable project record. Reset local data is destructive, so use it only when deliberately clearing browser-stored traces.' }
    ]
  },
  discussion: {
    eyebrow:'DISCUSSION TOUR', title:'Make the reasoning discussable',
    steps:[
      { title:'Comment on the project', body:'Add a note to the whole project when the critique concerns the overall direction.' },
      { title:'Anchor critique when possible', body:'Attach discussion to a selected reasoning move when the comment concerns a specific interpretation, consequence or decision.' },
      { title:'Prototype privacy', body:'Discussion is local in this version. The longer-term model is private projects, invited collaborators, studios and classrooms rather than one public feed.' }
    ]
  },
  about: {
    eyebrow:'ABOUT TOUR', title:'What TRACEWORK is — and is not',
    steps:[
      { title:'The problem', body:'Design language is often treated as though its meaning is shared. TRACEWORK makes the interpretive interval between words and spatial decisions inspectable.' },
      { title:'The base model', body:'TRACEWORK Grammar uses Input, Interpretation, Grounding, Spatial Consequence, Evaluation and Goal as an operational structure. It is a default scaffold, not a claim that all design reasoning follows one sequence.' },
      { title:'The literature lenses', body:'Six additional frameworks are used as reference lenses: Requirements Elicitation, Five Whys, Laddering, Design Framing, Reflective Practice and Design Semantics. Their role labels are source-anchored operational translations for the interface.' },
      { title:'The stance', body:'TRACEWORK supports designer reasoning; it does not prescribe a correct interpretation or generate a final design on the designer’s behalf.' }
    ]
  }
};

function hasSeenTutorial(){ try { return localStorage.getItem(TUTORIAL_KEY) === '1'; } catch { return false; } }
function markSeen(){ try { localStorage.setItem(TUTORIAL_KEY,'1'); } catch {} }
function hasSeenFramework(id){ try { return localStorage.getItem(FRAMEWORK_KEY(id))==='1'; } catch { return false; } }
function markFrameworkSeen(id){ try { localStorage.setItem(FRAMEWORK_KEY(id),'1'); } catch {} }

export function openTutorial(name='welcome',{firstVisit=false}={}){
  const tutorial = tutorials[name] || tutorials.welcome;
  let index = 0;
  openModal(`
    <div class="tutorial-shell">
      <div class="tutorial-topline"><span class="tutorial-eyebrow">${tutorial.eyebrow}</span><button class="tutorial-close" type="button" aria-label="Close tutorial" data-close-modal>×</button></div>
      <h2 id="modalTitle">${tutorial.title}</h2>
      <div class="tutorial-progress" id="tutorialProgress" aria-label="Tutorial progress"></div>
      <div class="tutorial-step" id="tutorialStep"></div>
      <div class="tutorial-actions"><button class="text-button" id="tutorialSkip" type="button">${firstVisit?'Skip for now':'Close'}</button><div class="tutorial-nav-actions"><button class="secondary-button" id="tutorialBack" type="button">Back</button><button class="primary-button compact" id="tutorialNext" type="button">Next →</button></div></div>
      <p class="tutorial-revisit-note">Tutorials can be reopened from the top of each TRACEWORK tab.</p>
    </div>
  `,{onOpen: modal => {
    const stepEl = modal.querySelector('#tutorialStep'); const progressEl = modal.querySelector('#tutorialProgress');
    const back = modal.querySelector('#tutorialBack'); const next = modal.querySelector('#tutorialNext'); const skip = modal.querySelector('#tutorialSkip');
    const finish = () => { if(firstVisit) markSeen(); closeModal(); };
    const render = () => { const step=tutorial.steps[index]; stepEl.innerHTML=`<span class="tutorial-step-number">${String(index+1).padStart(2,'0')}</span><h3>${step.title}</h3><p>${step.body}</p>`; progressEl.innerHTML=tutorial.steps.map((_,i)=>`<span class="tutorial-progress-dot ${i===index?'active':''} ${i<index?'done':''}"></span>`).join(''); back.disabled=index===0; next.textContent=index===tutorial.steps.length-1?'Done':'Next →'; };
    back.onclick=()=>{if(index>0){index--;render();}}; next.onclick=()=>{if(index<tutorial.steps.length-1){index++;render();}else finish();}; skip.onclick=finish; render();
  }});
}

export function openFrameworkTutorial(frameworkId,{firstEncounter=false}={}){
  const data=frameworkTutorialSteps(frameworkId);
  const framework=getFramework(frameworkId);
  if(!framework)return;
  let index=0;
  const steps=[
    {title:`What ${data.title} is doing`,body:`${data.note} ${data.description}`},
    ...data.roles.map(r=>({title:r.label,body:r.description})),
    {title:'Use it without surrendering authorship',body:'The framework role is a reading of the thought, not the thought itself. Change a role, switch lenses, or return to TRACEWORK Grammar whenever another structure is more useful.'}
  ];
  openModal(`<div class="tutorial-shell framework-tutorial-shell"><div class="tutorial-topline"><span class="tutorial-eyebrow">FRAMEWORK GUIDE · ${escapeHtml(data.source||'')}</span><button class="tutorial-close" type="button" aria-label="Close tutorial" data-close-modal>×</button></div><h2 id="modalTitle">${escapeHtml(data.title)}</h2><div class="tutorial-progress" id="tutorialProgress"></div><div class="tutorial-step" id="tutorialStep"></div><div class="tutorial-actions"><button class="text-button" id="tutorialSkip" type="button">${firstEncounter?'Continue without tour':'Close'}</button><div class="tutorial-nav-actions"><button class="secondary-button" id="tutorialBack" type="button">Back</button><button class="primary-button compact" id="tutorialNext" type="button">Next →</button></div></div><p class="tutorial-revisit-note">This guide can be reopened from the Workspace tutorial button while ${escapeHtml(framework.label)} is active.</p></div>`,{onOpen:modal=>{
    const stepEl=modal.querySelector('#tutorialStep'),progressEl=modal.querySelector('#tutorialProgress'),back=modal.querySelector('#tutorialBack'),next=modal.querySelector('#tutorialNext'),skip=modal.querySelector('#tutorialSkip');
    const finish=()=>{markFrameworkSeen(frameworkId);closeModal();};
    const render=()=>{const step=steps[index];stepEl.innerHTML=`<span class="tutorial-step-number">${String(index+1).padStart(2,'0')}</span><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.body)}</p>`;progressEl.innerHTML=steps.map((_,i)=>`<span class="tutorial-progress-dot ${i===index?'active':''} ${i<index?'done':''}"></span>`).join('');back.disabled=index===0;next.textContent=index===steps.length-1?'Done':'Next →';};
    back.onclick=()=>{if(index>0){index--;render();}};next.onclick=()=>{if(index<steps.length-1){index++;render();}else finish();};skip.onclick=finish;render();
  }});
}

export function maybeOpenFrameworkTutorial(frameworkId){
  if(!frameworkId || frameworkId==='tracework' || hasSeenFramework(frameworkId))return;
  window.setTimeout(()=>openFrameworkTutorial(frameworkId,{firstEncounter:true}),180);
}

export function bindTutorialTriggers(root=document){
  if(root.documentElement?.dataset.traceworkTutorialBound==='1') return;
  if(root.documentElement) root.documentElement.dataset.traceworkTutorialBound='1';
  root.addEventListener('click',e=>{
    const frameworkButton=e.target.closest?.('[data-framework-tutorial]');
    if(frameworkButton){e.preventDefault();openFrameworkTutorial(frameworkButton.dataset.frameworkTutorial||'tracework');return;}
    const button=e.target.closest?.('[data-tutorial]');
    if(!button)return;
    e.preventDefault(); openTutorial(button.dataset.tutorial||'welcome');
  });
}

export function maybeOpenFirstVisitTutorial(section='welcome'){
  if(hasSeenTutorial()) return;
  markSeen(); window.setTimeout(()=>openTutorial(section,{firstVisit:true}),260);
}

function escapeHtml(t=''){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
