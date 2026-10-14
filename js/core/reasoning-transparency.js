// D1: interpretable reasoning metadata, not an inference of what a designer actually thought.
// PROV-O is an informative conceptual model; TRACEWORK exports are not asserted to be PROV-O RDF.
export const evidenceKinds = [
  {id:'unspecified',label:'Not specified',description:'The evidential basis has not yet been recorded.'},
  {id:'brief',label:'Brief / quoted requirement',description:'Direct wording or a condition in a provided brief.'},
  {id:'observation',label:'Observed condition',description:'Recorded behaviour, site or environmental observation.'},
  {id:'transcript',label:'Transcript / Recorded Interview',description:'A traceable transcript or recording supporting a claim; attribution to the participant is recorded separately under Origin / Provenance.'},
  {id:'drawing',label:'Drawing / model evidence',description:'Documented sketch, model, spatial test or artefact.'},
  {id:'precedent',label:'Published precedent',description:'Documented architectural example or scholarly source.'},
  {id:'performance',label:'Performance / measured outcome',description:'A measured test, simulation or observed outcome; record its method and limits.'},
  {id:'designer',label:'Designer reasoning / intention',description:'The designer’s stated interpretation, proposal, preference or hypothesis.'},
  {id:'inference',label:'Researcher inference',description:'An analytical reading that has not been explicitly stated by the original designer.'},
  {id:'suggestion',label:'System suggestion',description:'A TRACEWORK prompt; not evidence that the designer accepted or implemented it.'}
];
export const roleClarifications={
  input:{example:'“Provide a place for individual and group study.”',boundary:'An Input records supplied or observed language, not an inferred design intention.'},
  interpretation:{example:'“Individual study suggests some acoustic separation.”',boundary:'Meaning attributed to a source; do not mistake a reading for an observed fact.'},
  grounding:{example:'“The nearby walkway receives continuous pedestrian traffic.”',boundary:'Context, comparison, assumption or support; indicate what is observed versus assumed.'},
  consequence:{example:'“Offset the two entrances to create a transition zone.”',boundary:'A spatial proposition or its effect; separate a proposed move from a measured result.'},
  evaluation:{example:'“The screen provides privacy but reduces passive supervision.”',boundary:'A judgement or trade-off; ideally name the criterion and what is being compared.'},
  goal:{example:'“The project aims to support both retreat and social exchange.”',boundary:'An aim or value is not itself a physical intervention.'},
  note:{example:'“What if the pavilion changes with occupancy?”',boundary:'A deliberately unclassified thought; no framework role is asserted.'}
};
export function evidenceLabel(id='unspecified'){if(id==='participant')return 'Not Specified (Legacy: Review Evidence Basis)';return evidenceKinds.find(x=>x.id===id)?.label||'Not Specified';}
export function inferredEvidenceKind(node){
  const explicit=node?.meta?.evidenceKind; if(explicit)return explicit;
  if(node?.type==='input' || ['brief','brief_requirement','brief_description'].includes(node?.meta?.provenance))return 'brief';
  if(node?.meta?.provenance==='observation')return 'observation';
  if(node?.meta?.provenance==='precedent')return 'precedent';
  // Legacy nodes are not silently called evidence of designer intention.
  return 'unspecified';
}
export function bridgePrompt(source,target){
  if(!source||!target)return 'Choose a source thought and a distinct destination thought. What does the arrow claim?';
  if(source.type==='goal'&&target.type==='input')return 'A design aim cannot retroactively become the given brief. Is this a new requirement or a designer-proposed input?';
  if(target.type==='input')return 'If this new information was discovered during design, record it as a new sourced observation and explain when it entered.';
  if(source.type==='evaluation'&&target.type==='interpretation')return 'What finding in the evaluation changes the way you read the original source? State that reconsideration explicitly.';
  if(source.type==='goal'&&target.type==='grounding')return 'What evidence or context supports the aim, and how was that basis established?';
  if(source.type==='consequence'&&target.type==='interpretation')return 'What spatial effect or observation prompted you to reinterpret the original wording?';
  return `What makes the move from ${source.type} to ${target.type} warranted? Add a bridging thought or evidence only if it actually occurred.`;
}
export function provenanceModel(node,origin){
  const source=node?.meta?.sourceReference||'';
  return {
    entity:node?.label||'',
    attributedTo:origin,
    derivedFrom:source||((node?.type==='input')?'Source brief (see project)':null),
    generatedBy:node?.meta?.generatedBy||'Trace entry or edit (activity details not captured)',
    caveat:'Conceptual correspondence to prov:Entity, prov:wasAttributedTo, prov:wasDerivedFrom and prov:wasGeneratedBy. Not a complete or validated PROV-O export.'
  };
}


/**
 * D1.1: Provenance consistency is independent of framework/ontology validity.
 * A cross-origin reasoning relationship can be perfectly legitimate. Warnings
 * identify *possible attribution or evidence errors*, without inventing evidence
 * or preventing a designer from recording an intentional relationship.
 * Historical nodes with no explicit evidence metadata are never flagged solely
 * for lacking optional metadata.
 */
export function provenanceConnectionCheck(source,target){
  if(!source||!target)return {flagged:false};
  const a=source.meta||{}, b=target.meta||{};
  const from=a.provenance||((source.type==='input'&&a.source==='brief')?'brief':'designer');
  const to=b.provenance||((target.type==='input'&&b.source==='brief')?'brief':'designer');
  const ea=a.evidenceKind==='participant'?'unspecified':(a.evidenceKind||null), eb=b.evidenceKind==='participant'?'unspecified':(b.evidenceKind||null);
  const explicitBrief=p=>['brief','brief_requirement','brief_description'].includes(p);
  const empirical=new Set(['participant','observation','performance','brief','drawing']);
  const warnings=[];
  const add=(reason,next)=>warnings.push({reason,next});
  // Within-node contradictions must not be mistaken for verified source claims.
  for(const [origin,evidence,name] of [[from,ea,'starting'],[to,eb,'destination']]){
    if(origin==='system'&&evidence&&empirical.has(evidence))
      add(`The ${name} thought is identified as a system suggestion but its evidence is labelled ${evidence}. A TRACEWORK prompt is not itself an observed or participant-produced fact.`,
          'Separate the suggested idea from the independent evidence that supports it; cite that evidence on its own node.');
    if(origin==='participant'&&evidence==='inference')
      add(`The ${name} thought is attributed to a participant but labelled a researcher inference.`,
          'Distinguish the participant’s exact statement from the researcher’s interpretation in two attributed nodes.');
    if(explicitBrief(origin)&&['inference','suggestion'].includes(evidence||''))
      add(`The ${name} thought is attributed to the given brief but labelled as an inference or suggestion.`,
          'Keep quoted brief requirements separate from later interpretations and suggestions.');
  }
  // Source-to-target attribution review, not a ban on different origins.
  if(from==='system'&&(to==='participant'||to==='researcher')&&(!b.sourceReference||eb==='suggestion'))
    add('A system-generated suggestion leads into a thought attributed to a participant or researcher, without a recorded independent source. This may misrepresent who actually proposed the idea.',
        'Confirm who stated the destination thought. If adopted independently, record that action and its source; otherwise retain its system origin.');
  if(from==='researcher'&&to==='participant'&&!b.sourceReference)
    add('Researcher coding is connected to an unattributed participant claim. The arrow alone does not establish that the participant said or reasoned this.',
        'Add a participant transcript/event citation or label the destination as a researcher reconstruction.');
  if(!warnings.length)return {flagged:false,level:'none',reason:'No specific provenance inconsistency detected. Different origins may still be linked.',next:'Document the source of any consequential claim where possible.'};
  return {flagged:true,level:'review',reason:warnings.map(w=>w.reason).join(' '),next:[...new Set(warnings.map(w=>w.next))].join(' ')};
}
