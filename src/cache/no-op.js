"use strict";
import { CacheBase } from "./base";

// istanbul ignore next - it's just a no-operation implementation
export class NoopCache extends CacheBase {
  async set(_key, _value) {}
  async get(_key) {
    return null;
  }
  async update(_key, _value) {}
  async remove(_key) {}
}
