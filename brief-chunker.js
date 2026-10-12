import { normaliseBrief } from './brief-parser.js';

function trimRange(full,start,end){
  let a=Math.max(0,start), b=Math.min(full.length,end);
  while(a<b && /\s/.test(full[a])) a++;
  while(b>a && /\s/.test(full[b-1])) b--;
  return {start:a,end:b,text:full.slice(a,b)};
}

function cleanHeading(text=''){
  return text.trim()
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\d+(?:\.\d+)*[.)]?\s+/, '')
    .replace(/[:\-–—]\s*$/, '')
    .trim();
}

function headingLike(text=''){
  const t=text.trim();
  if(!t || t.length>100 || /[.!?]$/.test(t)) return false;
  const words=t.replace(/^#{1,6}\s*/, '').split(/\s+/).filter(Boolean);
  if(!words.length || words.length>12) return false;
  if(/^#{1,6}\s+/.test(t)) return true;
  if(/^\d+(?:\.\d+)*[.)]?\s+\S/.test(t)) return true;
  if(/:$/.test(t)) return true;
  const letters=t.replace(/[^A-Za-z]/g,'');
  if(letters.length>=3 && t===t.toUpperCase()) return true;
  if(words.length<=6 && words.every(w=>/^[A-Z][A-Za-z0-9/&+\-]*$/.test(w) || /^(and|of|for|to|the|in)$/i.test(w))) return true;
  return false;
}

function autoTitle(text='',index=0){
  const firstLine=text.split('\n').map(s=>s.trim()).find(Boolean)||'';
  if(headingLike(firstLine)) return cleanHeading(firstLine)||`Section ${index+1}`;
  const plain=text.replace(/\s+/g,' ').trim();
  return plain.length>58?`${plain.slice(0,55)}…`:(plain||`Section ${index+1}`);
}

function sentenceSpans(full,start,end){
  const text=full.slice(start,end);
  const spans=[];
  const re=/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g;
  let m;
  while((m=re.exec(text))){
    const range=trimRange(full,start+m.index,start+m.index+m[0].length);
    if(range.text) spans.push(range);
  }
  return spans.length?spans:[trimRange(full,start,end)];
}

function splitRange(full,start,end,{maxChars,minChars,title}){
  const base=trimRange(full,start,end);
  if(!base.text) return [];
  if(base.text.length<=maxChars) return [{...base,title}];

  const sentences=sentenceSpans(full,base.start,base.end);
  if(sentences.length<=1){
    const out=[];
    let cursor=base.start, part=1;
    while(cursor<base.end){
      let cut=Math.min(base.end,cursor+maxChars);
      if(cut<base.end){
        const slice=full.slice(cursor,cut);
        const last=Math.max(slice.lastIndexOf('\n'),slice.lastIndexOf(' '));
        if(last>minChars) cut=cursor+last;
      }
      const range=trimRange(full,cursor,cut);
      if(range.text) out.push({...range,title:`${title} · ${part++}`});
      cursor=Math.max(cut,cursor+1);
    }
    return out;
  }

  const groups=[];
  let current=[];
  const flush=()=>{ if(current.length){ groups.push(current); current=[]; } };
  for(const sentence of sentences){
    const proposed=current.length ? sentence.end-current[0].start : sentence.end-sentence.start;
    if(current.length && proposed>maxChars && current[current.length-1].end-current[0].start>=minChars) flush();
    current.push(sentence);
  }
  flush();
  return groups.map((g,i)=>{
    const range=trimRange(full,g[0].start,g[g.length-1].end);
    return {...range,title:groups.length>1?`${title} · ${i+1}`:title};
  });
}

function paragraphRanges(full){
  const out=[];
  const re=/\S[\s\S]*?(?=\n{2,}|$)/g;
  let m;
  while((m=re.exec(full))){
    const range=trimRange(full,m.index,m.index+m[0].length);
    if(range.text) out.push(range);
  }
  return out;
}

export function chunkBrief(text,{maxChars=900,minChars=180}={}){
  const full=normaliseBrief(text);
  if(!full) return [];

  // First preference: headings create real filing sections, even when each section is short.
  const lines=[];
  let cursor=0;
  for(const line of full.split('\n')){
    const start=cursor, end=start+line.length;
    lines.push({text:line,start,end});
    cursor=end+1;
  }
  const headingLines=lines.filter(l=>headingLike(l.text));
  let ranges=[];
  if(headingLines.length>=2){
    const first=headingLines[0];
    const preamble=trimRange(full,0,first.start);
    if(preamble.text) ranges.push({...preamble,title:'Overview'});
    headingLines.forEach((heading,i)=>{
      const end=i<headingLines.length-1?headingLines[i+1].start:full.length;
      const range=trimRange(full,heading.start,end);
      if(range.text) ranges.push({...range,title:cleanHeading(heading.text)||`Section ${i+1}`});
    });
  }else{
    // No reliable headings: treat paragraph groups as files, then split oversized paragraphs by sentence.
    const paragraphs=paragraphRanges(full);
    if(paragraphs.length>1){
      let group=[];
      const flush=()=>{
        if(!group.length) return;
        const range=trimRange(full,group[0].start,group[group.length-1].end);
        if(range.text) ranges.push({...range,title:autoTitle(range.text,ranges.length)});
        group=[];
      };
      for(const p of paragraphs){
        const proposed=group.length?p.end-group[0].start:p.end-p.start;
        if(group.length && proposed>maxChars) flush();
        group.push(p);
      }
      flush();
    }else{
      const only=trimRange(full,0,full.length);
      if(only.text) ranges=[{...only,title:autoTitle(only.text,0)}];
    }
  }

  const split=[];
  ranges.forEach(r=>split.push(...splitRange(full,r.start,r.end,{maxChars,minChars,title:r.title})));
  return split.map((r,index)=>(
    {id:`brief-chunk-${index+1}`,index,title:r.title||`Section ${index+1}`,start:r.start,end:r.end,text:r.text}
  ));
}

export function attachChunksToHotspots(hotspots=[],chunks=[]){
  if(!chunks.length) return hotspots.map(h=>({...h,chunkId:null}));
  return hotspots.map(h=>{
    const c=chunks.find(x=>h.start>=x.start && h.start<x.end) || chunks.find(x=>h.end>x.start && h.end<=x.end) || chunks[chunks.length-1];
    return {...h,chunkId:c?.id||null};
  });
}
