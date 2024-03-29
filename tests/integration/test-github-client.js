"use strict";

/*
 * The purpose of these integration tests is to catch any changes to API returns
 * that can case the repo-watcher to stop working in the future.
 * The checks goes beyond ensuring a property exists.
 */

import { createGitHub } from "../../src/github-utils";
import customJestExtensions from "../data/jest-extensions";

const NON_EMPTY_STRING_REGEX = /.+/;
const URL_REGEX =
  /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;
const DATETIME_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

expect.extend(customJestExtensions);

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

const validateRepositoryShape = (r) => {
  expect(r).toMatchObject(EXPECTED_REPOSITORY_SHAPE);
  expect(r.url).toBeNullEmptyOrMatch(URL_REGEX);
  expect(r.topLanguage).toBeNullOrString();
  expect(r.license?.name).toBeUndefinedOrString(String);
  expect(r.license?.spdx_id).toBeUndefinedOrString(String);
  expect(Array.isArray(r.topics)).toBeTruthy();
};

const validateRepositories = async (repositoryStream) => {
  let repositories = 0;
  for await (const repository of repositoryStream) {
    repositories += 1;
    validateRepositoryShape(repository);
    if (repositories >= 5) {
      break;
    }
  }
  expect(repositories > 0).toBeTruthy();
};

const github = createGitHub();

describe("GitHub - Octokit wrapper", () => {
  test("can get user repositories", async () => {
    const account = { type: "user", name: "michalporeba" };
    const stream = github.streamRepositories(account);
    await validateRepositories(stream);
  }, 10_000);

  test("can get organisation repositories", async () => {
    const account = { type: "org", name: "alphagov" };
    const stream = github.streamRepositories(account);
    await validateRepositories(stream);
  }, 10_000);

  test("can get repo languages", async () => {
    const languages = await github.getLanguages("michalporeba", "repo-watcher");
    expect(languages).toMatchObject({ JavaScript: expect.any(Number) });
  }, 10_000);

  test("can get repo workflows", async () => {
    const workflows = await github.getWorkflows("michalporeba", "repo-watcher");
    expect(workflows).toMatchObject({
      total: expect.any(Number),
      active: expect.any(Number),
    });
  }, 10_000);

  test("getting rate limit works - they decrease with calls", async () => {
    const first = await github.getRemainingLimit();
    await github.getLanguages("michalporeba", "repo-watcher");
    const second = await github.getRemainingLimit();
    expect(second).toBeLessThan(first);
  }, 10_000);
});
