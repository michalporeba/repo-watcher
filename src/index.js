"use strict";

import { resolveDefaultsFor } from "./config";
import { Account } from "./model/account";
import { Run } from "./model/run";
import { KnownAccounts } from "./cache/known-accounts";

export const fetchRepositories = async (rawConfig, accounts) => {
  const config = await resolveDefaultsFor(rawConfig);
  const run = await Run.retrievOrCreate(config.cache, accounts);
  await run.processTasks(config);
  await config.cache.flush();
  await run.saveTo(config.cache);

  return run;
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
    const account = await Account.getFromPath(cache, accountPath);
    yield* account.streamRepositoriesFrom(cache);
  }
};
