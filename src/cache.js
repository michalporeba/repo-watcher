"use strict";

export class RepoCache {
  async set(key, value) {
    return Promise.reject(
      new Error("set is not implemented! Use a specialised class instance."),
    );
  }

  async get(key) {
    return Promise.reject(
      new Error("get is not implemented! Use a specialised class instance."),
    );
  }

  async update(key, value) {
    return Promise.reject(
      new Error("update is not implemented! Use a specialised class instance."),
    );
  }

  async remove(key) {
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
}
