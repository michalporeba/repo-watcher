"use strict";

import { resolveDefaultsFor } from "./config";
import { AccountState } from "./cache/account-state";
import { ProcessState } from "./cache/process-state";
import { RunState } from "./cache/run-state";
import { KnownAccounts } from "./cache/known-accounts";

export const fetchRepositories = async (config, accounts) => {
  const { cache } = await resolveDefaultsFor(config);
  const runState = new RunState();
  const knownAccounts = await KnownAccounts.getFrom(cache);

  for (const account of accounts) {
    try {
      const repositories = fetchAccountRepositories(account, config);
      const accountState = new AccountState(account.service, account.name);
      for await (const repo of repositories) {
        const repoPath = accountState.addRepo(repo.name);
        await cache.set(repoPath, repo);
        runState.repositories += 1;
      }
      await accountState.saveTo(cache);
      knownAccounts.register(accountState);
      runState.accounts += 1;
    } catch {
      return {
        last: runState,
      };
    }

    await knownAccounts.saveTo(cache);
  }
  return {
    last: runState,
  };
};

export const getRepositories = async (config) => {
  const { cache } = await resolveDefaultsFor(config);
  const repositories = [];

  for await (const repository of streamRepositories(config)) {
    repositories.push(repository);
  }

  return repositories;
};

export const streamRepositories = async function* (config) {
  const { cache } = await resolveDefaultsFor(config);
  const knownAccounts = await KnownAccounts.getFrom(cache);

  for await (const account of knownAccounts.stream()) {
    const accountState = await AccountState.getFrom(cache, account.path);
    for await (const repository of accountState.streamRepositoriesFrom(cache)) {
      yield repository;
    }
  }
};

const fetchAccountRepositories = async function* (account, config) {
  const fetcher = getRepositoryFetcher(account.service);
  yield* fetcher(account, config);
};

const getRepositoryFetcher = (service) => {
  if (service == "github") {
    return fetchGitHubRepositories;
  }
};

const fetchGitHubRepositories = async function* (account, config) {
  const { github } = await resolveDefaultsFor(config);
  yield* github.streamRepositories(account);
};

export const getRepositories1 = async (accounts, config) => {
  const { cache } = await resolveDefaultsFor(config);
  const repositories = [];

  for await (const repository of streamRepositories1(accounts, config)) {
    repositories.push(repository);
  }

  return {
    data: repositories,
    state: await ProcessState.getFrom(cache),
  };
};

export const streamRepositories1 = async function* (accounts, config) {
  const { cache, github } = await resolveDefaultsFor(config);
  const state = new ProcessState();

  for (const account of accounts) {
    const accountState = await getAccountState("github", account.name, cache);
    const inNoRefreshTime = accountState.isInNoRefreshPeriod(
      config.noRefreshSeconds,
    );

    if (inNoRefreshTime || (await github.getRemainingLimit()) < 10) {
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

export const githubUser = (name) => ({ service: "github", type: "user", name });
export const githubOrg = (name) => ({ service: "github", type: "org", name });

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

  for await (const repo of filteredRepositories) {
    if (!repo.times?.collected || repo.times.collected < repo.times.updated) {
      repo.languages = await github.getLanguages(repo.account, repo.name);
      repo.times.collected = new Date().toISOString();
      const repoPath = accountState.addRepo(repo.name);
      await cache.set(repoPath, repo);
    }

    yield repo;
  }
};

const getAccountState = async (service, account, cache) => {
  const state = new AccountState(service, account);
  await state.loadFrom(cache);
  return state;
};
