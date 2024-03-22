import { createGitHub as createDefaultGitHub } from "./github-utils";
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
        github: await resolveConfig(config?.github, createDefaultGitHub),
        noRefreshSeconds: config?.noRefreshSeconds || 3600,
        resolved: true,
      };
};
