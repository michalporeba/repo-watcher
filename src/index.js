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
    let accountState = await cache.getAccount("github", account.name);

    const inNoRefreshTime = accountState.isInNoRefreshPeriod(
      config.noRefreshTime,
    );

    const repositories = inNoRefreshTime
      ? cache.streamRepositoriesFromCache(accountState)
      : streamRepositoriesFromGitHubAccount(account, octokit);

    for await (const r of repositories) {
      if (inNoRefreshTime) {
        yield r;
        continue;
      }

      const repoPath = accountState.addRepo(r.name);
      status.discovered += 1;
      status.collected += 1;
      await cache.set(repoPath, r);
      yield r;
    }

    await cache.setAccount(accountState);
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
