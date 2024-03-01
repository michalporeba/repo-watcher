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
  let status = {
    discovered: 0,
    collected: 0,
    remaining: 0,
  };

  for (const account of accounts) {
    const repositories = streamRepositoriesFromGitHubAccount(account, octokit);
    for await (const repository of repositories) {
      status.discovered += 1;
      status.collected += 1;
      yield repository;
    }
  }

  await cache.set("status", { repositories: status });
};

export const getState = async (config = {}) => {
  const { cache } = await resolveDefaultsFor(config);
  return await cache.get("status");
};
