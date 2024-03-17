"use strict";

/*
 * The purpose of these integration tests is to catch any changes to API returns
 * that can case the repo-watcher to stop working in the future.
 * The checks goes beyond ensuring a property exists.
 */

import { createOctokit } from "../../src/github-utils";
import {
  createRequestForUserRepos,
  createRequestForOrgRepos,
  createRequestForLanguageList,
} from "../../src/github";
import customJestExtensions from "../data/jest-extensions";
import { GitHub } from "../../src/github";

const NON_EMPTY_STRING_REGEX = /.+/;
const URL_REGEX =
  /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;
const DATETIME_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

expect.extend(customJestExtensions);

const EXPECTED_REPO_RESPONSE_SHAPE = {
  name: expect.stringMatching(NON_EMPTY_STRING_REGEX),
  owner: { login: expect.stringMatching(NON_EMPTY_STRING_REGEX) },
  created_at: expect.stringMatching(DATETIME_REGEX),
  updated_at: expect.stringMatching(DATETIME_REGEX),
  pushed_at: expect.stringMatching(DATETIME_REGEX),
  default_branch: expect.any(String),
  archived: expect.any(Boolean),
  disabled: expect.any(Boolean),
  fork: expect.any(Boolean),
  is_template: expect.any(Boolean),
  has_issues: expect.any(Boolean),
  has_downloads: expect.any(Boolean),
  has_projects: expect.any(Boolean),
  has_wiki: expect.any(Boolean),
  has_pages: expect.any(Boolean),
  has_discussions: expect.any(Boolean),
  size: expect.any(Number),
  forks: expect.any(Number),
  open_issues: expect.any(Number),
  watchers: expect.any(Number),
};

const EXPECTED_REPOSITORY_SHAPE = {
  account: expect.stringMatching(NON_EMPTY_STRING_REGEX),
  owner: expect.stringMatching(NON_EMPTY_STRING_REGEX),
  name: expect.stringMatching(NON_EMPTY_STRING_REGEX),
  homepage: expect.stringMatching(NON_EMPTY_STRING_REGEX),
  default_branch: expect.stringMatching(NON_EMPTY_STRING_REGEX),
  size: expect.any(Number),
  times: {
    created: expect.stringMatching(DATETIME_REGEX),
    updated: expect.stringMatching(DATETIME_REGEX),
    pushed: expect.stringMatching(DATETIME_REGEX),
  },
  blobs: {
    description: expect.any(String),
  },
  counts: {
    forks: expect.any(Number),
    openIssues: expect.any(Number),
    watchers: expect.any(Number),
  },
  license: {
    name: expect.any(String),
    spdxId: expect.any(String),
  },
  properties: {
    isArchived: expect.any(Boolean),
    isDisabled: expect.any(Boolean),
    isFork: expect.any(Boolean),
    isTemplate: expect.any(Boolean),
    hasDiscussions: expect.any(Boolean),
    hasDownloads: expect.any(Boolean),
    hasIssues: expect.any(Boolean),
    hasPages: expect.any(Boolean),
    hasProjects: expect.any(Boolean),
    hasWiki: expect.any(Boolean),
  },
  topLanguage: expect.any(String),
};

const validateRepoResponseShape = (data) => {
  expect(Array.isArray(data)).toBeTruthy();
  data.forEach((r) => {
    expect(r).toMatchObject(EXPECTED_REPO_RESPONSE_SHAPE);
  });
};

const validateRepositoryShape = (r) => {
  expect(r).toMatchObject(EXPECTED_REPOSITORY_SHAPE);
  expect(r.url).toBeNullEmptyOrMatch(URL_REGEX);
  expect(r.topLanguage).toBeNullOrString();
  expect(r.license?.name).toBeUndefinedOrString(String);
  expect(r.license?.spdx_id).toBeUndefinedOrString(String);
  expect(Array.isArray(r.topics)).toBeTruthy();
};

const octokit = await createOctokit();

describe("GitHub - Octokit wrapper", () => {
  test("can get user repositories", async () => {
    const github = new GitHub(octokit);
    const stream = github.streamRepositories("user", "michalporeba");
    let repositories = 0;
    for await (const repository of stream) {
      repositories += 1;
      validateRepositoryShape(repository);
    }
    expect(repositories > 0).toBeTruthy();
  }, 10000);
});

describe("GitHub API responses", () => {
  test("organisation repos have necessary properties and values", async () => {
    const { data } = await octokit.rest.repos.listForOrg(
      createRequestForOrgRepos("alphagov"),
    );

    validateRepoResponseShape(data);
  }, 10000);

  test("repository languages are returned", async () => {
    const { data } = await octokit.rest.repos.listLanguages(
      createRequestForLanguageList("michalporeba", "repo-watcher"),
    );

    expect(data).toMatchObject({ JavaScript: expect.any(Number) });
  }, 10000);
});
