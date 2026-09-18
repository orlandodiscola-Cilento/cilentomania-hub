// UI depends on this asynchronous contract, never on IndexedDB or a future SDK.
export class OperatorRepository {
  // context -> { user:{id,name,role}, organizations:[{id,name}] } scoped to session.
  async context(){throw Error('Not implemented');}
  // previewContext -> read-only territorial content and display flags, after authorization.
  async previewContext(){throw Error('Not implemented');}
  async list(){throw Error('Not implemented');}
  async get(){throw Error('Not implemented');}
  async save(){throw Error('Not implemented');}
  async submit(){throw Error('Not implemented');}
  async review(){throw Error('Not implemented');}
  async queue(){throw Error('Not implemented');}
  async compare(){throw Error('Confronto non ancora disponibile.');}
  async publish(){throw Error('Pubblicazione non disponibile.');}
  async suspend(){throw Error('Sospensione non disponibile.');}
}
