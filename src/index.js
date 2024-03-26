"use strict";

import { resolveDefaultsFor } from "./config";
import { AccountState } from "./cache/account-state";
import { RunState } from "./cache/run-state";
import { KnownAccounts } from "./cache/known-accounts";

export const fetchRepositories = async (config, accounts) => {
  const { cache } = await resolveDefaultsFor(config);
  const run = await RunState.retrievOrCreate(cache, accounts);
  let error = null;

  while (!error && run.hasTasks()) {
    const { action, params } = run.tasks.shift();
    try {
      if (action == "reviewRepositories") {
        await reviewAccountRepositories(config, run, params);
        run.accounts += 1;
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
      run.addTask(action, params);
      error = err;
      break;
    }
  }

  await run.saveTo(cache);

  return {
    last: run,
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

const reviewAccountRepositories = async function (config, run, params) {
  const { cache } = config;
  const knownAccounts = await KnownAccounts.getFrom(cache);
  const account = await AccountState.getFrom(cache, params);
  const repositories = fetchAccountRepositories(config, params);
  const filteredRepositories = filterRepositories(repositories, params);

  for await (const repository of filteredRepositories) {
    account.addRepository(repository.name);
    const path = account.getRepositoryDataPath(repository.name);
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
  await knownAccounts.saveTo(cache);
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
