let ontologyCache = null;
export async function loadOntology(){
  if (ontologyCache) return ontologyCache;
  try {
    const res=await fetch('./data/ontology.json');
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data=await res.json();
    if(!Array.isArray(data)) throw new Error('Invalid ontology data');
    ontologyCache=data;
  } catch(error) {
    console.warn('Node reference data unavailable; basic node roles remain usable.',error);
    ontologyCache=[];
  }
  return ontologyCache;
}
export async function getOntologyType(id){ return (await loadOntology()).find(x => x.id === id); }
export function nextType(type){
  const order = ['input','interpretation','grounding','consequence','evaluation','goal'];
  return order[order.indexOf(type)+1] || null;
}
export const typeLabels = {
  input:'Input', interpretation:'Interpretation', grounding:'Grounding', consequence:'Spatial consequence', evaluation:'Evaluation', goal:'Goal', note:'Note'
};
