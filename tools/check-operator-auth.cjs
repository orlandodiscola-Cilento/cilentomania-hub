const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
const load=name=>import(pathToFileURL(path.join(root,'operatori/js',name)));
(async()=>{
 const {SupabaseSession,consumeCallback,passwordRedirect,createSupabaseSession,messages}=await load('supabase-auth.js');
 const {validateConfiguration}=await load('configuration.js');
 const {createBackend}=await load('backend.js');
 let active=true, verified=true, context=null, calls=[], sessionError=null, userError=null, rpcError=null, updateError=null, callbackError=null, recoveryError=null;
 const client={auth:{
  getSession:async()=>({data:{session:active?{}:null},error:sessionError}),
  getUser:async()=>({data:{user:verified?{id:'unit-user',email:'operator@example.test'}:null},error:userError}),
  signInWithPassword:async args=>{calls.push(['login',args]);return {error:null};},
  signOut:async args=>{calls.push(['logout',args]);active=false;return {error:null};},
  resetPasswordForEmail:async(email,options)=>{calls.push(['recovery',options]);return {error:recoveryError};},
  updateUser:async args=>{calls.push(['update',Object.keys(args)]);return {error:updateError};},
  setSession:async()=>{calls.push(['invite']);return {error:callbackError};},
  exchangeCodeForSession:async()=>{calls.push(['pkce']);return {error:callbackError};},
  onAuthStateChange:fn=>{calls.push(['subscribe']);return {data:{subscription:{unsubscribe(){calls.push(['unsubscribe']);}}}};}
 },schema:name=>{assert.equal(name,'hub_api');return {rpc:async name=>{assert.equal(name,'current_context');return {data:context,error:rpcError};}}}};
 const redirect='http://127.0.0.1:8765/operatori/password.html';
 const auth=new SupabaseSession(client,redirect);
 assert.equal((await auth.current()).provider,'supabase');
 assert.equal(await auth.context(),null,'Missing/disabled application profile must not receive demo permissions');
 context={user:{id:'unit-user'},organizations:[]};assert.deepEqual(await auth.context(),context);
 rpcError={status:500,message:'private detail'};await assert.rejects(auth.context(),{message:messages.unavailable});rpcError=null;
 userError={status:503};await assert.rejects(auth.current(),{message:messages.unavailable});assert.equal(active,true);userError=null;
 userError={status:401};assert.equal(await auth.current(),null);assert.equal(active,false);userError=null;active=true;
 verified=false;assert.equal(await auth.current(),null);verified=true;
 assert.equal((await auth.login('operator@example.test','unit test password')).userId,'unit-user');
 await assert.rejects(auth.changePassword('short'),{message:messages.password});
 await auth.changePassword('unit test long password','unit test old password');
 assert.deepEqual(calls.find(c=>c[0]==='update')[1],['password','current_password']);
 updateError={message:'secret diagnostic'};await assert.rejects(auth.changePassword('unit test long password'),{message:messages.update});updateError=null;
 await assert.rejects(auth.recoverPassword('invalid'));
 assert.equal(await auth.recoverPassword('operator@example.test'),messages.recovery);
 assert.deepEqual(calls.find(c=>c[0]==='recovery')[1],{redirectTo:redirect});
 recoveryError={status:400};assert.equal(await auth.recoverPassword('missing@example.test'),messages.recovery);
 recoveryError={status:429};await assert.rejects(auth.recoverPassword('operator@example.test'),{message:messages.unavailable});recoveryError=null;
 let cleaned;const history={replaceState:(_,__,url)=>cleaned=url};
 const parse=extra=>consumeCallback(new URL(redirect+extra),history);
 assert.equal(parse('?error=access_denied').kind,'invalid');assert.equal(cleaned,'/operatori/password.html');
 assert.equal(parse('#access_token=fixture&type=signup').kind,'invalid');
 assert.equal(parse('?next=https://example.org').kind,'invalid');
 assert.equal(parse('').kind,'none');
 const code=parse('?code=unit-code');await auth.acceptCallback(code);assert.equal(code.code,undefined);
 const invite=parse('#access_token=unit-access&refresh_token=unit-refresh&type=invite');await auth.acceptCallback(invite);assert.equal(invite.access,undefined);assert.equal(invite.refresh,undefined);
 callbackError={message:'sensitive'};await assert.rejects(auth.acceptCallback(parse('?code=expired')),{message:messages.link});assert.equal(active,false);callbackError=null;
 await assert.rejects(auth.changePassword('unit test long password'),{message:messages.expired});
 assert.equal(passwordRedirect(new URL('http://127.0.0.1:8765/operatori/')),redirect);
 for(const href of ['http://192.168.1.66:8765/operatori/','https://www.cilentomania.it/hub/operatori/','https://example.org/operatori/'])assert.throws(()=>passwordRedirect(new URL(href)));
 const config={backend:'demo',auth:'supabase',supabase:{url:'',publishableKey:''}};
 let loads=0;await assert.rejects(createSupabaseSession(config,{loadClient:()=>{loads++;}}));assert.equal(loads,0);
 await assert.rejects(createBackend(config,{demo:()=>{throw Error('MUST NOT LOAD DEMO');}}));
 assert.equal(validateConfiguration(config).auth,'supabase');
 assert.throws(()=>validateConfiguration({...config,auth:'invalid'}));
 assert.throws(()=>validateConfiguration({...config,backend:'supabase',auth:'demo'}));
 const actual=JSON.parse(fs.readFileSync(path.join(root,'operatori/config.json')));assert.equal(actual.backend,'demo');assert.equal(actual.auth,'demo');
 assert.equal(actual.supabase.publishableKey,'');
 for(const page of ['index.html','password.html']){
  const html=fs.readFileSync(path.join(root,'operatori',page),'utf8');
  assert.match(html,/Content-Security-Policy/);assert.match(html,/script-src 'self'/);assert.match(html,/no-referrer/);assert.ok(!/unsafe-eval/.test(html));
 }
 const source=fs.readFileSync(path.join(root,'operatori/js/supabase-auth.js'),'utf8');
 assert.match(source,/persistSession:true/);assert.match(source,/autoRefreshToken:true/);assert.match(source,/detectSessionInUrl:false/);assert.match(source,/flowType:'pkce'/);
 assert.ok(!/\.admin\.|\.signUp\(|console\./.test(source));
 console.log('PASS: verified identity, session expiry/network failure, disabled/absent profile, login/logout, password validation/errors, recovery without enumeration, invite/PKCE and URL scrubbing, redirect allowlist, no demo fallback, CSP, no accounts/emails/network.');
})().catch(error=>{console.error(error);process.exitCode=1;});
