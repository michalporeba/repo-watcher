"use strict";

export class CacheBase {
  async set(_key, _value) {
    return Promise.reject(
      new Error("set is not implemented! Use a specialised class instance."),
    );
  }

  async get(_key) {
    return Promise.reject(
      new Error("get is not implemented! Use a specialised class instance."),
    );
  }

  async update(_key, _value) {
    return Promise.reject(
      new Error("update is not implemented! Use a specialised class instance."),
    );
  }

  async remove(_key) {
    return Promise.reject(
      new Error("remove is not implemented! Use a specialised class instance."),
    );
  }

  streamRepositoriesFromCache = async function* (account) {
    for (const r in account?.repositories) {
      yield this.get(account.repositories[r].path);
    }
  };

  async getProcessState() {
    return await this.get("process.state");
  }

  async setProcessState(value) {
    await this.set("process.state", value);
  }

  async getAccount(service, account) {
    const data = await this.get(this.#accountPath(service, account));
    if (data) {
      return Account.rehydrate(data);
    }
    return new Account(this.#accountPath(service, account));
  }

  async setAccount(account) {
    await this.set(account.path, account);
  }

  #accountPath(service, account) {
    return `${service}/${account}.state`;
  }
}

class Account {
  constructor(path = "") {
    this.path = path;
    this.timestamp = 0;
    this.repositories = {};
  }

  static rehydrate(data) {
    let account = new Account();
    Object.assign(account, data);
    return account;
  }

  isInNoRefreshPeriod(noRefreshSeconds) {
    return this.timestamp + noRefreshSeconds > Date.now() / 1000;
  }
}
