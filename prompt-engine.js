import { getPromptConfig } from './hotspot-detector.js';
export async function interpretationPrompt(hotspot){
  const cfg=await getPromptConfig(hotspot.text,hotspot.concept);
  return { question:cfg.interpretation.question.replace('{term}',hotspot.text), choices:cfg.interpretation.choices, who:cfg.who, when:cfg.when };
}
export function groundingPrompt(){
  return { question:'What makes this interpretation relevant here?', sources:['User need','Site condition','Brief / requirement','Precedent','Observation','Literature','Assumption'] };
}
export function consequencePrompt(){
  return { question:'If you follow this reading, what changes spatially?', hints:['Organisation','Enclosure','Movement','Adjacency','Scale','Visibility','Furniture / elements','Programme'] };
}
export function evaluationPrompt(){
  return { question:'What does this move prioritise — and what might it compromise?', hints:['Access','Privacy','Interaction','Comfort','Efficiency','Adaptability','Legibility','Operational simplicity'] };
}
export function goalPrompt(){ return { question:'What design aim does this pathway ultimately serve?' }; }
