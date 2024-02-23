"use strict";

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

const getRepositoriesForAccount = async (type, name, octokit) => {
  let getter = type === "org" ? getOrgRepositories : getUserRepositories;
  return await getter(name, octokit);
};

const processAccount = async ({ type, name, include }, octokit) =>
  new Promise(async (res) => {
    const repositories = await getRepositoriesForAccount(type, name, octokit);
    const filteredRepositories = repositories.filter(
      (r) => !include || include.includes(r.name),
    );

    res(filteredRepositories.map(formatRepositoryDataFor(name)));
  });

const formatRepositoryDataFor = (account) => (repo) => ({
  account: account,
  name: repo.name,
  homepage: repo.homepage,
  owner: repo.owner.login,
  times: {
    created: repo.created_at,
    updated: repo.updated_at,
    pushed: repo.pushed_at,
  },
  properties: {
    isArchived: repo.archived,
    isDisabled: repo.disabled,
    isFork: repo.fork,
    isTemplate: repo.is_template,
    hasIssues: repo.has_issues,
    hasDownloads: repo.has_downloads,
    hasProjects: repo.has_projects,
    hasWiki: repo.has_wiki,
    hasPages: repo.has_pages,
    hasDiscussions: repo.has_discussions,
  },
  license: {
    name: repo.license ? repo.license.name : null,
    url: repo.license ? repo.license.url : null,
  },
  size: repo.size,
  counts: {
    forks: repo.forks,
    openIssues: repo.open_issues,
    watchers: repo.watchers,
  },
  topLanguage: repo.language,
  topics: repo.topics,
  blobs: {
    description: repo.description,
  },
});

export const getRepositories = async (accounts, config = {}) => {
  const { createOctokit = createDefaultOctokit } = config;
  const octokit = await createOctokit();
  const all = await Promise.allSettled(
    accounts.map((account) => processAccount(account, octokit)),
  );

  return all.map(({ value }) => value).flat();
};
