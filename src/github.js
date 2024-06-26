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

  getWorkflows = async function (owner, repo) {
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows`;
    const data = await fetch(url).then((response) => response.json());
    return formatWorkflows(data);
  };

  getCommunityMetrics = async function (owner, repo) {
    const url = `https://api.github.com/repos/${owner}/${repo}/community/profile`;
    const data = await fetch(url).then((response) => response.json());
    return formatCommunityMetrics(data);
  };

  getRemainingLimit = async function () {
    const info = await this.octokit.getRateInfo();
    return info.remaining;
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

const getOrgRepositories = async (org, octokit) =>
  octokit.paginate.iterator(
    octokit.rest.repos.listForOrg,
    createRequestForOrgRepos(org),
  );

const getUserRepositories = async (user, octokit) =>
  octokit.paginate.iterator(
    octokit.rest.repos.listForUser,
    createRequestForUserRepos(user),
  );

const formatWorkflows = (data) => {
  var formatted = {
    total: data.total_count,
    active: data.workflows.filter((w) => w.state == "active").length,
  };
  return formatted;
};

const formatCommunityMetrics = (data) => {
  return {
    health: data.health_percentage,
    has: {
      codeOfConduct: !!data.files.code_of_conduct,
      contributing: !!data.files.contributing,
      description: !!data.description,
      documentation: !!data.documentation,
      issuesTemplate: !!data.files.issues_template,
      license: !!data.files.license,
      prTemplate: !!data.files.pull_request_template,
      readme: !!data.files.readme,
    },
  };
};

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
  languages: {},
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
