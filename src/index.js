"use strict";

import { resolveDefaultsFor } from "./config";
import { AccountState } from "./cache/account-state";
import { RunState } from "./cache/run-state";
import { KnownAccounts } from "./cache/known-accounts";

export const fetchRepositories = async (config, accounts) => {
  const { cache } = await resolveDefaultsFor(config);
  const runState = await RunState.retrievOrCreate(cache, accounts);
  let error = null;

  while (!error && runState.tasks.length) {
    const { action, params } = runState.tasks.shift();
    try {
      const accountState = await AccountState.getFrom(cache, params);

      if (action == "reviewRepositories") {
        await reviewAccountRepositories(config, runState, accountState, params);
        continue;
      }

      if (action == "getLanguages") {
        const repository = await cache.get(params.path);
        repository.languages = await config.github.getLanguages(
          repository.account,
          repository.name,
        );
        await cache.set(params.path, repository);
      }
    } catch (err) {
      runState.addTask(action, params);
      error = err;
      break;
    }
  }

  await runState.saveTo(cache);

  return {
    last: runState,
    error,
  };
};

export const getRepositories = async (config, query = {}) => {
  const repositories = [];

  for await (const repository of streamRepositories(config, query)) {
    repositories.push(repository);
  }

  return repositories;
};

export const streamRepositories = async function* (config, query) {
  const { cache } = await resolveDefaultsFor(config);
  const knownAccounts = await KnownAccounts.getFrom(cache);

  for await (const accountPath of knownAccounts.streamLocations(query)) {
    const accountState = await AccountState.getFromPath(cache, accountPath);
    for await (const repository of accountState.streamRepositoriesFrom(cache)) {
      yield repository;
    }
  }
};

const reviewAccountRepositories = async function (
  config,
  run,
  account,
  params,
) {
  const { cache } = config;
  const knownAccounts = await KnownAccounts.getFrom(cache);
  const repositories = fetchAccountRepositories(config, params);
  const filteredRepositories = filterRepositories(repositories, params);
  for await (const repository of filteredRepositories) {
    const path = account.addRepository(repository.name);
    await cache.set(path, repository);
    run.addTask("getLanguages", {
      ...params,
      repo: repository.name,
      path,
    });
    run.repositories += 1;
  }
  await account.saveTo(cache);
  knownAccounts.register(account);
  run.accounts += 1;
  knownAccounts.saveTo(cache);
};

const fetchAccountRepositories = async function* (config, account) {
  const fetcher = getRepositoryFetcher(account.service);
  yield* fetcher(config, account);
};

const getRepositoryFetcher = (service) => {
  if (service == "github") {
    return fetchGitHubRepositories;
  }
};

const fetchGitHubRepositories = async function* (config, account) {
  yield* config.github.streamRepositories(account);
};

export const githubUser = (name, extensions = {}) => {
  let data = { service: "github", type: "user", name };
  Object.assign(data, extensions);
  return data;
};

export const githubOrg = (name, extensions = {}) => {
  let data = { service: "github", type: "org", name };
  Object.assign(data, extensions);
  return data;
};

const filterRepositories = async function* (repositories, { include }) {
  for await (const repository of repositories) {
    if (!include || include.includes(repository.name)) {
      yield repository;
    }
  }
};
