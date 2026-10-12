export function normaliseBrief(text){ return text.replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim(); }
export function sentences(text){ return normaliseBrief(text).split(/(?<=[.!?])\s+/).filter(Boolean); }
export function escapeHtml(text=''){ return text.replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])); }
