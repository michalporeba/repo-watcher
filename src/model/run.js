"use strict";

import crypto from "crypto";
import { KnownAccounts } from "../cache/known-accounts";
import { Account } from "./account";

export class Run {
  static #PATH = "current.run.state";

  constructor() {
    this.accounts = {
      total: 0,
      processed: 0,
      remaining: 0,
    };
    this.repositories = 0;
    this.apicalls = {
      github: 0,
    };
    this.tasks = [];
  }

  addTask(action, params) {
    this.tasks.unshift({ action, params });
  }

  hasTasks() {
    return this.tasks.length > 0;
  }

  *streamTasks() {
    yield* this.tasks;
  }

  async processTasks(config) {
    while (this.hasTasks()) {
      const { action, params } = this.tasks.shift();
      try {
        await getActionMethod(action)(config, this, params);
      } catch (err) {
        this.addTask(action, params);
        this.error = err.message;
        break;
      }
    }
  }

  static #hash(object) {
    const data = JSON.stringify(object, null, 2);
    return crypto.createHash("md5").update(data).digest("hex");
  }

  async saveTo(cache) {
    this.timestamp = Math.floor(Date.now() / 1000);
    await cache.set(Run.#PATH, this);
  }

  async retrievOrCreate(cache, accounts) {
    const hash = Run.#hash(accounts);
    const state = await Run.getFrom(cache);

    if (state.hash != hash && state.tasks.length == 0) {
      state.accounts.total = 0;
      for (const account of accounts) {
        state.accounts.total += 1;
        state.accounts.remaining += 1;
        state.addTask("reviewRepositories", account);
      }
      await state.saveTo(cache);
    }

    return Object.assign(this, state);
  }

  static async getFrom(cache) {
    let state = new Run();
    const data = await cache.get(Run.#PATH);
    Object.assign(state, data);
    return state;
  }
}

const getActionMethod = (action) => {
  return {
    reviewRepositories: reviewAccountRepositories,
    addLanguages: addRepositoryLanguages,
    addWorkflows: addRepositoryWorkflows,
  }[action];
};

const reviewAccountRepositories = async function (config, run, params) {
  const { cache } = config;
  const knownAccounts = await KnownAccounts.getFrom(cache);
  const account = await Account.getFrom(cache, params);
  const repositories = fetchAccountRepositories(config, params);
  const filteredRepositories = filterRepositories(repositories, params);

  for await (const repository of filteredRepositories) {
    account.addRepository(repository.name);
    const path = account.getRepositoryDataPath(repository.name);
    await cache.set(path, repository);
    const repoParams = {
      ...params,
      repo: repository.name,
      path,
    };
    run.addTask("addWorkflows", repoParams);
    run.addTask("addLanguages", repoParams);
    run.repositories += 1;
  }
  run.accounts.processed += 1;
  run.accounts.remaining -= 1;

  await account.saveTo(cache);
  knownAccounts.register(account);
  await knownAccounts.saveTo(cache);
};

const addRepositoryLanguages = async (config, _run, params) => {
  const repository = await config.cache.peek(params.path);
  repository.languages = await config.github.getLanguages(
    repository.account,
    repository.name,
  );
  await config.cache.stage(params.path, repository);
};

const addRepositoryWorkflows = async (config, _run, params) => {
  const repository = await config.cache.peek(params.path);
  repository.workflows = await config.github.getWorkflows(
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
