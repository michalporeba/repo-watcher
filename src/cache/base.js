"use strict";

export class CacheBase {
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
}
