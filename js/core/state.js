const listeners = new Set();

const freshState = () => ({
  version: 2,
  projectId: `tw-${Date.now()}`,
  projectName: 'Untitled trace',
  brief: '',
  briefMode: 'quick',
  briefChunks: [],
  activeBriefChunkId: null,
  sourceFileName: '',
  hotspots: [],
  selectedHotspotId: null,
  nodes: [],
  edges: [],
  activeNodeId: null,
  activeBranchId: 'branch-1',
  view: 'workspace',
  history: [],
  comments: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

let state = freshState();

export function getState(){ return state; }
export function resetState(){ state = freshState(); notify(); return state; }
export function replaceState(next){ state = { ...freshState(), ...next }; notify(); }
export function patchState(patch, {silent=false} = {}){
  state = { ...state, ...patch, updatedAt: new Date().toISOString() };
  if (!silent) notify();
  return state;
}
export function updateState(mutator){
  const draft = structuredClone(state);
  mutator(draft);
  draft.updatedAt = new Date().toISOString();
  state = draft;
  notify();
  return state;
}
export function subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); }
function notify(){ listeners.forEach(fn => fn(state)); }
export function logEvent(action, detail=''){
  updateState(s => {
    s.history.unshift({ id:`event-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, action, detail, time:new Date().toISOString() });
    s.history = s.history.slice(0,80);
  });
}
