import { createOctokit as createDefaultOctokit } from "./github-utils";
import { createCache as createDefaultCache } from "./cache-utils";

const resolveConfig = async (config, factory) => {
  if (typeof config === "function") {
    return await config();
  }
  if (typeof config?.create === "function") {
    return await config.create(config);
  }
  return await factory(config);
};

export const resolveDefaultsFor = async (config) => {
  return {
    cache: await resolveConfig(config?.cache, createDefaultCache),
    octokit: await createDefaultOctokit(),
  };
};
