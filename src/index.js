"use strict";

import { resolveDefaultsFor } from "./config";
import { AccountState } from "./cache/account-state";
import { RunState } from "./cache/run-state";
import { KnownAccounts } from "./cache/known-accounts";

export const fetchRepositories = async (config, accounts) => {
  const { cache } = await resolveDefaultsFor(config);
  const runState = new RunState();
  const knownAccounts = await KnownAccounts.getFrom(cache);

  for (const account of accounts) {
    try {
      const repositories = fetchAccountRepositories(config, account);
      const filteredRepositories = filterRepositories(repositories, account);
      const accountState = await AccountState.getFrom(cache, account);

      for await (const repo of filteredRepositories) {
        const repoPath = accountState.addRepo(repo.name);
        await cache.set(repoPath, repo);
        runState.repositories += 1;
      }

      await accountState.saveTo(cache);
      knownAccounts.register(accountState);
      runState.accounts += 1;
    } catch (err) {
      return {
        last: runState,
        error: err,
      };
    }

    await knownAccounts.saveTo(cache);
  }
  return {
    last: runState,
  };
};

export const getRepositories = async (config) => {
  const repositories = [];

  for await (const repository of streamRepositories(config)) {
    repositories.push(repository);
  }

  return repositories;
};

export const streamRepositories = async function* (config, query = {}) {
  const { cache } = await resolveDefaultsFor(config);
  const knownAccounts = await KnownAccounts.getFrom(cache);

  for await (const accountPath of knownAccounts.streamLocations(query)) {
    const accountState = await AccountState.getFromPath(cache, accountPath);
    for await (const repository of accountState.streamRepositoriesFrom(cache)) {
      yield repository;
    }
  }
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
