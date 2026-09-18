import {loadConfiguration,BackendUnavailableError} from './configuration.js';
import {connectBackend} from '../js/supabase-backend.js';
let connection;
export function getBackend(){connection ||= loadConfiguration().then(connectBackend);return connection;}
export function showBackendError(root){root.replaceChildren();const p=document.createElement('p');p.className='notice error';p.setAttribute('role','alert');p.textContent=new BackendUnavailableError().message;root.append(p);}
