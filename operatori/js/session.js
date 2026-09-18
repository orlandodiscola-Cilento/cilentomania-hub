// Identity comes from the selected provider. A future server must never trust userId supplied by UI.
export class OperatorSession {
  async current(_options = {}) { throw new Error('Accesso non disponibile.'); }
  async login(_email, _password) { throw new Error('Accesso non disponibile.'); }
  async logout() { throw new Error('Accesso non disponibile.'); }
  async recoverPassword(_email) { throw new Error('Recupero password non disponibile.'); }
  async changePassword(_password) { throw new Error('Cambio password non disponibile.'); }
}
