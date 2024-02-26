"use strict";

export const createCache = () => ({
  set: async (path, data) => {
    return Promise.resolve({});
  },
  get: async (path) => {
    return Promise.resolve({});
  },
});
