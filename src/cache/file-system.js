"use strict";

import { CacheBase } from "./base";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import pathtools from "path";

export class FileSystemCache extends CacheBase {
  #cacheRootPath;

  constructor(config) {
    super();
    this.#cacheRootPath = config?.path ?? "cache";
  }

  #toFolderAndFile(path) {
    const fullPath = pathtools.join(this.#cacheRootPath, `${path}.json`);
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
    const { fullPath, folder } = this.#toFolderAndFile(key);
    await this.#ensureFolderExists(folder);
    const data = JSON.stringify(value, null, 2);
    await writeFile(fullPath, data);
  }

  async get(key) {
    try {
      const { fullPath } = this.#toFolderAndFile(key);
      const data = await readFile(fullPath, "utf8");
      return JSON.parse(data);
    } catch {
      // if file cannot be open, the value probably doesn't exist
      return undefined;
    }
  }

  async remove(key) {
    try {
      const { fullPath } = this.#toFolderAndFile(key);
      await unlink(fullPath);
    } catch {
      // most likely the file doesn't exist, so that's OK
    }
  }
}
