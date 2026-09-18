import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
import {initialize,processPhoto,limits} from './processor.mjs';
const allowed=new Set(['http://127.0.0.1:8765']);
const hash=async(b)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(x=>x.toString(16).padStart(2,'0')).join('');
let ready;let busy=false;
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(allowed.has(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'}:{})};
 const answer=(status,body)=>new Response(JSON.stringify(body),{status,headers});
 if(!allowed.has(origin))return answer(403,{error:'origin_denied'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return answer(405,{error:'method'});
 const bearer=req.headers.get('authorization')||'';if(!bearer.startsWith('Bearer '))return answer(401,{error:'authentication_required'});
 // Use only platform anon key + caller JWT. No service-role access or writes.
 const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:bearer}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:user,error}=await client.auth.getUser(bearer.slice(7));if(error||!user.user)return answer(401,{error:'authentication_required'});
 const {data:context,error:contextError}=await client.schema('hub_api').rpc('current_context');
 if(contextError||!context?.organizations?.some(o=>o.id==='5ec23dc8-59ec-499c-8adc-06816579607b'))return answer(403,{error:'test_organization_required'});
 if(busy)return answer(429,{error:'busy'});busy=true;
 try{
  const reader=req.body?.getReader();if(!reader)return answer(400,{error:'empty'});
  const chunks=[];let total=0;for(;;){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>limits.bytes){await reader.cancel();return answer(413,{error:'file_size'});}chunks.push(value);}
  const input=new Uint8Array(total);let offset=0;for(const chunk of chunks){input.set(chunk,offset);offset+=chunk.length;}
  ready ||= (async()=>{const r=await fetch('https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.43/dist/x86/magick.wasm');if(!r.ok)throw Error('wasm_unavailable');const b=new Uint8Array(await r.arrayBuffer());if(await hash(b)!=='5a4ed1017eda113144c86ae839c22c610afebcfebfa22b1da18e00e98d78b0f7')throw Error('wasm_integrity');await initialize(b);})();
  await ready;const start=performance.now();const out=processPhoto(input,req.headers.get('content-type'));
  return answer(200,{result:'processed_not_saved',inputBytes:total,outputBytes:out.bytes.length,width:out.width,height:out.height,elapsedMs:Math.round(performance.now()-start),checksum:await hash(out.bytes)});
 }catch(e){const known=['pixel_limit','file_size','mime_mismatch','unsupported_image','animated_image'];return answer(422,{error:known.includes(e.message)?e.message:'image_processing_failed'});}finally{busy=false;}
});
