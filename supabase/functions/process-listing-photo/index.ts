import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
import {initialize,processPhoto,limits} from './processor.mjs';
const origins=new Set(['http://127.0.0.1:8765','https://www.cilentomania.it']);
const hash=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(x=>x.toString(16).padStart(2,'0')).join('');
let ready;
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(origins.has(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'}:{})};
 const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
 if(!origins.has(origin))return reply(403,{error:'origin_denied'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});if(req.method!=='POST')return reply(405,{error:'method'});
 const authorization=req.headers.get('authorization')||'';
 const caller=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
 const identity=await caller.auth.getUser(authorization.replace(/^Bearer /,''));if(identity.error||!identity.data.user)return reply(401,{error:'authentication_required'});
 let mid;try{const reader=req.body?.getReader();let text='';if(!reader)throw Error();for(;;){const {done,value}=await reader.read();if(done)break;if(text.length+value.length>200){await reader.cancel();return reply(400,{error:'invalid_request'});}text+=new TextDecoder().decode(value);}mid=JSON.parse(text).mediaId;if(!/^[0-9a-f-]{36}$/.test(mid))throw Error();}catch{return reply(400,{error:'invalid_request'});}
 const context=await caller.schema('hub_api').rpc('media_processing_context',{mid});if(context.error||!context.data)return reply(403,{error:'not_authorized'});
 if(context.data.status==='validated')return reply(200,{status:'ready'});
 // Credential stays exclusively in platform environment; never returned or logged.
 const server=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const claimed=await server.schema('hub_api').rpc('claim_media_processing',{mid});if(claimed.error)return reply(409,{error:'processing_busy'});
 const lease_token=claimed.data;
 try{
  let file=await server.storage.from('listing-drafts').download(context.data.candidate);
  if(file.error)file=await server.storage.from('listing-drafts').download(context.data.original);
  if(file.error||!file.data||file.data.size>limits.bytes)throw Error('processing_failed');
  ready ||= (async()=>{const r=await fetch('https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.43/dist/x86/magick.wasm');if(!r.ok)throw Error();const b=new Uint8Array(await r.arrayBuffer());if(await hash(b)!=='5a4ed1017eda113144c86ae839c22c610afebcfebfa22b1da18e00e98d78b0f7')throw Error();await initialize(b);})().catch(e=>{ready=undefined;throw e;});await ready;
  const output=processPhoto(new Uint8Array(await file.data.arrayBuffer()),file.data.type);
  const file_checksum=await hash(output.bytes);
  const write=await server.storage.from('listing-published').upload(context.data.published,output.bytes,{contentType:'image/webp',upsert:false,cacheControl:'60'});
  if(write.error){const existing=await server.storage.from('listing-published').download(context.data.published);if(existing.error||existing.data.size>limits.bytes||await hash(await existing.data.arrayBuffer())!==file_checksum)throw Error('processing_failed');}
  const stillAllowed=await caller.schema('hub_api').rpc('media_processing_context',{mid});if(stillAllowed.error)throw Error('processing_failed');
  const complete=await server.schema('hub_api').rpc('finish_media_processing',{mid,lease_token,file_checksum,pixel_width:output.width,pixel_height:output.height});if(complete.error)throw Error('processing_failed');
  return reply(200,{status:'ready',width:output.width,height:output.height});
 }catch(e){const failure_code=e.message==='pixel_limit'?'candidate_required':'processing_failed';await server.schema('hub_api').rpc('finish_media_processing',{mid,lease_token,file_checksum:null,pixel_width:null,pixel_height:null,failure_code});return reply(422,{error:failure_code});}
});
