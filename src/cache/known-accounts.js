export class KnownAccounts {
  static #PATH = "accounts";

  constructor() {
    this.timestamp = 0;
    this.services = {};
  }

  async register({ service, account, path }) {
    this.services[service] ||= {};
    this.services[service][account] = path;
  }

  async *streamLocations(query = {}) {
    for (const service of this.#streamServices(query)) {
      yield* this.#streamAccountPaths(service, query);
    }
  }

  async saveTo(cache) {
    this.timestamp = Math.floor(Date.now() / 1000);
    cache.set(KnownAccounts.#PATH, this);
  }

  static async getFrom(cache) {
    let state = new KnownAccounts();
    const data = await cache.get(KnownAccounts.#PATH);
    Object.assign(state, data);
    return state;
  }

  *#streamServices(query) {
    if (query?.service) {
      return this.services[query.service];
    }

    for (const service in this.services) {
      yield this.services[service];
    }
  }

  *#streamAccountPaths(service, query) {
    if (query?.account) {
      return service[query.account];
    }

    for (const account in service) {
      yield service[account];
    }
  }
}
