"use strict";

import { resolveDefaultsFor } from "./config";
import { AccountState } from "./cache/account-state";
import { ProcessState } from "./cache/process-state";

export const getRepositories = async (accounts, config) => {
  const { cache } = await resolveDefaultsFor(config);
  const repositories = [];

  for await (const repository of streamRepositories(accounts, config)) {
    repositories.push(repository);
  }

  return {
    data: repositories,
    state: await ProcessState.getFrom(cache),
  };
};

export const streamRepositories = async function* (accounts, config = {}) {
  const { cache, github } = await resolveDefaultsFor(config);
  const state = new ProcessState();

  for (const account of accounts) {
    const accountState = await getAccountState("github", account.name, cache);
    const inNoRefreshTime = accountState.isInNoRefreshPeriod(
      config.noRefreshSeconds,
    );

    if (inNoRefreshTime) {
      yield* processLocally(account, accountState, cache);
    } else {
      yield* processFromGitHub(account, accountState, cache, github);
      state.repositories.discovered += accountState.countRepositories();
      state.repositories.collected += accountState.countRepositories();
    }

    await accountState.saveTo(cache);
  }

  await state.saveTo(cache);
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
