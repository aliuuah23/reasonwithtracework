// Stage C release audit. This checks recorded evidence/links; it never invents
// a complete design story or demands TRACEWORK's grammar from other frameworks.
export function auditProject(project={}){
  const nodes=Array.isArray(project.nodes)?project.nodes:[];
  const edges=Array.isArray(project.edges)?project.edges:[];
  const hotspots=Array.isArray(project.hotspots)?project.hotspots:[];
  const chunks=Array.isArray(project.briefChunks)?project.briefChunks:[];
  const byId=new Map(nodes.map(n=>[n.id,n]));
  const warnings=[];
  const problems=[];
  const nodeIds=nodes.map(n=>n.id);
  if(new Set(nodeIds).size!==nodeIds.length)problems.push('Duplicate node IDs could cause missing or incorrect links.');
  if(new Set(edges.map(e=>e.id)).size!==edges.length)problems.push('Duplicate connection IDs were found.');
  const broken=edges.filter(e=>!byId.has(e.source)||!byId.has(e.target));
  if(broken.length)problems.push(`${broken.length} connection${broken.length===1?'':'s'} refer to missing nodes.`);
  const unlabelled=nodes.filter(n=>!String(n.label||'').trim());
  if(unlabelled.length)problems.push(`${unlabelled.length} reasoning node${unlabelled.length===1?' has':'s have'} no wording.`);
  const brief=String(project.brief||'');
  const misplaced=hotspots.filter(h=>Number.isFinite(h.start)&&Number.isFinite(h.end) &&
    (h.start<0||h.end>brief.length||h.start>=h.end));
  if(misplaced.length)warnings.push(`${misplaced.length} hotspot range${misplaced.length===1?' may':'s may'} need rechecking against the brief.`);
  const missingHotspot=nodes.filter(n=>n.type==='input'&&n.meta?.hotspotId&&!hotspots.some(h=>h.id===n.meta.hotspotId));
  if(missingHotspot.length)warnings.push(`${missingHotspot.length} source node${missingHotspot.length===1?' is':'s are'} no longer linked to a hotspot.`);
  const incompleteEdges=edges.filter(e=>!e.source||!e.target);
  if(incompleteEdges.length)problems.push('At least one connection has no source or target.');
  const unknownChunk=hotspots.filter(h=>h.chunkId&&chunks.length&&!chunks.some(c=>c.id===h.chunkId));
  if(unknownChunk.length)warnings.push(`${unknownChunk.length} hotspot${unknownChunk.length===1?' has':'s have'} a missing source section.`);
  const present=new Set(nodes.map(n=>n.type));
  const stages=[['input','Source or Hotspot'],['interpretation','Interpretation'],['grounding','Grounding'],['consequence','Spatial consequence'],['evaluation','Evaluation and Trade-off'],['goal','Design goal']]
    .map(([type,label])=>({type,label,recorded:present.has(type)}));
  const routes=new Map();
  nodes.filter(n=>n.type!=='input').forEach(n=>{
    const id=n.branchId||'main';
    const row=routes.get(id)||{id,count:0,rejected:0,goal:0,consequence:0};
    row.count++;
    if(n.status==='rejected')row.rejected++;
    if(n.type==='goal')row.goal++;
    if(n.type==='consequence')row.consequence++;
    routes.set(id,row);
  });
  const reachable=new Set(nodes.filter(n=>n.type==='input').map(n=>n.id));
  for(let i=0;i<nodes.length;i++){
    let changed=false;
    for(const e of edges)if(reachable.has(e.source)&&!reachable.has(e.target)){
      reachable.add(e.target);changed=true;
    }
    if(!changed)break;
  }
  const connected=nodes.filter(n=>n.type!=='input'&&reachable.has(n.id));
  const loose=nodes.filter(n=>n.type!=='input'&&!reachable.has(n.id));
  const explicitNotes=loose.filter(n=>n.type==='note').length;
  if(loose.length>explicitNotes)warnings.push(`${loose.length-explicitNotes} reasoning node${loose.length-explicitNotes===1?' is':'s are'} not connected back to a brief Input. This may be intentional in Freeform.`);
  const anyTrace=nodes.some(n=>n.type!=='input');
  const sourceCount=nodes.filter(n=>n.type==='input').length;
  if(!sourceCount && anyTrace)warnings.push('There is reasoning, but no connected source node yet.');
  if(!nodes.some(n=>n.type==='consequence'))warnings.push('No spatial proposition/consequence has been recorded yet.');
  if(!nodes.some(n=>n.type==='evaluation'))warnings.push('No evaluation or explicit trade-off has been recorded yet.');
  if(!nodes.some(n=>n.type==='goal'))warnings.push('No design goal has been recorded yet.');
  if(routes.size<2)warnings.push('No alternative pathway is visible yet. A second branch can make comparisons explicit.');
  return {
    problems,warnings,stages,routes:[...routes.values()],
    stats:{sources:sourceCount,hotspots:hotspots.length,nodes:nodes.length,edges:edges.length,
      branches:routes.size,connected:connected.length,loose:loose.length,sourceSections:chunks.length,
      sourceProjects:(project.sourceProjects||[]).length},
    technicallyConsistent:problems.length===0,
    traceHasSpatialEvidence:connected.some(n=>n.type==='consequence'),
    traceHasEvaluatedGoal:connected.some(n=>n.type==='goal') && connected.some(n=>n.type==='evaluation')
  };
}
