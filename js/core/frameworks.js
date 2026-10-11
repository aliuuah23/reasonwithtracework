export const frameworks = [
  {
    id: 'tracework',
    label: 'TRACEWORK Grammar',
    shortLabel: 'TRACEWORK',
    description: 'Uses the six TRACEWORK reasoning families as a visible scaffold. The categories organise the trace but do not prescribe a design answer.',
    arrangement: 'ontology',
    connectionMode: 'guided'
  },
  {
    id: 'freeform',
    label: 'Freeform / Low-Structure',
    shortLabel: 'Freeform',
    description: 'Keeps the same reasoning content but suppresses the visible ontology. TRACEWORK may still infer structure underneath, while the designer remains free to connect and arrange thoughts directly.',
    arrangement: 'network',
    connectionMode: 'open'
  }
];

export const provenanceOptions = [
  { id:'brief', label:'Brief / source document' },
  { id:'tutor', label:'Tutor comment' },
  { id:'designer', label:'Designer thought' },
  { id:'observation', label:'Observation / site condition' },
  { id:'precedent', label:'Precedent / case study' },
  { id:'other', label:'Other source' }
];

export function getFramework(id='tracework'){
  return frameworks.find(f=>f.id===id) || frameworks[0];
}

export function provenanceLabel(id='designer'){
  return provenanceOptions.find(p=>p.id===id)?.label || 'Designer thought';
}

export function inferLegacyProvenance(node){
  if(!node) return 'designer';
  if(node.meta?.provenance) return node.meta.provenance;
  if(node.type==='input' && node.meta?.source==='brief') return 'brief';
  if(node.meta?.sourcePathway || node.meta?.sourceStatus) return 'precedent';
  if(node.meta?.freeform) return 'designer';
  return 'designer';
}
