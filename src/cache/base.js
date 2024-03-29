"use strict";

export class CacheBase {
  constructor() {
    this.staged = null;
  }
  // istanbul ignore next
  async set(_key, _value) {
    return rejectCallTo("set");
  }

  // istanbul ignore next
  async get(_key) {
    return rejectCallTo("get");
  }

  // istanbul ignore next
  async update(_key, _value) {
    return rejectCallTo("update");
  }

  // istanbul ignore next
  async remove(_key) {
    return rejectCallTo("remove");
  }

  async peek(key) {
    if (!this.#hasStaged(key)) {
      await this.stage(key, await this.get(key));
    }
    return this.staged?.value;
  }

  async stage(key, value) {
    if (!this.#hasStaged(key)) {
      await this.flush();
    }
    this.staged = {
      key,
      value,
    };
  }

  async flush() {
    if (!this.staged) {
      return;
    }

    await this.set(this.staged.key, this.staged.value);
    this.staged = null;
  }

  #hasStaged(key) {
    return this.staged?.key == key;
  }
}

const rejectCallTo = (name) => {
  return Promise.reject(
    new Error(
      `The ${name} is not implemented! Use a specialised class instance.`,
    ),
  );
};
