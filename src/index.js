"use strict";

import { resolveDefaultsFor } from "./config";
import { AccountState } from "./cache/account-state";
import { RunState } from "./cache/run-state";
import { KnownAccounts } from "./cache/known-accounts";

export const fetchRepositories = async (config, accounts) => {
  const { cache } = await resolveDefaultsFor(config);
  const runState = await RunState.retrievOrCreate(cache, accounts);
  await runState.saveTo(cache);
  const knownAccounts = await KnownAccounts.getFrom(cache);

  try {
    while (runState.tasks.length) {
      const { action, params } = runState.tasks[0];
      const accountState = await AccountState.getFrom(cache, params);

      if (action == "reviewRepositories") {
        const repositories = fetchAccountRepositories(config, params);
        const filteredRepositories = filterRepositories(repositories, params);
        for await (const repository of filteredRepositories) {
          const path = accountState.addRepository(repository.name);
          await cache.set(path, repository);
          runState.addTask("getLanguages", {
            ...params,
            repo: repository.name,
            path,
          });
          runState.repositories += 1;
        }
        await accountState.saveTo(cache);
        knownAccounts.register(accountState);
        runState.accounts += 1;
        runState.tasks.shift();
        await runState.saveTo(cache);
        continue;
      }

      const repository = await cache.get(params.path);
      if (action == "getLanguages") {
        repository.languages = await config.github.getLanguages(
          repository.account,
          repository.name,
        );
        await cache.set(params.path, repository);
      }
      runState.tasks.shift();
    }
  } catch (err) {
    runState.saveTo(cache);
    await knownAccounts.saveTo(cache);
    return {
      last: runState,
      error: err,
    };
  }

  await knownAccounts.saveTo(cache);

  return {
    last: runState,
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

const reviewAccountRepositories = async function* () {
  //
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
  const { github } = await resolveDefaultsFor(config);
  yield* github.streamRepositories(account);
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
