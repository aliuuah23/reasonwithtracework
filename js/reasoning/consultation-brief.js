// D3.1 · Consultation preparation. Suggested actions are NOT recorded decisions.
// All record-derived statements remain attributed to the trace; missing evidence is flagged.
const clip=(s,n=185)=>String(s||'').trim().replace(/\s+/g,' ').slice(0,n);
export function consultationMarkdown(state,recordedDigest,scope){
  const nodes=(scope?.nodes||[]).filter(n=>!n.meta?.artifactKind),edges=scope?.edges||[];
  const sources=new Map(nodes.map(n=>[n.id,n]));
  const choices=nodes.filter(n=>n.type==='consequence'),evaluations=nodes.filter(n=>n.type==='evaluation');
  const pending=nodes.filter(n=>n.type==='note' || n.meta?.provisional || n.status==='provisional');
  const accepted=choices.filter(n=>n.status!=='rejected'&&n.status!=='alternative'&&!n.meta?.provisional);
  const count=choices.length;
  const tasks=[];
  const add=(label,source)=>{if(!tasks.some(t=>t.label===label))tasks.push({label,source});};
  for(const n of choices.slice(0,5)){
    add(`Draw a diagram or small plan testing: ${clip(n.label,125)}`,`Recorded spatial proposition [${n.id}]`);
  }
  if(!choices.length)add('Sketch at least two spatial consequences from the interpreted brief; keep them explicitly provisional.','Suggested task: no recorded spatial consequence yet');
  if(count>=2)add('Place two options side by side using the same orientation, scale and legend.','Suggested comparison, not a selected solution');
  if(evaluations.length)add('Annotate which drawing features support or conflict with each recorded evaluation.','Linked to recorded evaluation statements');
  else add('Define comparison criteria before deciding which alternative is preferable.','Suggested task: no explicit evaluation recorded');
  const text=`${state?.brief||''} ${nodes.map(n=>n.label||'').join(' ')}`.toLowerCase();
  if(/circulat|route|entry|movement|walk|access/.test(text))add('Draw circulation and accessibility paths; mark possible conflicts.','Suggested drawing derived from movement language');
  if(/seat|group|individ|occupan|capacity|people|student/.test(text))add('Draw occupancy and furniture/programme scenarios to test different uses.','Suggested drawing derived from use or capacity language');
  if(/light|shade|sun|shelter|climate|rain|ventila|enclos/.test(text))add('Cut a section showing shelter, environmental interfaces and human scale.','Suggested drawing derived from environmental or enclosure language');
  if(/privacy|visible|sight|quiet|noise|separat/.test(text))add('Draw sightline or acoustic/privacy gradients in plan and section.','Suggested drawing derived from environmental or privacy language');
  if(pending.length)add(`Identify what evidence would clarify ${pending.length} provisional/unclassified thought(s); do not silently fill gaps.`, 'Suggested consultation question');
  if(!edges.length)add('Ask which relationships among the recorded statements should be connected or left unresolved.','Suggested reasoning review');
  const decisions=accepted.slice(0,10).map(n=>`- [ ] Review recorded spatial proposal [${n.id}]: ${clip(n.label)} — **not independently validated**.`);
  const unresolved=pending.slice(0,6).map(n=>`- [ ] Clarify [${n.id}]: ${clip(n.label)} — **open / provisional**.`);
  return `${recordedDigest.trim()}\n\n## Proposed decisions to confirm at consultation (NOT automatic decisions)\n${decisions.join('\n')||'- [ ] No recorded spatial proposal yet; identify one or more candidate decisions.'}\n\n## Suggested drawings and preparation\n${tasks.slice(0,12).map(t=>`- [ ] ${t.label} *(${t.source})*`).join('\n')}\n\n## Open questions for the tutor / reviewer\n${unresolved.join('\n')||'- [ ] What should be tested before committing to the proposed spatial directions?'}\n\n**Attribution note:** Checklist tasks are system suggestions based on visible trace language, not participant-authored statements or evidence of an agreed decision. Review before sharing.\n`;
}
export function consultationActions(spec){
  const annotation=(spec?.annotations||[]).map(a=>clip(a.form,155)).filter(Boolean);
  const checks=(spec?.briefChecks||[]).map(c=>clip(c.label||c,130)).filter(Boolean);
  const tasks=[
    `Draw one plan and one section for the ${clip(spec?.concept||spec?.layout||'selected')} direction, at a consistent scale.`,
    'Mark dimensions, entry, circulation, human scale and material/enclosure assumptions where relevant.',
    'Compare the selected study with at least one alternative or rejected proposal, without describing rejected decisions as accepted.',
    ...checks.slice(0,4).map(t=>`Test the brief condition: ${t}`),
    ...annotation.slice(0,3).map(t=>`Illustrate or test the proposed spatial relationship: ${t}`),
  ];
  return `\n## Consultation preparation — SUGGESTED, not recorded decisions\n${tasks.map(t=>`- [ ] ${t}`).join('\n')}\n\n## Decisions to seek\n- [ ] Which speculative assumptions may be developed and which need evidence?\n- [ ] Which option(s) should remain alternatives rather than being fixed?\n- [ ] What additional drawing, precedent or test would most reduce the unresolved reasoning gap?\n\nThese prompts are system-generated consultation preparation, not a statement that the participant or designer originally decided to perform them.\n`;
}
