"use strict";

import {
  createOctokit,
  createRequestForUserRepos,
} from "../../src/octokit-utils.js";

const NON_EMPTY_STRING_REGEX = /.+/;
const URL_REGEX =
  /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

expect.extend({
  toBeNullOrString(value) {
    return {
      message: () => `expected ${value} to be null or a string`,
      pass: value === null || typeof value === "string",
    };
  },
  toBeNullOrMatch(value, pattern) {
    return {
      message: () => `expected ${value} to be null or match ${pattern}`,
      pass:
        value === null || (typeof value === "string" && !!value.match(pattern)),
    };
  },
});

const EXPECTED_REPO_RESPONSE_SHAPE = {
  name: expect.stringMatching(NON_EMPTY_STRING_REGEX),
  owner: { login: expect.stringMatching(NON_EMPTY_STRING_REGEX) },
};

const octokit = createOctokit();

describe("GitHub API responses", () => {
  test("user repos have necessary properties", async () => {
    const { data } = await octokit.rest.repos.listForUser(
      createRequestForUserRepos("michalporeba"),
    );

    expect(Array.isArray(data)).toBeTruthy();
    data.forEach((r) => {
      expect(r).toMatchObject(EXPECTED_REPO_RESPONSE_SHAPE);
      expect(r.description).toBeNullOrString();
      expect(r.html_url).toBeNullOrMatch(URL_REGEX);
    });
  });
});
