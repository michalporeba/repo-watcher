"use strict";

import { getRepositories } from "../../src/index";
import {
  createMockOctokit,
  getExpectedDataFor,
  getMockDataForGetRepositories,
  repositoryComparator,
} from "../data/test-data-utils";
import { jest } from "@jest/globals";
import customJestExtensions from "../data/jest-extensions";

expect.extend(customJestExtensions);

jest.unstable_mockModule("@octokit/rest", () => {
  const actual = jest.requireActual("@octokit/rest");
  return {
    ...actual,
    Octokit: jest.fn().mockImplementation(() => ({
      ...new actual.Octokit(),
      paginate: jest.fn().mockImplementation(getMockDataForGetRepositories),
    })),
  };
});

describe("Test getting GitHub repos", () => {
  test("get all user repos", async () => {
    const accounts = [{ name: "user1", type: "user" }];
    const expectations = [
      await getExpectedDataFor("user1", "repo-a"),
      await getExpectedDataFor("user1", "repo-b"),
    ];
    const config = { createOctokit: createMockOctokit };
    const { data } = await getRepositories(accounts, config);
    expect(data).toCloselyMatch(expectations, repositoryComparator);
  });

  test("get specific user repo", async () => {
    const accounts = [{ name: "user1", type: "user", include: "repo-b" }];
    const expectations = [await getExpectedDataFor("user1", "repo-b")];
    const config = { createOctokit: createMockOctokit };
    const { data } = await getRepositories(accounts, config);
    expect(data).toCloselyMatch(expectations, repositoryComparator);
  });

  test("get all org repos", async () => {
    const accounts = [{ name: "orga", type: "org" }];
    const expectations = [await getExpectedDataFor("orga", "repo-1")];
    const config = { createOctokit: createMockOctokit };
    const { data } = await getRepositories(accounts, config);
    expect(data).toCloselyMatch(expectations, repositoryComparator);
  });

  test("get all repos", async () => {
    const accounts = [
      { name: "user1", type: "user" },
      { name: "orga", type: "org" },
    ];
    const expectations = [
      await getExpectedDataFor("user1", "repo-a"),
      await getExpectedDataFor("user1", "repo-b"),
      await getExpectedDataFor("orga", "repo-1"),
    ];
    const config = { createOctokit: createMockOctokit };
    const { data } = await getRepositories(accounts, config);
    expect(data).toCloselyMatch(expectations, repositoryComparator);
  });
});
