import {
  createOctokit as createDefaultOctokit,
  createGitHub as createDefaultGitHub,
} from "./github-utils";
import { createCache as createDefaultCache } from "./cache/utils";

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
  return config?.resolved
    ? config
    : {
        cache: await resolveConfig(config?.cache, createDefaultCache),
        octokit: await resolveConfig(config?.octokit, createDefaultOctokit),
        github: await resolveConfig(config?.github, createDefaultGitHub),
        noRefreshTime: config?.noRefreshTime || 3600,
        resolved: true,
      };
};
