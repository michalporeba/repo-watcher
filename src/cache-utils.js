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

const toFolderAndFile = (base, path) => {
  const fullPath = pathtools.join(base, path);
  return {
    fullPath: fullPath,
    folder: pathtools.dirname(fullPath),
    filename: pathtools.basename(fullPath),
  };
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
    const { fullPath, folder } = toFolderAndFile(cacheRootPath, `${key}.json`);
    await ensureFolderExists(folder);
    const data = JSON.stringify(value, null, 2);
    await writeFile(fullPath, data);
  };

  const getValueFromKey = async (key) => {
    const { fullPath, folder } = toFolderAndFile(cacheRootPath, `${key}.json`);
    await ensureFolderExists(folder);
    try {
      return JSON.parse(await readFile(fullPath, "utf8"));
    } catch {
      // if file cannot be open, the value probably doesn't exist
      return undefined;
    }
  };

  const removeKey = async (key) => {
    const { fullPath, folder } = toFolderAndFile(cacheRootPath, `${key}.json`);
    await ensureFolderExists(folder);
    try {
      await unlink(fullPath);
    } catch {
      // most likely the file doesn't exist, so that's OK
    }
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
