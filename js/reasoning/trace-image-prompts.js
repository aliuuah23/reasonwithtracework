// D2.12 · trace-to-image prompts. The document is the data source, not example-project answers.
import {getFramework, frameworkRoleForNode} from '../core/frameworks.js';
const clip=(s,n=420)=>String(s||'').trim().replace(/\s+/g,' ').slice(0,n);
const prompts={
 tracework:'Explain the translation from linguistic input to interpretation, grounding, spatial consequence, evaluation and goal. Show the chosen consequences with their trade-offs.',
 requirements:'Use explicit requirements, evidence, conflicts and acceptance criteria to shape the architecture. Do not convert a requirement to a supposed accepted solution.',
 fivewhys:'Express root causes and conditional causal dependencies spatially. Different root causes should yield different architectural organisations.',
 laddering:'Express attributes, consequences and values; prioritise the values that the actual source statements support.',
 framing:'Construct alternatives that test genuinely different problem frames, including what each frame foregrounds or excludes.',
 reflective:'Translate documented action, observed effect and reflection into architectural revision and iteration.',
 semantics:'Consider meanings, user interpretations, affordances and social communication when choosing architectural gestures.',
 freeform:'Retain ambiguity and open-ended thought; do not force nodes into a predetermined ontology or building archetype.'
};
export function traceImagePrompt(state,spec){
 const fw=getFramework(state.frameworkId||'tracework');
 const mode=spec.mode==='aggregate'?'whole-map synthesis':'individual documented pathway';
 const ids=new Set(spec.sourceIds||[]);
 // Full Aggregate evidence is included even where multiple paths combine; unsupported sources stay excluded.
 const nodes=(state.nodes||[]).filter(n=>!n.meta?.artifactKind&&(spec.mode==='aggregate'?n.status!=='rejected':ids.has(n.id)));
 const include=new Set(nodes.map(n=>n.id));
 const edges=(state.edges||[]).filter(e=>!e.meta?.artifact&&include.has(e.source)&&include.has(e.target));
 const ordered=[...nodes].sort((a,b)=>(a.createdAt||'').localeCompare(b.createdAt||''));
 const nodeEntries=ordered.slice(0,85).map(n=>{
  const frameworkRole=frameworkRoleForNode(n,fw.id)?.label||n.type;
  return `[${n.id}] (${frameworkRole}; source=${n.meta?.provenance||'not specified'}; status=${n.status||'active'}): ${clip(n.label)}`;
 });
 const edgeEntries=edges.slice(0,110).map(e=>`${e.source} -> ${e.target} [${e.status||'active'}]`);
 const rejected=(state.nodes||[]).filter(n=>n.status==='rejected'&&!n.meta?.artifactKind).slice(0,18);
 const project=clip(state.projectName,150),brief=clip(state.brief,3500);
 const parts=[
 'Create ONE unique, architecturally rigorous conceptual design illustration from the following designer-authored reasoning record.',
 'Do not reproduce stock typologies or an existing example design. The exact composition MUST originate from the provided statements and relationships, not from a built-in library of form families.',
 `PROJECT: ${project||'Untitled'}\nBRIEF: ${brief||'No brief supplied'}`,
 `MODE: ${mode}; FRAMEWORK: ${fw.label}.\nMETHOD: ${prompts[fw.id]||prompts.tracework}`,
 `PROPOSED READING: ${clip(spec.layout,500)}. This is one interpretive hypothesis, NOT a historically recorded decision.`,
 'SOURCE NODES (quoted faithfully; do not invent statements):\n'+(nodeEntries.join('\n')||'No documented nodes available'),
 'DOCUMENTED CONNECTIONS:\n'+(edgeEntries.join('\n')||'No connections explicitly documented'),
 'REJECTED IDEAS TO AVOID TREATING AS ACCEPTED:\n'+(rejected.map(n=>clip(n.label)).join(' | ')||'None documented'),
 'Translate site use, circulation, enclosure, material systems, environmental interfaces, spatial hierarchy and programmatic relationships ONLY when supported, otherwise label them speculative.',
 'Generate a legible architectural PRESENTATION PLATE: a detailed axonometric/three-dimensional architectural proposition PLUS coordinated annotated plan, section and elevation and two small relationship diagrams. Drawings should depict one coherent concept and share compatible geometry; show human scale. Prefer inventive, precise spatial relationships over stereotypical organic curves or rectangular box roofs.',
 'Let the form emerge from tensions and combinations among nodes; incorporate rejected/provisional evidence only as alternatives, never final requirements. Different frameworks should expose genuinely different design priorities.',
 'Concise typography. No overlapping panels. Use neutral architectural drafting, sharp lines, restrained color, adequate white space. Concept study, not verified dimensions, certification or claims of construction feasibility.'
 ];
 return parts.join('\n\n').slice(0,13500);
}
export function generatedImagePlate(spec,base64){
 // A full SVG sheet for existing print, saving and image-node insertion flows.
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const img=/^data:image\/(png|jpeg|webp);base64,/.test(base64)?base64:'data:image/png;base64,'+base64;
 return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1180" height="790" viewBox="0 0 1180 790" role="img" aria-label="${esc(spec.title)}"><rect width="1180" height="790" fill="#f6f7f5"/><image x="14" y="14" width="1152" height="722" href="${img}" preserveAspectRatio="xMidYMid meet"/><rect x="14" y="741" width="1152" height="36" fill="#e8f0ed"/><text x="30" y="762" font-family="Arial" font-size="13" fill="#285160">${esc(spec.title.slice(0,100))} · AI-generated interpretation · not participant-authored or independently verified</text></svg>`;
}
