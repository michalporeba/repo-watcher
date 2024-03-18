"use strict";

export class AccountState {
  constructor(service, account) {
    this.account = account;
    this.path = AccountState.#accountPath(service, account);
    this.timestamp = 0;
    this.repositories = {};
  }

  isInNoRefreshPeriod(noRefreshSeconds) {
    return this.timestamp + noRefreshSeconds >= Date.now() / 1000;
  }

  addRepo(repoName) {
    const path = `github/${this.account}/${repoName}`;
    this.repositories[repoName] = {
      timestamp: Math.floor(Date.now() / 1000),
      path,
    };

    return path;
  }

  countRepositories() {
    return Object.keys(this.repositories).length;
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

  static #accountPath(service, account) {
    return `${service}/${account}.state`;
  }
}
