"use strict";

import { resolveDefaultsFor } from "./config";
import { AccountState } from "./cache/account-state";
import { RunState } from "./cache/run-state";
import { KnownAccounts } from "./cache/known-accounts";

export const fetchRepositories = async (rawConfig, accounts) => {
  const config = await resolveDefaultsFor(rawConfig);
  const run = await RunState.retrievOrCreate(config.cache, accounts);
  const lastError = await processRunTasks(config, run);

  await config.cache.flush();
  await run.saveTo(config.cache);

  return {
    last: run,
    error: lastError,
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
    yield* accountState.streamRepositoriesFrom(cache);
  }
};

const getActionMethod = (action) => {
  return {
    reviewRepositories: reviewAccountRepositories,
    addLanguages: addRepositoryLanguages,
  }[action];
};

const processRunTasks = async (config, run) => {
  while (run.hasTasks()) {
    const { action, params } = run.tasks.shift();
    try {
      await getActionMethod(action)(config, run, params);
    } catch (err) {
      run.addTask(action, params);
      return err.message;
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
    run.addTask("addLanguages", {
      ...params,
      repo: repository.name,
      path,
    });
    run.repositories += 1;
  }
  run.accounts += 1;

  await account.saveTo(cache);
  knownAccounts.register(account);
  await knownAccounts.saveTo(cache);
};

const addRepositoryLanguages = async (config, run, params) => {
  const repository = await config.cache.peek(params.path);
  repository.languages = await config.github.getLanguages(
    repository.account,
    repository.name,
  );
  await config.cache.stage(params.path, repository);
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

const filterRepositories = async function* (repositories, { include }) {
  for await (const repository of repositories) {
    if (!include || include.includes(repository.name)) {
      yield repository;
    }
  }
};
