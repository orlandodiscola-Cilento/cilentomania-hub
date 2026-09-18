import {createSupabaseSession} from './supabase-auth.js';
import {SupabaseRepository} from './supabase-repository.js';
export async function connectBackend(config) {
 const auth=await createSupabaseSession(config);
 return {kind:'supabase',auth,repo:new SupabaseRepository(auth),capabilities:{demoSimulation:false,online:true}};
}
