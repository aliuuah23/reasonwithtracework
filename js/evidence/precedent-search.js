export function precedentPrompt(term){
  return {
    title:`Look for precedents that make “${term}” operational`,
    questions:['What spatial mechanism is doing the work?','What condition makes it relevant?','What trade-off appears with it?']
  };
}
