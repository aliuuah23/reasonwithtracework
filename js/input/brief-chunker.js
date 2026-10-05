import { normaliseBrief } from './brief-parser.js';

function headingLike(text=''){
  const t=text.trim();
  if(!t || t.length>100) return false;
  if(/[.!?]$/.test(t)) return false;
  const words=t.split(/\s+/).filter(Boolean);
  return words.length<=12;
}

function chunkTitle(blocks,index){
  const first=(blocks[0]?.text||'').trim();
  if(headingLike(first)) return first;
  const plain=first.replace(/\s+/g,' ');
  return plain.length>58?`${plain.slice(0,55)}…`:(plain||`Section ${index+1}`);
}

export function chunkBrief(text,{maxChars=1700,minChars=420}={}){
  const full=normaliseBrief(text);
  if(!full) return [];
  const rawBlocks=full.split(/\n{2,}/).map(s=>s.trim()).filter(Boolean);
  const blocks=[];
  let cursor=0;
  for(const raw of rawBlocks){
    const start=full.indexOf(raw,cursor);
    const end=start+raw.length;
    blocks.push({text:raw,start,end});
    cursor=end;
  }
  const groups=[];
  let current=[];
  const flush=()=>{ if(current.length){ groups.push(current); current=[]; } };
  for(const block of blocks){
    const currentText=current.map(b=>b.text).join('\n\n');
    const would=currentText ? `${currentText}\n\n${block.text}` : block.text;
    const startsNew=headingLike(block.text) && current.length && currentText.length>=minChars;
    if(startsNew || (would.length>maxChars && current.length)) flush();
    current.push(block);
  }
  flush();
  return groups.map((group,index)=>({
    id:`brief-chunk-${index+1}`,
    index,
    title:chunkTitle(group,index),
    start:group[0].start,
    end:group[group.length-1].end,
    text:full.slice(group[0].start,group[group.length-1].end)
  }));
}

export function attachChunksToHotspots(hotspots=[],chunks=[]){
  if(!chunks.length) return hotspots.map(h=>({...h,chunkId:null}));
  return hotspots.map(h=>{
    const c=chunks.find(x=>h.start>=x.start && h.start<x.end) || chunks[chunks.length-1];
    return {...h,chunkId:c?.id||null};
  });
}
