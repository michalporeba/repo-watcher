"use strict";

import { createOctokit as createDefaultOctokit } from "./github-utils";
import { streamRepositoriesFromGitHubAccount } from "./github";

export const getRepositories = async (accounts, config) => {
  const repositories = [];

  for await (const repository of streamRepositories(accounts, config)) {
    repositories.push(repository);
  }

  return {
    data: repositories,
  };
};

export const streamRepositories = async function* (accounts, config = {}) {
  const { createOctokit = createDefaultOctokit } = config;
  const octokit = await createOctokit();

  for (const account of accounts) {
    yield* streamRepositoriesFromGitHubAccount(account, octokit);
  }
};
