import { createOctokit as createDefaultOctokit } from "./github-utils";
import { createCache as createDefaultCache } from "./cache-utils";

const resolveConfig = async (config, factory) => {
  if (typeof config === "function") {
    return await config();
  }
  return factory(config);
};

export const resolveDefaultsFor = async (config) => {
  return {
    cache: await resolveConfig(config?.cache, createDefaultCache),
    octokit: await createDefaultOctokit(),
  };
};
