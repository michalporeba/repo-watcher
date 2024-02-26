"use strict";

const globalMockCache = {
  cache: {},
  clear: () => {
    globalMockCache.cache = {};
  },
  set: async (path, data) => {
    globalMockCache.cache[path] = data;
  },
  get: async (path) => {
    return Promise.resolve(globalMockCache.cache[path]);
  },
};

export const createMockCache = () => globalMockCache;
