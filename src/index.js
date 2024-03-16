"use strict";

import { resolveDefaultsFor } from "./config";
import { streamRepositoriesFromGitHubAccount } from "./github";

export const getRepositories = async (accounts, config) => {
  const { cache } = await resolveDefaultsFor(config);
  const repositories = [];

  for await (const repository of streamRepositories(accounts, config)) {
    repositories.push(repository);
  }

  return {
    data: repositories,
    state: await cache.getProcessState(),
  };
};

export const streamRepositories = async function* (accounts, config = {}) {
  const { cache, octokit } = await resolveDefaultsFor(config);
  let status = createDefaultRunStatus();

  for (const account of accounts) {
    const accountSummaryPath = `github/${account.name}.state`;
    let accountState = await cache.getAccount("github", account.name);

    const inNoRefreshTime =
      accountState?.timestamp + config.noRefreshTime > Date.now() / 1000;

    const repositories = inNoRefreshTime
      ? cache.streamRepositoriesFromCache(accountState)
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

      accountState.repositories[r.name] = repoSummary;
      status.discovered += 1;
      status.collected += 1;
      await cache.set(repoSummary.path, r);
      yield r;
    }
    accountState.timestamp = Math.floor(Date.now() / 1000);
    await cache.set(accountSummaryPath, accountState);
  }

  await cache.setProcessState({ repositories: status });
};

export const getState = async (config) => {
  const { cache } = await resolveDefaultsFor(config);
  return await cache.getProcessState();
};

const createDefaultRunStatus = () => ({
  discovered: 0,
  collected: 0,
  remaining: 0,
});
