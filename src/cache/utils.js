"use strict";

import { FileSystemCache } from "./file-system";
import { InMemoryCache } from "./in-memory";
import { NoopCache } from "./no-op";

const cacheFactories = {
  fs: FileSystemCache,
  noop: NoopCache,
  mem: InMemoryCache,
};

export const createCache = async (config = {}) => {
  const { type = "fs" } = config;
  const CacheClass = cacheFactories[type];

  if (CacheClass) {
    return new CacheClass(config);
  }

  return Promise.reject(new Error(`Unknown cache type: ${type}!`));
};
