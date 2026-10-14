// D1.2: grounded, conditional descriptions of particular authored connections.
// The explanation is a reading of user-entered text, never a claim of causation.
const topics=[
 ['privacy',/\bprivac|\bprivate|\bseparat|\benclos|\bscreen|\bquiet/i],
 ['seating',/\bseat|\bbench|\bperch|\bsit|\boccupan/i],
 ['circulation',/\bcirculat|\broute|\bpath|\bwalk|\baccess|\bmovement|\bpedestrian/i],
 ['shelter',/\bshelter|\bshade|\bcanop|\broof|\brain|\bcover/i],
 ['adaptability',/\bflexib|\badapt|\bmodul|\bmovab|\bdeploy|\btransform/i],
 ['daylight',/\bdaylight|\bsun|\bglaz|\blight|\bwindow/i],
 ['environment',/\bventilat|\bthermal|\bwind|\bairflow|\bcomfort/i],
 ['structure',/\bstructur|\bcolumn|\bbeam|\bload|\bsupport/i]
];
const relation={
 'input>interpretation':'The second thought offers a reading of the supplied wording.',
 'input>grounding':'The second thought supplies context or an assumption for the source.',
 'input>consequence':'The second thought proposes an immediate spatial response to the source requirement.',
 'interpretation>grounding':'The second thought provides a possible basis for the first reading.',
 'interpretation>goal':'The second thought translates the interpretation into a design aim.',
 'interpretation>consequence':'The second thought turns the interpretation directly into a spatial proposal.',
 'grounding>consequence':'The second thought proposes a spatial response to the condition or reasoning in the first.',
 'grounding>goal':'The second thought expresses the value or aim inferred from the contextual reasoning.',
 'consequence>evaluation':'The second thought tests or judges the proposed spatial move or its effects.',
 'consequence>goal':'The second thought identifies the aim served or reconsidered by the proposal.',
 'evaluation>consequence':'The second thought is a possible response to the judgement or trade-off.',
 'evaluation>goal':'The second thought develops a priority from the evaluation.',
 'goal>consequence':'The second thought offers a design move that may pursue the stated aim.'
};
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const quote=s=>`“${clean(s).slice(0,150)}${clean(s).length>150?'…':''}”`;
export function explainConnectionPair(source,target){
 if(!source||!target)return {reason:'Choose two different thoughts.',next:'Name the relationship before linking.'};
 const a=clean(source.label),b=clean(target.label),key=`${source.type}>${target.type}`;
 const common=topics.filter(([,rx])=>rx.test(a)&&rx.test(b)).map(([n])=>n);
 const aTopics=topics.filter(([,rx])=>rx.test(a)).map(([n])=>n);
 const bTopics=topics.filter(([,rx])=>rx.test(b)).map(([n])=>n);
 const base=relation[key]||'The arrow records a proposed dependency between these two authored thoughts.';
 // Mechanism-specific reasoning is a question about architectural operations, not proof.
 let focus='';
 if((/\b20\b|\badditional\b|\bcapacity\b/i.test(a)) && /\bseat|\bbench|\bperch|\bsit/i.test(b)){
   focus='The proposal may increase usable seats in response to a capacity requirement. It does not establish that the required count fits within the sheltered footprint or leaves the circulation route clear.';
 }else if(aTopics.includes('privacy') && /\bscreen|\bpartition|\bwall|\benclos/i.test(b)){
   focus='Screens or partitions could support privacy through visual separation for individual use, while also changing sightlines, access and the degree of enclosure. Their effectiveness depends on placement and height.';
 }else if(aTopics.includes('circulation') && bTopics.includes('seating')){
   focus='The seating proposal changes how space beside the route is occupied; it may support use, but could compete with pedestrian clearance.';
 }else if(aTopics.includes('daylight') && /\bscreen|\bshade|\bcanop|\bfacade|\bfaçade/i.test(b)){
   focus='The proposed element can modify direct sunlight, glare and daylight penetration; orientation, geometry and material transmissivity matter.';
 }else if(common.includes('adaptability')){
   focus='The two statements concern a changing arrangement; the spatial mechanism needs a specific movable component, its operating sequence and space to store or deploy it.';
 }else if(common.includes('circulation')){
   focus='The second thought may change movement through the site; route continuity and usable clearances must be checked in plan.';
 }else if(common.includes('privacy')){
   focus='The relationship may affect separation between occupants, but privacy can mean sightlines, sound, distance or degrees of access. Identify which operates here.';
 }else if(common.length){
   focus=`The proposed relationship addresses ${common.join(' and ')}, but the shared topic alone does not establish that the second thought satisfies the first.`;
 }else if(aTopics.length||bTopics.length){
   focus=`The source concerns ${aTopics.join(', ')||'a design condition'}, whereas the destination concerns ${bTopics.join(', ')||'another reasoning move'}. The connection needs an explicitly stated criterion to explain the change.`;
 }
 const next=common.includes('seating')?'Check seat count, sheltered footprint and whether the main route stays clear.':
   common.includes('circulation')?'Test the route width, accessibility and movement conflicts in plan.':
   common.includes('privacy')?'Specify whose privacy is needed, how enclosure changes sightlines, and what is sacrificed.':
   common.includes('daylight')?'Test orientation, glare, daylight access and spatial consequences.':
   common.includes('adaptability')?'Describe what actually moves, when it changes and how its operation is supported.':
   `State the criterion or observed evidence that makes ${quote(b)} follow from ${quote(a)}. Do not fill a missing step unless it actually occurred.`;
 return {reason:`${base} ${focus}`.trim(),next,sourceText:a,targetText:b};
}
export function proposedReasoningGap(source,target,{frameworkId='tracework'}={}){
 if(!source||!target)return null;
 const a=source.type,b=target.type;
 if(frameworkId==='freeform')return null;
 if((a==='input'||a==='interpretation')&&b==='consequence')return {
   reason:'This link jumps directly from source language or an interpretation to a spatial proposition. That may reflect a real design move, but the justification is not explicit in this arrow.',
   next:'What in the source wording makes this specific spatial intervention appropriate? Record an interpretation, assumption or test only if it actually happened.'
 };
 if(a==='evaluation'&&b==='interpretation')return {reason:'This is a return from judgement to reinterpretation, not a straightforward forward step.',next:'Identify what finding caused the initial interpretation to be reconsidered.'};
 if(a==='goal'&&b==='grounding')return {reason:'The link moves from an aim back to its justification.',next:'Identify whether the grounding was observed first or was sought afterward to test the aim.'};
 if(a==='consequence'&&b==='interpretation')return {reason:'The link moves from a proposed or experienced space back to interpretation.',next:'Identify which spatial observation changed the reading and when it was recorded.'};
 const standard={input:['interpretation','grounding'],interpretation:['grounding','goal'],grounding:['interpretation','consequence','goal'],consequence:['consequence','evaluation','goal'],evaluation:['consequence','goal'],goal:['consequence'],note:['input','interpretation','grounding','consequence','evaluation','goal','note']};
 if(!standard[a]?.includes(b) && a!=='note' && b!=='note')return {
    reason:`The jump from ${a} to ${b} is unconventional within the current grammar, though TRACEWORK allows you to record it.`,
    next:'Make the dependency explicit in your own terms, or add a bridging node only if it represents reasoning you actually undertook.'
 };
 return null;
}
