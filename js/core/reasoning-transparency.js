// D1: interpretable reasoning metadata, not an inference of what a designer actually thought.
// PROV-O is an informative conceptual model; TRACEWORK exports are not asserted to be PROV-O RDF.
export const evidenceKinds = [
  {id:'unspecified',label:'Not Specified',description:'No supporting entity has yet been identified.'},
  {id:'brief',label:'Source Document',description:'A retrievable document, specification, or supplied requirement.'},
  {id:'observation',label:'Recorded Observation',description:'A record of the site, environment, use, or behaviour.'},
  {id:'drawing',label:'Drawing or Model',description:'A drawing, diagram, model, or recorded design test.'},
  {id:'precedent',label:'Published Reference',description:'An external documented reference or architectural case.'},
  {id:'performance',label:'Measurement or Simulation',description:'A recorded measured or simulated result, with method where available.'},
  {id:'designer',label:'Design Note',description:'A recorded design intention or assumption; not independently verified.'},
  {id:'inference',label:'Analytical Note',description:'An inference or interpretation marked as such.'},
  {id:'suggestion',label:'Software-Generated Note',description:'A tool suggestion; not independent evidence of adoption.'},
  {id:'other',label:'Other Supporting Record',description:'A distinct, identifiable entity not covered above.'}
];
export const generationActivities=[
  {id:'unspecified',label:'Not Specified'},
  {id:'authored',label:'Authored / Recorded'},
  {id:'interpreted',label:'Interpreted / Analysed'},
  {id:'observed',label:'Observed / Documented'},
  {id:'revised',label:'Revised / Edited'},
  {id:'generated',label:'Software Generated'},
  {id:'imported',label:'Imported from Source'}
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
export function evidenceLabel(id='unspecified'){if(id==='participant'||id==='transcript')return 'Not Specified (Legacy: Review Supporting Record)';return evidenceKinds.find(x=>x.id===id)?.label||'Not Specified';}
export function inferredEvidenceKind(node){
  const explicit=node?.meta?.evidenceKind; if(explicit)return ['participant','transcript'].includes(explicit)?'unspecified':explicit;
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
    attributedTo:['brief','brief_requirement','brief_description','observation','precedent'].includes(origin)?null:origin,
    derivedFrom:source||((node?.type==='input')?'Source brief (see project)':null),
    generatedBy:node?.meta?.generationActivity||'unspecified',
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
  const a=source.meta||{},b=target.meta||{};
  const from=a.provenance||((source.type==='input'&&a.source==='brief')?'brief':'designer');
  const to=b.provenance||((target.type==='input'&&b.source==='brief')?'brief':'designer');
  const evidenceA=['participant','transcript'].includes(a.evidenceKind)?'unspecified':(a.evidenceKind||'unspecified');
  const evidenceB=['participant','transcript'].includes(b.evidenceKind)?'unspecified':(b.evidenceKind||'unspecified');
  const humanAgents=new Set(['designer','collaborator','tutor','organisation','other','participant','researcher']);
  const sourceEntities=new Set(['brief','brief_requirement','brief_description','observation','precedent']);
  const findings=[];
  const warn=(reason,next)=>findings.push({reason,next});
  const nodes=[[source,from,evidenceA,'starting'],[target,to,evidenceB,'destination']];
  for(const [node,origin,evidence,label] of nodes){
    if(origin==='system'&&evidence!== 'unspecified'&&evidence!=='suggestion'&&!node.meta?.sourceReference){
      warn(`The ${label} thought is attributed to software, but a supporting record has not been identified. A generated suggestion is not itself independent evidence.`,
        'Record an identifiable supporting Entity, or leave the evidence unspecified.');
    }
    if(sourceEntities.has(origin)&&['designer','inference','suggestion'].includes(evidence)){
      warn(`The ${label} thought is treated as source material, while the supporting record is labelled as an authored or inferred note.`,
        'Separate the source Entity from the new reasoning Entity, then link them if derived.');
    }
  }
  if(from==='system'&&humanAgents.has(to)&&!b.sourceReference&&(!b.generationActivity||b.generationActivity==='unspecified'||b.generationActivity==='generated')){
    warn('A software-generated thought leads into one attributed to a person or organisation without a separate source or recorded adoption activity. The link alone does not establish who authored the new thought.',
      'Record how the responsible Agent adopted, modified, or independently authored the idea, and cite a source if one exists.');
  }
  if(sourceEntities.has(from)&&to==='system'&&b.generationActivity==='authored'){
    warn('This thought is attributed to software but marked as manually authored.',
      'Check the Agent and generation Activity; keep any human revision as a separate, attributable event.');
  }
  // Text-sensitive cue detection is advisory only: it never reattributes a node.
  const destination=String(target.label||'').toLowerCase();
  if(to==='system'&&/\b(i (decided|propose|intend|believe)|we (decided|propose|intend))\b/.test(destination)){
    warn('The destination text uses first-person authorship language, but its Agent is marked as a software tool.',
      'Clarify whether this is a quoted statement, a tool output, or a human-authored decision.');
  }
  if(!findings.length)return {flagged:false,level:'none',reason:'No specific attribution inconsistency detected.',next:'Different sources may legitimately contribute to the same reasoning.'};
  return {flagged:true,level:'review',reason:findings.map(x=>x.reason).join(' '),next:[...new Set(findings.map(x=>x.next))].join(' ')};
}
