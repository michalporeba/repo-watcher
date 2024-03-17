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
    const accountState = await getAccountState("github", account.name, cache);
    const inNoRefreshTime = accountState.isInNoRefreshPeriod(
      config.noRefreshTime,
    );

    const repositories = inNoRefreshTime
      ? accountState.streamRepositoriesFrom(cache)
      : streamRepositoriesFromGitHubAccount(account, octokit);

    if (inNoRefreshTime) {
      yield* processLocally(repositories);
    } else {
      yield* processRemotely(repositories, accountState, cache);
      status.discovered += accountState.countRepositories();
      status.collected += accountState.countRepositories();
    }

    await accountState.saveTo(cache);
  }

  await cache.setProcessState({ repositories: status });
};

const processLocally = async function* (repositories) {
  yield* repositories;
};

const processRemotely = async function* (repositories, accountState, cache) {
  for await (const repository of repositories) {
    const repoPath = accountState.addRepo(repository.name);
    await cache.set(repoPath, repository);

    yield repository;
  }
};

const processRepositories = async function* (repositories) {
  for await (const r of repositories) {
  }
};

const getAccountState = async (service, account, cache) => {
  const state = new AccountState(service, account);
  await state.loadFrom(cache);
  console.log(state);
  return state;
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
