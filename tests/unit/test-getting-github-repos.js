"use strict";

import { getRepositories } from "../../src/index";
import {
  createMockOctokit,
  getExpectedDataFor,
  mockIteratorForGetRepositories,
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
      paginate: {
        iterator: mockIteratorForGetRepositories,
      },
    })),
  };
});

const config = { octokit: createMockOctokit, noRefreshTime: 0 };
const configWithNoRefreshTime = {
  octokit: createMockOctokit,
  noRefreshTime: 60,
};

describe("Test getting GitHub repos", () => {
  test("get all user repos", async () => {
    const accounts = [{ name: "user1", type: "user" }];
    const expectations = [
      await getExpectedDataFor("user1", "repo-a"),
      await getExpectedDataFor("user1", "repo-b"),
    ];
    const { data } = await getRepositories(accounts, config);
    expect(data).toCloselyMatch(expectations, repositoryComparator);
  });

  test("get specific user repo", async () => {
    const accounts = [{ name: "user1", type: "user", include: "repo-b" }];
    const expectations = [await getExpectedDataFor("user1", "repo-b")];
    const { data } = await getRepositories(accounts, config);
    expect(data).toCloselyMatch(expectations, repositoryComparator);
  });

  test("get all org repos", async () => {
    const accounts = [{ name: "orga", type: "org" }];
    const expectations = [await getExpectedDataFor("orga", "repo-1")];
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
    const { data } = await getRepositories(accounts, config);
    expect(data).toCloselyMatch(expectations, repositoryComparator);
  });

  test("Cached version is used if it is recent enough", async () => {
    // plan:
    // get repository from an API
    // get it again ensuring API was not called.
    // change time beyond cut off and try again. API should be used again

    jest.useFakeTimers();
    const apiCall = mockIteratorForGetRepositories;
    // this is a single mock used by other tests as well, we need a baseline
    const calls = apiCall.mock.calls.length;

    const accounts = [{ name: "user1", type: "user", include: "repo-b" }];
    const expectations = [await getExpectedDataFor("user1", "repo-b")];

    const { data: data1 } = await getRepositories(accounts, config);
    expect(apiCall).toHaveBeenCalledTimes(calls + 1);
    expect(data1).toCloselyMatch(expectations, repositoryComparator);

    const { data: data2 } = await getRepositories(
      accounts,
      configWithNoRefreshTime,
    );
    expect(apiCall).toHaveBeenCalledTimes(calls + 1);
    // TODO: this should work
    //expect(data2).toCloselyMatch(expectations, repositoryComparator);

    jest.advanceTimersByTime(120_000);
    const { data: data3 } = await getRepositories(
      accounts,
      configWithNoRefreshTime,
    );
    expect(apiCall).toHaveBeenCalledTimes(calls + 2);
  });
});
