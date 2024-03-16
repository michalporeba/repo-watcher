"use strict";

import { resolveDefaultsFor } from "./config";
import { streamRepositoriesFromGitHubAccount } from "./github";
import { AccountState } from "./cache/account-state";

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
    const accountState = new AccountState("github", account.name);
    await accountState.loadFrom(cache);

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

    await accountState.saveTo(cache);
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
