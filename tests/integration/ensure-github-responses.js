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
} from "../../src/github";
import customJestExtensions from "../data/jest-extensions";

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

const validateRepoResponseShape = (data) => {
  expect(Array.isArray(data)).toBeTruthy();
  data.forEach((r) => {
    expect(r).toMatchObject(EXPECTED_REPO_RESPONSE_SHAPE);
    expect(r.description).toBeNullOrString();
    expect(r.language).toBeNullOrString();
    expect(r.homepage).toBeNullEmptyOrMatch(URL_REGEX);
    expect(r.license?.name).toBeUndefinedOrString(String);
    expect(r.license?.spdx_id).toBeUndefinedOrString(String);
  });
};

const octokit = await createOctokit();

describe("GitHub API responses", () => {
  test("user repos have necessary properties and values", async () => {
    const { data } = await octokit.rest.repos.listForUser(
      createRequestForUserRepos("michalporeba"),
    );

    validateRepoResponseShape(data);
  }, 10000);

  test("organisation repos have necessary properties and values", async () => {
    const { data } = await octokit.rest.repos.listForOrg(
      createRequestForOrgRepos("alphagov"),
    );
  }, 10000);
});
