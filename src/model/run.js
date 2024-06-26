"use strict";

import crypto from "crypto";
import { KnownAccounts } from "../cache/known-accounts";
import { Account } from "./account";
import { RunState } from "./run-state";

export class Run {
  state = new RunState();

  constructor(config) {
    this.config = config;
  }

  addTask(action, params) {
    this.state.addTask({ action, params });
  }

  async processTasks() {
    while (this.state.hasTasks()) {
      try {
        const { action, params } = this.state.nextTask();
        await this.#getActionMethod(action)(this.config, this.state, params);
      } catch (error) {
        this.state.undoLastTask(error.message);
        break;
      }
    }
  }

  static #hash(object) {
    const data = JSON.stringify(object, null, 2);
    return crypto.createHash("md5").update(data).digest("hex");
  }

  async save() {
    await this.config.cache.flush();
    await this.state.saveTo(this.config.cache);
  }

  async loadOrCreateState(accounts) {
    const hash = Run.#hash(accounts);
    let state = await RunState.getFrom(this.config.cache);

    if (state.hash != hash && !state.hasTasks()) {
      state = this.#createNewRunFor(accounts);
      await state.saveTo(this.config.cache);
    }

    this.state = state;
  }

  #createNewRunFor = (accounts) => {
    const state = new RunState();
    state.hash = Run.#hash(accounts);

    for (const account of accounts) {
      state.addAccount("reviewAccount", account);
    }

    return state;
  };

  #getActionMethod = (action) => {
    return {
      reviewAccount: this.reviewAccount,
      addLanguages: this.addRepositoryLanguages,
      addWorkflows: this.addRepositoryWorkflows,
    }[action];
  };

  reviewAccount = async function (config, runstate, params) {
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
      runstate.addTask({ action: "addWorkflows", params: repoParams });
      runstate.addTask({ action: "addLanguages", params: repoParams });
      runstate.processedRepository();
    }
    runstate.processedAccount();

    await account.saveTo(cache);
    knownAccounts.register(account);
    await knownAccounts.saveTo(cache);
  };

  addRepositoryLanguages = async (config, _run, params) => {
    const repository = await config.cache.peek(params.path);
    repository.languages = await config.github.getLanguages(
      repository.account,
      repository.name,
    );
    await config.cache.stage(params.path, repository);
  };

  addRepositoryWorkflows = async (config, _run, params) => {
    const repository = await config.cache.peek(params.path);
    repository.workflows = await config.github.getWorkflows(
      repository.account,
      repository.name,
    );
    await config.cache.stage(params.path, repository);
  };
}

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
