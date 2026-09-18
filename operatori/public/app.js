import {loadConfiguration} from './configuration.js';
import {getBackend} from './backend.js';
import {mountOnline} from '../js/online-ui.js';
const root=document.querySelector('#app');
async function start(){
  const incoming=new URL(location.href),fragment=new URLSearchParams(incoming.hash.slice(1));
  if(incoming.searchParams.has('code')||incoming.searchParams.has('error')||fragment.has('access_token')||fragment.has('error')){
    const target=new URL('password.html',incoming);target.search=incoming.search;target.hash=incoming.hash;location.replace(target.href);return;
  }
  const backend=await getBackend();
  await mountOnline(root,backend,{publicArea:true});
}
start().catch(()=>{root.replaceChildren();const p=document.createElement('p');p.className='notice error';p.textContent='Il servizio di accesso non è disponibile. Riprova più tardi.';root.append(p);});
