"use strict";

import { GITHUB_HEADERS, GITHUB_PAGESIZE } from "./github-utils";

export class GitHub {
  constructor(octokit, config = {}) {
    this.octokit = octokit;
    this.pagesize = config?.pagesize || GITHUB_PAGESIZE;
  }

  streamRepositories = async function* ({ type, name }) {
    const formatter = createRepositoryDataFormatterFor(name);
    const repositories = this.#getRepositoriesForAccount(
      type,
      name,
      this.octokit,
    );

    for await (const repository of repositories) {
      yield formatter(repository);
    }
  };

  getLanguages = async function (owner, repo) {
    const { data } = await this.octokit.rest.repos.listLanguages(
      createRequestForLanguageList(owner, repo),
    );
    return data;
  };

  #getRepositoriesForAccount = async function* (type, name, octokit) {
    let getter = type === "org" ? getOrgRepositories : getUserRepositories;
    const repositories = await getter(name, octokit);
    for await (const { data } of repositories) {
      for (const repository of data) {
        yield repository;
      }
    }
  };
}

const createRequestForOrgRepos = (org) => ({
  org,
  type: "public",
  per_page: GITHUB_PAGESIZE,
  headers: GITHUB_HEADERS,
});

const createRequestForUserRepos = (username) => ({
  username,
  type: "owner",
  per_page: GITHUB_PAGESIZE,
  headers: GITHUB_HEADERS,
});

const createRequestForLanguageList = (owner, repo) => ({
  owner,
  repo,
  headers: GITHUB_HEADERS,
});

export const streamRepositoriesFromGitHubAccount = async function* (
  octokit,
  { type, name },
) {
  const formatter = createRepositoryDataFormatterFor(name);
  const repositories = getRepositoriesForAccount(type, name, octokit);

  for await (const repository of repositories) {
    yield formatter(repository);
  }
};

// moved but still used by tests
const getRepositoriesForAccount = async function* (type, name, octokit) {
  let getter = type === "org" ? getOrgRepositories : getUserRepositories;
  const repositories = await getter(name, octokit);
  for await (const page of repositories) {
    for (const repository of page) {
      yield repository;
    }
  }
};

// moved
const getOrgRepositories = async (org, octokit) =>
  octokit.paginate.iterator(
    octokit.rest.repos.listForOrg,
    createRequestForOrgRepos(org),
  );

// moved
const getUserRepositories = async (user, octokit) =>
  octokit.paginate.iterator(
    octokit.rest.repos.listForUser,
    createRequestForUserRepos(user),
  );

const createRepositoryDataFormatterFor = (account) => (repo) => ({
  account,
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
  topLanguage: repo?.language || "(none)",
  topics: repo.topics,
});
