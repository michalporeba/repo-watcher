export class KnownAccounts {
  static #PATH = "accounts";

  constructor() {
    this.services = {};
  }

  async register({ service, account, path }) {
    this.services[service] ||= {};
    this.services[service][account] = path;
  }

  async *stream() {
    for (const service in this.services) {
      for (const account in this.services[service]) {
        yield { service, account, path: this.services[service][account] };
      }
    }
  }

  async saveTo(cache) {
    cache.set(KnownAccounts.#PATH, this);
  }

  static async getFrom(cache) {
    let state = new KnownAccounts();
    const data = await cache.get(KnownAccounts.#PATH);
    Object.assign(state, data);
    return state;
  }
}
