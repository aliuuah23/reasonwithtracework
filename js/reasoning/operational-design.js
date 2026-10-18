// Operational design prompts: they expose spatial questions, not automated decisions.
// Used by every node and framework (including Freeform and literature lenses).
const features=[
 {keys:/\b(route|path|pedestrian|circulation|entry|access|movement|walk|flow)\b/i,name:'circulation',overall:'Organise paths and destinations without treating every movement as the same.',detail:'Sketch the main and secondary routes; test clear widths, crossings, entries and turning points.'},
 {keys:/\b(privacy|private|screen|partition|quiet|enclos|separat|boundary)\b/i,name:'privacy and enclosure',overall:'Compare degrees of separation instead of treating privacy as one binary condition.',detail:'Test sight lines, screen height, partition permeability and acoustic distance in plan and section.'},
 {keys:/\b(group|gather|social|communal|seat|occup|student|study|user)\b/i,name:'occupation',overall:'Organise individual and collective occupation as a relationship between users and places.',detail:'Sketch furniture/seat clusters, capacities, interpersonal distance and group changes over time.'},
 {keys:/\b(flex\w*|adapt\w*|movab\w*|reconfig\w*|modul\w*|chang\w*|expan\w*|phas\w*|incremental)\b/i,name:'adaptation',overall:'Decide which design elements stay fixed and which can transform over time.',detail:'Draw at least two arrangement states and identify movable components, storage and operating steps.'},
 {keys:/\b(roof|canopy|shelter|rain|shade|sun|light|climate|weather|ventilat)\b/i,name:'environmental cover',overall:'Translate comfort into relationships between exposure, protection and occupation.',detail:'Diagram canopy extent, drainage, solar exposure, cross-ventilation and covered versus uncovered use.'},
 {keys:/\b(structur\w*|column\w*|span\w*|material\w*|assembl\w*|join\w*|timber|concret\w*|wall\w*|floor\w*)\b/i,name:'structure and material',overall:'Locate the supporting system relative to intended space and movement.',detail:'Sketch supports, spans, assembly joints, structural clearances and a simple axonometric system.'}
];
const roleQuestions={
 input:'Which words introduce a measurable spatial condition, and which remain open to interpretation?',
 interpretation:'What different spatial readings would this wording permit?',
 grounding:'Which site, user or precedent evidence could make this spatial reading credible?',
 consequence:'What spatial configuration would embody this move, and what might it prevent?',
 evaluation:'Which spatial or operational trade-off would distinguish two options?',
 goal:'Which observable spatial or experiential outcome would show this goal was achieved?',
 note:'What spatial question might this unclassified thought eventually become?'
};
export function operationalSuggestions(text='',type='note',framework='TRACEWORK'){
 const matched=features.filter(f=>f.keys.test(text));
 const primary=matched[0];
 return {
  cues:matched.map(f=>f.name),
  overall:primary?.overall || roleQuestions[type] || roleQuestions.note,
  detail:primary?.detail || 'Choose a feature or dimension to test in plan, section or simple axonometric; attach a relevant case only when its architectural feature matches the wording.',
  probe:roleQuestions[type]||roleQuestions.note,
  frame:framework
 };
}
