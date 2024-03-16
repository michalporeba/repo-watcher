"use strict";

export class AccountState {
  constructor(account = "", path = "") {
    this.account = account;
    this.path = path;
    this.timestamp = 0;
    this.repositories = {};
  }

  static rehydrate(data) {
    let account = new AccountState();
    Object.assign(account, data);
    return account;
  }

  isInNoRefreshPeriod(noRefreshSeconds) {
    return this.timestamp + noRefreshSeconds > Date.now() / 1000;
  }

  addRepo(repoName) {
    const path = `github/${this.account}/${repoName}`;
    this.repositories[repoName] = {
      timestamp: Math.floor(Date.now() / 1000),
      path,
    };

    return path;
  }
}
