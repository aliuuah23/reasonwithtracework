import { frameworks } from '../core/frameworks.js';
import { loadReferences } from '../evidence/references.js';

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId = id => document.getElementById(id);
const frameworkOrder = ['tracework','freeform', 'requirements', 'fivewhys', 'laddering','framing','reflective','semantics'];
const referencesByFramework = {
  tracework:['alexander1964','schon1983','dorst2011','krippendorff2006','lamsweerde2001'],
  freeform:[],
  requirements:['lamsweerde2001'],
  fivewhys:['serrat2017'],
  laddering:['reynolds1988'],
  framing:['dorst2011'],
  reflective:['schon1983'],
  semantics:['krippendorff2006']
};
const explanation = {
  tracework:{question:'How does language become traceable architectural reasoning?',
    example:'Brief: “Students need different degrees of privacy.” → Interpretation: “Privacy could be visual, acoustic or social.” → Grounding: “Users alternate between individual and group study.” → Spatial consequence: “Make retreat niches beside shared seating.” → Evaluation: “Check sightlines and route obstruction.” → Goal: “Support choice without isolation.”',
    action:'Begin with a source or thought; choose a node family, branch where meanings diverge, and keep links to the original wording.',
    limit:'The six families are TRACEWORK’s research-derived working grammar, not universal or compulsory steps.'},
  freeform:{question:'What if the designer needs to think without prescribed categories?',
    example:'Brief: “Students need different degrees of privacy.” → Capture several exploratory notes: “retreat?”, “open circulation”, “acoustic screen”, “sightline?” → Link or reclassify later.',
    action:'Use unstructured notes and links first. Switch frameworks later to reinterpret the same thoughts without losing the original content.',
    limit:'Freeform is a TRACEWORK interface mode, not a separate academic theory.'},
  requirements:{question:'Which need, goal or constraint does a statement imply?',
    example:'Stakeholder statement: “Add twenty seats without increasing the shelter.” → Goal: accommodate more users → Constraint: fixed sheltered footprint → Scenario: peak class changeover → Requirement: movable, compact seating → Validation: check circulation and seats.',
    action:'Distinguish stakeholder statements, goals, scenarios, constraints and testable design requirements.',
    limit:'TRACEWORK adapts goal-oriented requirements work to architectural conversations; its role labels are not the paper’s verbatim ontology.'},
  fivewhys:{question:'What lies underneath the first stated concern?',
    example:'“This study corner feels uncomfortable.” Why? Too exposed. Why? Everyone passes behind the seats. Why? The shortest circulation route crosses the quiet zone. Root concern: lack of spatial separation between movement and occupation.',
    action:'Start with a concern and follow several plausible “why” links; stop where another kind of evidence is needed.',
    limit:'A chain of “whys” offers hypotheses, not proof of causality; users must verify explanations.'},
  laddering:{question:'How does an architectural attribute connect to an experience and value?',
    example:'Attribute: a partly screened seat → Consequence: less visual exposure → Value: autonomy and comfort. A different screen position could yield the same value with better group visibility.',
    action:'Trace attribute → consequence → value and compare alternative attributes that support the same value.',
    limit:'The source model comes from means–end research; its architectural application here is an adaptation.'},
  framing:{question:'What changes if the design problem is framed differently?',
    example:'Situation: “Students need privacy.” Frame A: visual exposure → response: screens. Frame B: choice of social proximity → response: multiple seating clusters. Discuss how the chosen frame changes the design move.',
    action:'Record the situation, propose competing frames, state the value being pursued and compare design responses.',
    limit:'The interface roles are a reading of Dorst’s argument about framing, not his fixed classification system.'},
  reflective:{question:'What did a design move reveal, and what should change next?',
    example:'Move: place a solid wall beside the seating. Back-talk: the main route becomes constrained. Reflection: privacy does not require a complete barrier. Next move: offset porous screens and retest circulation.',
    action:'Keep the design move, what the drawing or scenario reveals, and the next reframing visible as a loop.',
    limit:'Reflection-in-action is richer than a fixed sequence of boxes; the trace is a record to discuss, not a substitute for situated judgement.'},
  semantics:{question:'Which different meanings can the same word carry in context?',
    example:'“Open” might describe visibility, public access, ventilation or flexible occupation. Each reading carries different consequences: transparent surfaces, unlocked routes, cross-ventilation or reconfigurable rooms.',
    action:'Explore possible meanings, relate them to use and atmosphere, then document the distinct architectural implications.',
    limit:'Krippendorff develops a broader semantic account of design; TRACEWORK’s categories are an interface lens rather than a literal reproduction.'}
};
const safeUrl = url => /^https:\/\//i.test(url || '') ? url : '#';
const primaryLabel = f => f.id === 'freeform' ? 'Working mode' : f.source || 'TRACEWORK';
const sourceLinks = (ids, refs) => ids.map(id=>refs.find(ref=>ref.id===id)).filter(Boolean).map(r=>`<li><a href="${escapeHTML(safeUrl(r.url))}" target="_blank" rel="noopener noreferrer">${escapeHTML(r.title)} ↗</a><small>${escapeHTML(r.author)} · ${escapeHTML(r.year)} · ${escapeHTML(r.access)}</small></li>`).join('');
const view = { id:null,slide:0, opener:null };
let allReferences = [];
let explorerInitialized = false;
const slides = ['Overview','Architectural example','Roles and method','Source readings'];

function paintDialog(){
 const f=frameworks.find(x=>x.id===view.id);if(!f)return;
 const h=explanation[f.id]; const index=view.slide;
 let body='';
 if(index===0) body=`<h3>${escapeHTML(h.question)}</h3><p>${escapeHTML(f.description)}</p><p><strong>Use it when:</strong> ${escapeHTML(h.action)}</p><p class="framework-explorer-note">${escapeHTML(h.limit)}</p>`;
 if(index===1) body=`<h3>One pavilion brief, read differently</h3><p class="framework-explorer-example">${escapeHTML(h.example)}</p><p class="framework-explorer-note">Illustrative teaching example, not an empirical participant quotation or a prescribed design.</p>`;
 if(index===2) body=`<h3>Visible roles in this lens</h3>${f.categories.length?`<div class="framework-explorer-roles">${f.categories.map(c=>`<article><strong>${escapeHTML(c.label)}</strong><p>${escapeHTML(c.description)}</p></article>`).join('')}</div>`:'<p>Freeform leaves categories optional; notes and connections still belong to the same underlying project trace.</p>'}<p class="framework-explorer-note">Changing frameworks changes how reasoning is read and arranged; it should not replace the recorded underlying thoughts.</p>`;
 if(index===3){const sources=sourceLinks(referencesByFramework[f.id]||[],allReferences);body=`<h3>${f.id==='freeform'?'Working-mode reference':'Reading behind the framework'}</h3>${sources?`<ul class="framework-explorer-sources">${sources}</ul>`:'<p>Freeform is a TRACEWORK working mode rather than a published academic framework. It does not have a single source text.</p>'}<p class="framework-explorer-note">Links go to publisher, DOI or book-record pages. Some texts require institutional or library access. The interface applies these works; it does not claim they define TRACEWORK’s exact categories.</p>`;}
 byId('frameworkExplorerBody').innerHTML=body;
 byId('frameworkExplorerTitle').textContent=f.label;
 byId('frameworkExplorerSource').textContent=primaryLabel(f);
 byId('frameworkExplorerSlideTitle').textContent=slides[index];
 byId('frameworkExplorerCounter').textContent=`${index+1} / ${slides.length}`;
 byId('frameworkExplorerPrevious').disabled=index===0;
 byId('frameworkExplorerNext').disabled=index===slides.length-1;
 byId('frameworkExplorerDots').innerHTML=slides.map((s,i)=>`<button type="button" data-slide-index="${i}" aria-label="Go to ${escapeHTML(s)}" title="${escapeHTML(s)}" class="${i===index?'is-active':''}" ${i===index?'aria-current="step"':''}></button>`).join('');
}
function openFramework(id,opener){if(!frameworks.some(f=>f.id===id))return;view.id=id;view.slide=0;view.opener=opener||document.activeElement;byId('frameworkExplorerBackdrop').hidden=false;document.body.classList.add('framework-explorer-open');paintDialog();byId('frameworkExplorerClose').focus();}
function closeFramework(){byId('frameworkExplorerBackdrop').hidden=true;document.body.classList.remove('framework-explorer-open');view.id=null;view.opener?.focus?.();view.opener=null;}
function navigate(delta){view.slide=Math.max(0,Math.min(slides.length-1,view.slide+delta));paintDialog();}
function renderReferences(){
 const list=byId('referenceList');
 list.innerHTML=allReferences.map(r=>`<article class="reference-entry"><div class="reference-entry-head"><strong>${escapeHTML(r.author)}</strong><span>${escapeHTML(r.year)} · ${escapeHTML(r.kind)}</span></div><h3>${escapeHTML(r.title)}</h3><p class="reference-theme">${escapeHTML(r.theme)}</p><p>${escapeHTML(r.relevance)}</p><div class="reference-entry-footer"><a href="${escapeHTML(safeUrl(r.url))}" target="_blank" rel="noopener noreferrer">${escapeHTML(r.linkLabel)} ↗</a><small>${escapeHTML(r.access)}</small></div></article>`).join('');
}
export async function initializeFrameworkExplorer(){
 const grid=byId('frameworkReferenceGrid');if(!grid || explorerInitialized)return;
 explorerInitialized=true;
 allReferences=await loadReferences().catch(()=>[]);
 const items=frameworkOrder.map(id=>frameworks.find(f=>f.id===id)).filter(Boolean);
 grid.innerHTML=items.map(f=>`<button type="button" class="framework-reference-card framework-reference-button" data-framework-id="${escapeHTML(f.id)}" aria-label="Explore ${escapeHTML(f.label)} framework"><div class="framework-reference-head"><strong>${escapeHTML(f.label)}</strong><span>${escapeHTML(primaryLabel(f))}</span></div><p>${escapeHTML(f.description)}</p><div class="framework-reference-roles">${(f.categories||[]).map(c=>`<span class="framework-role-chip" title="${escapeHTML(c.description)}">${escapeHTML(c.label)}</span>`).join('')}</div><span class="framework-card-action">Explore framework <span aria-hidden="true">↗</span></span></button>`).join('');
 grid.addEventListener('click',e=>{const btn=e.target.closest('[data-framework-id]');if(btn)openFramework(btn.dataset.frameworkId,btn);});
 renderReferences();
 byId('frameworkExplorerClose').addEventListener('click',closeFramework);
 byId('frameworkExplorerPrevious').addEventListener('click',()=>navigate(-1));
 byId('frameworkExplorerNext').addEventListener('click',()=>navigate(1));
 byId('frameworkExplorerDots').addEventListener('click',e=>{const btn=e.target.closest('[data-slide-index]');if(btn){view.slide=Number(btn.dataset.slideIndex);paintDialog();}});
 byId('frameworkExplorerBackdrop').addEventListener('click',e=>{if(e.target===e.currentTarget)closeFramework();});
 document.addEventListener('keydown',e=>{
  if(!view.id)return;
  if(e.key==='Escape'){e.preventDefault();closeFramework();return;}
  if(e.key==='ArrowRight'){e.preventDefault();navigate(1);}
  if(e.key==='ArrowLeft'){e.preventDefault();navigate(-1);}
  if(e.key==='Tab'){
   const dialog=byId('frameworkExplorerDialog');const items=[...dialog.querySelectorAll('button:not([disabled]),a[href]')].filter(el=>el.getClientRects().length);if(!items.length)return;
   const start=items[0],end=items[items.length-1];if(e.shiftKey&&document.activeElement===start){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();start.focus();}
  }
 });
}
