"use strict";

export class AccountState {
  static #LIST_KEY = "accounts.json";

  constructor(service, account) {
    this.service = service;
    this.account = account;
    this.path = AccountState.#accountPath(service, account);
    this.timestamp = 0;
    this.repositories = {};
  }

  addRepository(name) {
    const path = AccountState.#repoPath(this.service, this.account, name);
    this.repositories[name] = {
      timestamp: Math.floor(Date.now() / 1000),
      path,
      versions: {
        first: Math.floor(Date.now() / 1000),
        current: Math.floor(Date.now() / 1000),
        latest: Math.floor(Date.now() / 1000),
      },
    };

    return path;
  }

  getRepository(name) {
    return this.repositories[name];
  }

  streamRepositoriesFrom = async function* (cache) {
    for (const repository in this?.repositories) {
      yield cache.get(this.repositories[repository].path);
    }
  };

  async saveTo(cache) {
    this.timestamp = Math.floor(Date.now() / 1000);
    await cache.set(this.path, this);
  }

  async loadFrom(cache) {
    const data = await cache.get(this.path);
    if (data) {
      Object.assign(this, data);
    }
  }

  static async getFrom(cache, { service, name }) {
    const state = new AccountState(service, name);
    await state.loadFrom(cache);
    return state;
  }

  static async getFromPath(cache, path) {
    const state = new AccountState();
    const data = await cache.get(path);
    Object.assign(state, data);
    return state;
  }

  static #accountPath(service, account) {
    return `${service}/${account}.state`;
  }

  static #repoPath(service, account, repo) {
    return `${service}/${account}/${repo}`;
  }
}
