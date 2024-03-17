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

  async getProcessState() {
    return await this.get("process.state");
  }

  async setProcessState(value) {
    await this.set("process.state", value);
  }
}
