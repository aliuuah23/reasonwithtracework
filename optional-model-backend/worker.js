// Optional Cloudflare Worker backend for TRACEWORK D2.12. NOT part of the static GitHub Pages site.
// Required Worker secrets (never place them in GitHub Pages): OPENAI_API_KEY, TRACEWORK_ACCESS_TOKEN.
// Set ALLOWED_ORIGIN to the exact GitHub Pages origin; restrict sharing and account costs.
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin')||'';
  const allowed=env.ALLOWED_ORIGIN||'https://aliuuah23.github.io';
  const cors={'Access-Control-Allow-Origin':origin===allowed?origin:allowed,'Vary':'Origin',
   'Access-Control-Allow-Headers':'Content-Type,X-Tracework-Token','Access-Control-Allow-Methods':'POST,OPTIONS'};
  const result=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json',...cors}});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='POST'||new URL(request.url).pathname!=='/generate')return result({error:'Not found'},404);
  if(origin!==allowed)return result({error:'Origin not permitted'},403);
  if(!env.OPENAI_API_KEY||!env.TRACEWORK_ACCESS_TOKEN)return result({error:'Backend has not been configured'},503);
  if(request.headers.get('X-Tracework-Token')!==env.TRACEWORK_ACCESS_TOKEN)return result({error:'Access token not accepted'},401);
  const input=await request.json().catch(()=>null);
  if(typeof input?.prompt!=='string'||input.prompt.length<30||input.prompt.length>14000)return result({error:'Invalid prompt'},400);
  const response=await fetch('https://api.openai.com/v1/images/generations',{
   method:'POST',headers:{'Authorization':`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
   body:JSON.stringify({model:'gpt-image-1.5',size:'1536x1024',quality:'medium',n:1,output_format:'jpeg',output_compression:72,prompt:input.prompt})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)return result({error:data.error?.message||'Model request failed'},response.status);
  const base64=data.data?.[0]?.b64_json;
  if(!base64)return result({error:'Model returned no image'},502);
  return result({image:'data:image/jpeg;base64,'+base64});
 }
};
