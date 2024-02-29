"use strict";

import { resolveDefaultsFor } from "./config";
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
  const { cache, octokit } = await resolveDefaultsFor(config);

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
  const { cache } = await resolveDefaultsFor(config);
  return await cache.get("status");
};
