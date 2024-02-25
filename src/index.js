"use strict";

import { getMockResponseForGetRepositories } from "../tests/data/test-data-utils";
import {
  createOctokit as createDefaultOctokit,
  createRequestForOrgRepos,
  createRequestForUserRepos,
} from "./octokit-utils";

const getOrgRepositories = async (org, octokit) =>
  await octokit.paginate(
    octokit.rest.repos.listForOrg,
    createRequestForOrgRepos(org),
  );

const getUserRepositories = async (user, octokit) =>
  await octokit.paginate(
    octokit.rest.repos.listForUser,
    createRequestForUserRepos(user),
  );

const getRepositoriesForAccount = async function* (type, name, octokit) {
  let getter = type === "org" ? getOrgRepositories : getUserRepositories;
  const repositories = await getter(name, octokit);
  for (let repository of repositories) {
    yield repository;
  }
};

const processAccount = async function* ({ type, name, include }, octokit) {
  const formatter = createRepositoryDataFormatterFor(name);
  const repositories = getRepositoriesForAccount(type, name, octokit);

  for await (let repository of repositories) {
    if (!include || include.includes(repository.name)) {
      yield formatter(repository);
    }
  }
};

const createRepositoryDataFormatterFor = (account) => (repo) => ({
  account: account,
  owner: repo.owner.login,
  name: repo.name,
  url: repo.html_url,
  homepage: repo.homepage || "(missing)",
  default_branch: repo.default_branch,
  size: repo.size,
  times: {
    created: repo.created_at,
    updated: repo.updated_at,
    pushed: repo.pushed_at,
  },
  blobs: {
    description: repo.description || "(missing)",
  },
  counts: {
    forks: repo.forks,
    openIssues: repo.open_issues,
    watchers: repo.watchers,
  },
  license: {
    name: repo?.license?.name || "(missing)",
    spdxId: repo?.license?.spdx_id || "(missing)",
  },
  properties: {
    isArchived: repo.archived,
    isDisabled: repo.disabled,
    isFork: repo.fork,
    isTemplate: repo.is_template,
    hasDiscussions: repo.has_discussions,
    hasDownloads: repo.has_downloads,
    hasIssues: repo.has_issues,
    hasPages: repo.has_pages,
    hasProjects: repo.has_projects,
    hasWiki: repo.has_wiki,
  },
  topLanguage: repo.language,
  topics: repo.topics,
});

export const streamRepositories = async function* (accounts, config = {}) {
  const { createOctokit = createDefaultOctokit } = config;
  const octokit = await createOctokit();
  for (const account of accounts) {
    yield* processAccount(account, octokit);
  }
};

export const getRepositories = async (accounts, config) => {
  const repositories = [];

  for await (const repository of streamRepositories(accounts, config)) {
    repositories.push(repository);
  }

  return repositories;
};
