let ontologyCache = null;
export async function loadOntology(){
  if (ontologyCache) return ontologyCache;
  const res = await fetch('./data/ontology.json');
  ontologyCache = await res.json();
  return ontologyCache;
}
export async function getOntologyType(id){ return (await loadOntology()).find(x => x.id === id); }
export function nextType(type){
  const order = ['input','interpretation','grounding','consequence','evaluation','goal'];
  return order[order.indexOf(type)+1] || null;
}
export const typeLabels = {
  input:'Input', interpretation:'Interpretation', grounding:'Grounding', consequence:'Spatial consequence', evaluation:'Evaluation', goal:'Goal'
};
