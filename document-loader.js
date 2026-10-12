async function readPdf(file){
  const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
  const bytes=new Uint8Array(await file.arrayBuffer());
  const pdf=await pdfjs.getDocument({data:bytes}).promise;
  const pages=[];
  for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i);
    const content=await page.getTextContent();
    const text=content.items.map(item=>item.str).join(' ').replace(/\s+/g,' ').trim();
    if(text) pages.push(text);
  }
  return pages.join('\n\n');
}

async function readDocx(file){
  const mod=await import('https://cdn.jsdelivr.net/npm/mammoth@1.10.0/+esm');
  const mammoth=mod.default||mod;
  const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
  return result.value||'';
}

export async function readBriefFile(file){
  if(!file) return '';
  const name=(file.name||'').toLowerCase();
  const type=file.type||'';
  if(name.endsWith('.pdf') || type==='application/pdf') return readPdf(file);
  if(name.endsWith('.docx') || type.includes('wordprocessingml')) return readDocx(file);
  if(name.endsWith('.txt') || name.endsWith('.md') || type.startsWith('text/')) return file.text();
  throw new Error('Unsupported file type. Use PDF, DOCX, TXT or MD.');
}
