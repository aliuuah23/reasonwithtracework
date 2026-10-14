// D1: interpretable reasoning metadata, not an inference of what a designer actually thought.
// PROV-O is an informative conceptual model; TRACEWORK exports are not asserted to be PROV-O RDF.
export const evidenceKinds = [
  {id:'unspecified',label:'Not specified',description:'The evidential basis has not yet been recorded.'},
  {id:'brief',label:'Brief / quoted requirement',description:'Direct wording or a condition in a provided brief.'},
  {id:'observation',label:'Observed condition',description:'Recorded behaviour, site or environmental observation.'},
  {id:'participant',label:'Participant statement',description:'What a participant explicitly said or recorded.'},
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
export function evidenceLabel(id='unspecified'){return evidenceKinds.find(x=>x.id===id)?.label||'Not specified';}
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
