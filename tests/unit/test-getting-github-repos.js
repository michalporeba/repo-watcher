"use strict";

import { getRepositories } from "../../src/index";
import {
  getExpectedDataFor,
  repositoryComparator,
} from "../data/test-data-utils";
import { jest } from "@jest/globals";
import customJestExtensions from "../data/jest-extensions";
import { createFakeGitHub, createThrowingGitHub } from "../doubles/github";

expect.extend(customJestExtensions);

const config = {
  noRefreshSeconds: 0,
  github: createFakeGitHub,
};

const configWithNoRefreshTime = {
  noRefreshSeconds: 60,
  github: createFakeGitHub,
};

const configWithNoRefreshTimeAndThrowingGitHub = {
  noRefreshSeconds: 60,
  github: createThrowingGitHub,
};

describe("Test getting GitHub repos", () => {
  test("get all user repos", async () => {
    const accounts = [{ name: "user1", type: "user" }];
    const expectations = [
      await getExpectedDataFor("user1", "repo-a"),
      await getExpectedDataFor("user1", "repo-b"),
    ];

    console.log(expectations);
    const { data } = await getRepositories(accounts, config);
    console.log(data);
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

    const accounts = [{ name: "user1", type: "user", include: "repo-b" }];
    const expectations = [await getExpectedDataFor("user1", "repo-b")];

    const { data: data1 } = await getRepositories(accounts, config);
    expect(data1).toCloselyMatch(expectations, repositoryComparator);

    // this will throw if GitHub object is used
    const { data: data2 } = await getRepositories(
      accounts,
      configWithNoRefreshTimeAndThrowingGitHub,
    );
    expect(data2).toCloselyMatch(expectations, repositoryComparator);

    jest.advanceTimersByTime(120_000);
    const { data: data3 } = await getRepositories(
      accounts,
      configWithNoRefreshTime,
    );
    expect(data3).toCloselyMatch(expectations, repositoryComparator);
  });
});
