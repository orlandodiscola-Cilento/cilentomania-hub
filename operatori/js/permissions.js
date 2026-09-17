export function actor(state, session) {
  const user=state.users.find(u=>u.id===session?.userId);
  if(!user) throw Error('Accedi alla demo per continuare.');
  return user;
}
export function authorize(state,session,profile,adminOnly=false) {
  const user=actor(state,session);
  if(user.role==='admin') return user;
  if(adminOnly || !state.memberships.some(m=>m.userId===user.id&&m.organizationId===profile.organizationId)) throw Error('Non puoi accedere a questa scheda.');
  return user;
}
export const canSee=(state,session,profile)=>{try{authorize(state,session,profile);return true;}catch{return false;}};
