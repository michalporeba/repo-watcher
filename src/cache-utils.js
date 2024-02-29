"use strict";

import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import pathtools from "path";

export const createCache = async (config = {}) => {
  const { type = "fs" } = config;

  switch (type) {
    case "fs":
      return Promise.resolve(new FileSystemRepoCache(config));
    default:
      throw `Unknown cache type: ${type}`;
  }
};

export class FileSystemRepoCache {
  #cacheRootPath;

  constructor(config) {
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
      const { fullPath } = this.#toFolderAndFile(cacheRootPath, `${key}.json`);
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
