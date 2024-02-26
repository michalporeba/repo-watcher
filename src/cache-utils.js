"use strict";

import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import pathtools from "path";

export const createCache = async (config = {}) => {
  const { type = "fs" } = config;
  switch (type) {
    case "fs":
      return await createFileSystemCache(config);
    default:
      throw `Unknown cache type: ${type}`;
  }
};

const createFileSystemCache = async (config) => {
  const cacheRootPath = config?.path || "cache";

  const ensureFolderExists = async (path) => {
    try {
      await mkdir(path, { recursive: true });
    } catch (error) {
      console.error(`Error creating folder ${path}:`, error);
    }
  };

  const setValueAtKey = async (key, value) => {
    await ensureFolderExists(cacheRootPath);
    const data = JSON.stringify(value, null, 2);
    const file = pathtools.join(cacheRootPath, `${key}.json`);
    await writeFile(file, data);
  };

  const getValueFromKey = async (key) => {
    await ensureFolderExists(cacheRootPath);
    const file = pathtools.join(cacheRootPath, `${key}.json`);
    try {
      return JSON.parse(await readFile(file, "utf8"));
    } catch {
      // if file cannot be open, the value probably doesn't exist
      return undefined;
    }
  };

  const removeKey = async (key) => {
    await ensureFolderExists(cacheRootPath);
    const file = pathtools.join(cacheRootPath, `${key}.json`);
    await unlink(file);
  };

  const updateKey = async (key, value) => {
    const data = await getValueFromKey(key);
    await setValueAtKey(key, { ...data, ...value });
  };

  return Promise.resolve({
    set: setValueAtKey,
    get: getValueFromKey,
    remove: removeKey,
    update: updateKey,
  });
};
