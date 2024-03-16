"use strict";

export class AccountState {
  constructor(path = "") {
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
}
