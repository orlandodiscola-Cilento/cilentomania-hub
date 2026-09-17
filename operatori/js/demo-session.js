const key='cilentomania_operator_demo_user';
export function current(){try{return JSON.parse(sessionStorage.getItem(key)||'null');}catch{return null;}}
export function login(seed,email,password){const user=seed.users.find(u=>u.email===email.trim().toLowerCase()&&u.role==='operator');if(!user||password!=='demo')throw Error('Usa una delle email demo indicate e la password demo.');const s={userId:user.id};sessionStorage.setItem(key,JSON.stringify(s));return s;}
export function logout(){sessionStorage.removeItem(key);}
export const adminSession=()=>({userId:'redazione'}); // Explicit local simulator, NOT authentication.
