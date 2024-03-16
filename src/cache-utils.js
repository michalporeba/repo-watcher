"use strict";

import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import pathtools from "path";
import { CacheBase } from "./cache-base";

export const createCache = async (config = {}) => {
  const { type = "fs" } = config;

  switch (type) {
    case "fs":
      return Promise.resolve(new FileSystemCache(config));
    case "noop":
      return Promise.resolve(new NoopCache());
    case "mem":
      return Promise.resolve(globalInMemoryCache);
    default:
      return Promise.reject(new Error(`Unknown cache type: ${type}!`));
  }
};

// istanbul ignore next - it's just a no-operation implementation
export class NoopCache extends CacheBase {
  async set(key, value) {}
  async get(key) {
    return null;
  }
  async update(key, value) {}
  async remove(key) {}
}

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

const globalInMemoryCache = new InMemoryCache();

export class FileSystemCache extends CacheBase {
  #cacheRootPath;

  constructor(config) {
    super();
    this.#cacheRootPath = config?.path ?? "cache";
  }

  #toFolderAndFile(base, path) {
    const fullPath = pathtools.join(base, path);
    return {
      fullPath: fullPath,
      folder: pathtools.dirname(fullPath),
      filename: pathtools.basename(fullPath),
    };
  }

  async #ensureFolderExists(path) {
    await mkdir(path, { recursive: true });
  }

  async set(key, value) {
    const { fullPath, folder } = this.#toFolderAndFile(
      this.#cacheRootPath,
      `${key}.json`,
    );
    await this.#ensureFolderExists(folder);
    const data = JSON.stringify(value, null, 2);
    await writeFile(fullPath, data);
  }

  async get(key) {
    try {
      const { fullPath } = this.#toFolderAndFile(
        this.#cacheRootPath,
        `${key}.json`,
      );
      return JSON.parse(await readFile(fullPath, "utf8"));
    } catch {
      // if file cannot be open, the value probably doesn't exist
      return undefined;
    }
  }

  async remove(key) {
    try {
      const { fullPath } = this.#toFolderAndFile(
        this.#cacheRootPath,
        `${key}.json`,
      );
      await unlink(fullPath);
    } catch {
      // most likely the file doesn't exist, so that's OK
    }
  }

  async update(key, value) {
    const data = await this.get(key);
    await this.set(key, { ...data, ...value });
  }
}
