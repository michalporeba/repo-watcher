"use strict";

import { createCache as createDefaultCache } from "./cache-utils";
import { createOctokit as createDefaultOctokit } from "./github-utils";
import { streamRepositoriesFromGitHubAccount } from "./github";

export const getRepositories = async (accounts, config) => {
  const repositories = [];

  for await (const repository of streamRepositories(accounts, config)) {
    repositories.push(repository);
  }

  return {
    data: repositories,
    state: await getState(config),
  };
};

export const streamRepositories = async function* (accounts, config = {}) {
  const {
    createOctokit = createDefaultOctokit,
    createCache = createDefaultCache,
  } = config;

  const octokit = await createOctokit();
  const cache = await createCache();

  for (const account of accounts) {
    yield* streamRepositoriesFromGitHubAccount(account, octokit);
  }

  await cache.set("status", {
    repositories: {
      discovered: 3,
      collected: 3,
      remaining: 0,
    },
  });
};

export const getState = async (config = {}) => {
  const { createCache = createDefaultCache } = config;
  const cache = await createCache();
  return await cache.get("status");
};
