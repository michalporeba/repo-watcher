"use strict";

import { CacheBase } from "./base";

export class InMemoryCache extends CacheBase {
  cache = {};

  constructor() {
    super();
  }

  clear() {
    this.cache = {};
  }
  async set(key, value) {
    this.cache[key] = value;
  }
  async get(key) {
    return Promise.resolve(this.cache[key]);
  }
}
