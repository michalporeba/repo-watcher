"use strict";

import { resolveDefaultsFor } from "./config";
import { streamRepositoriesFromGitHubAccount } from "./github";
import { streamRepositoriesFromCache } from "./cache";

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
    const accountSummaryPath = `github/${account.name}.state`;
    let accountSummary = (await cache.get(accountSummaryPath)) || {
      timestamp: 0,
      repositories: {},
    };

    const inNoRefreshTime =
      accountSummary?.timestamp + config.noRefreshTime > Date.now() / 1000;

    const repositories = inNoRefreshTime
      ? streamRepositoriesFromCache(accountSummary, cache)
      : streamRepositoriesFromGitHubAccount(account, octokit);

    for await (const r of repositories) {
      if (inNoRefreshTime) {
        yield r;
        continue;
      }

      const repoSummary = {
        timestamp: Math.floor(Date.now() / 1000),
        path: `github/${account.name}/${r.name}`,
      };

      accountSummary.repositories[r.name] = repoSummary;
      status.discovered += 1;
      status.collected += 1;
      await cache.set(repoSummary.path, r);
      yield r;
    }
    accountSummary.timestamp = Math.floor(Date.now() / 1000);
    await cache.set(accountSummaryPath, accountSummary);
  }

  await cache.set("status", { repositories: status });
};

export const getState = async (config = {}) => {
  const { cache } = await resolveDefaultsFor(config);
  return await cache.get("status");
};
