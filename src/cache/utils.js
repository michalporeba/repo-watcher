"use strict";

import { FileSystemCache } from "./file-system";
import { InMemoryCache } from "./in-memory";
import { NoopCache } from "./no-op";

export const createCache = async (config = {}) => {
  const { type = "fs" } = config;
  switch (type) {
    case "fs":
      return Promise.resolve(new FileSystemCache(config));
    case "noop":
      return Promise.resolve(new NoopCache());
    case "mem":
      return Promise.resolve(new InMemoryCache());
    default:
      return Promise.reject(new Error(`Unknown cache type: ${type}!`));
  }
};
