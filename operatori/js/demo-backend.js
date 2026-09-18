import {connect} from './demo-repository.js';
import * as demoSession from './demo-session.js';
import {OperatorSession} from './session.js';

export class DemoSession extends OperatorSession {
  constructor(seed) { super(); this.seed = seed; }
  async current({area = 'operator'} = {}) {
    return area === 'admin' ? demoSession.adminSession() : demoSession.current();
  }
  async login(email, password) { return demoSession.login(this.seed, email, password); }
  async logout() { demoSession.logout(); }
  async recoverPassword() { return 'Il recupero password non è attivo nella demo. Nessuna email verrà inviata.'; }
  async changePassword() { throw new Error('Il cambio password non è attivo nella demo.'); }
}

export async function connectBackend() {
  const {repo, seed, records} = await connect();
  // Compatibility data is resolved here, not in the application views.
  const list = repo.list.bind(repo), get = repo.get.bind(repo);
  const enrich = profile => ({...profile, publicPageId:profile.publicPageId || seed.profiles.find(p => p.id === profile.id)?.publicPageId || null});
  repo.list = async session => (await list(session)).map(enrich);
  repo.get = async (session, id) => enrich(await get(session, id));
  repo.previewContext = async (session, id) => {
    const profile = await repo.get(session, id);
    return {territoryContent:records.find(r => r.id === profile.sourceId)?.territoryContent || [], isDemo:true, photosIllustrative:true};
  };
  return Object.freeze({kind:'demo', repo, auth:new DemoSession(seed), capabilities:Object.freeze({demoSimulation:true})});
}
