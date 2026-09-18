import {BackendUnavailableError} from './configuration.js';
export function passwordRedirect(location){
  const url=new URL('password.html',new URL('./',location.href));
  if(url.href!=='https://www.cilentomania.it/hub/operatori/password.html')throw new BackendUnavailableError();
  return url.href;
}
