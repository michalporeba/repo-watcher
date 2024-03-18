"use strict";

import { resolveDefaultsFor } from "./config";
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
  const { cache, github } = await resolveDefaultsFor(config);
  let status = createDefaultRunStatus();

  for (const account of accounts) {
    const accountState = await getAccountState("github", account.name, cache);
    const inNoRefreshTime = accountState.isInNoRefreshPeriod(
      config.noRefreshTime,
    );

    if (inNoRefreshTime) {
      yield* processLocally(account, accountState, cache);
    } else {
      yield* processFromGitHub(account, accountState, cache, github);
      status.discovered += accountState.countRepositories();
      status.collected += accountState.countRepositories();
    }

    await accountState.saveTo(cache);
  }

  await cache.setProcessState({ repositories: status });
};

const filterRepositories = async function* (repositories, { include }) {
  for await (const repository of repositories) {
    if (!include || include.includes(repository.name)) {
      yield repository;
    }
  }
};

const processLocally = async function* (accountConfig, accountState, cache) {
  const repositories = accountState.streamRepositoriesFrom(cache);
  yield* filterRepositories(repositories, accountConfig);
};

const processFromGitHub = async function* (
  accountConfig,
  accountState,
  cache,
  github,
) {
  const repositories = github.streamRepositories(accountConfig);
  const filteredRepositories = filterRepositories(repositories, accountConfig);

  for await (const repository of filteredRepositories) {
    const repoPath = accountState.addRepo(repository.name);
    await cache.set(repoPath, repository);

    yield repository;
  }
};

const getAccountState = async (service, account, cache) => {
  const state = new AccountState(service, account);
  await state.loadFrom(cache);
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
