// TRACEWORK D3.1 — Optional external image-model backend.
// Never publish OPENAI_API_KEY or TRACEWORK_ACCESS_TOKEN to GitHub Pages.
// Configure both as Worker Secrets. This Worker is not deployed by the site ZIP.
const json=(body,status,origin)=>new Response(JSON.stringify(body),{
 status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',
  'Vary':'Origin','Access-Control-Allow-Origin':origin,
  'Access-Control-Allow-Headers':'Content-Type,X-Tracework-Token',
  'Access-Control-Allow-Methods':'POST,OPTIONS'}
});
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin')||'',allowed=env.ALLOWED_ORIGIN||'https://aliuuah23.github.io';
  if(origin!==allowed)return json({error:'Origin not permitted'},403,allowed);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
    'Access-Control-Allow-Origin':allowed,'Access-Control-Allow-Headers':'Content-Type,X-Tracework-Token',
    'Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin'}});
  if(request.method!=='POST'||new URL(request.url).pathname!=='/generate')return json({error:'Not found'},404,allowed);
  if(!env.OPENAI_API_KEY||!env.TRACEWORK_ACCESS_TOKEN)return json({error:'Worker secrets not configured'},503,allowed);
  const attempted=request.headers.get('X-Tracework-Token')||'';
  if(!attempted||attempted!==env.TRACEWORK_ACCESS_TOKEN)return json({error:'Access token not accepted'},401,allowed);
  if(!/^application\/json\b/i.test(request.headers.get('Content-Type')||''))return json({error:'JSON required'},415,allowed);
  if(Number(request.headers.get('Content-Length')||0)>50000)return json({error:'Request too large'},413,allowed);
  // Optional Cloudflare native rate-limit binding, configured separately in Worker settings.
  // Limit/cost controls should also be applied at the account/route level.
  if(env.TRACEWORK_RATE_LIMIT){
    const {success}=await env.TRACEWORK_RATE_LIMIT.limit({key:'personal-form-generation'});
    if(!success)return json({error:'Generation rate limit reached. Try again later.'},429,allowed);
  }
  let input;try{input=await request.json();}catch{return json({error:'Invalid JSON'},400,allowed);}
  if(typeof input?.prompt!=='string'||input.prompt.length<30||input.prompt.length>14000)
   return json({error:'Prompt must contain 30–14,000 characters'},400,allowed);
  const response=await fetch('https://api.openai.com/v1/images/generations',{
   method:'POST',headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
   body:JSON.stringify({model:env.IMAGE_MODEL||'gpt-image-1.5',size:'1536x1024',quality:'medium',n:1,output_format:'jpeg',output_compression:72,prompt:input.prompt})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)return json({error:data?.error?.message||'Image service request failed'},response.status,allowed);
  const b64=data?.data?.[0]?.b64_json;
  if(typeof b64!=='string'||!b64.length)return json({error:'Image service returned no image'},502,allowed);
  return json({image:`data:image/jpeg;base64,${b64}`,generator:'model',verified:false},200,allowed);
 }
};
