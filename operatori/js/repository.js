// UI depends on this asynchronous contract, never on IndexedDB or a future SDK.
export class OperatorRepository {
  async list(){throw Error('Not implemented');}
  async get(){throw Error('Not implemented');}
  async save(){throw Error('Not implemented');}
  async submit(){throw Error('Not implemented');}
  async review(){throw Error('Not implemented');}
  async queue(){throw Error('Not implemented');}
}
