// Browser-only UI fixture. Never deployed (tests/** excluded). CSP forbids network.
import {mountAuth,passwordForm} from '../../operatori/js/auth-ui.js';
import {SupabaseSession} from '../../operatori/js/supabase-auth.js';
let active=false;
const client={auth:{
 getSession:async()=>({data:{session:active?{}:null}}),
 getUser:async()=>({data:{user:active?{id:'fixture-user',email:'operator@example.test'}:null}}),
 signInWithPassword:async()=>{active=true;return {error:null};},
 signOut:async()=>{active=false;return {error:null};},
 resetPasswordForEmail:async()=>({error:null}),
 updateUser:async()=>({error:null}),
 onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})
},schema:()=>({rpc:async()=>({data:null,error:null})})};
const auth=new SupabaseSession(client,'http://127.0.0.1:8765/operatori/password.html');
const root=document.querySelector('#app');
if(new URLSearchParams(location.search).has('password')){active=true;passwordForm(root,auth,true);}
else await mountAuth(root,auth);
