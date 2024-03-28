"use strict";

export class CacheBase {
  constructor() {
    this.staged = null;
  }
  // istanbul ignore next
  async set(_key, _value) {
    return Promise.reject(
      new Error("set is not implemented! Use a specialised class instance."),
    );
  }

  // istanbul ignore next
  async get(_key) {
    return Promise.reject(
      new Error("get is not implemented! Use a specialised class instance."),
    );
  }

  // istanbul ignore next
  async update(_key, _value) {
    return Promise.reject(
      new Error("update is not implemented! Use a specialised class instance."),
    );
  }

  // istanbul ignore next
  async remove(_key) {
    return Promise.reject(
      new Error("remove is not implemented! Use a specialised class instance."),
    );
  }

  async peek(key) {
    if (!this.staged?.key || this.staged?.key != key) {
      await this.stage(key, await this.get(key));
    }
    return this.staged?.value;
  }

  async stage(key, value) {
    if (this.staged?.key && this?.staged.key != key) {
      await this.flush();
    }
    this.staged = {
      key,
      value,
    };
  }

  async flush() {
    if (this.staged) {
      await this.set(this.staged.key, this.staged.value);
      this.staged = null;
    }
  }
}
