"use strict";

import { getRepositories1 } from "../../src/index";
import {
  getExpectedDataFor,
  repositoryComparator,
} from "../data/test-data-utils";
import { jest } from "@jest/globals";
import customJestExtensions from "../data/jest-extensions";
import {
  createDepletedGitHub,
  createFakeGitHub,
  createThrowingGitHub,
} from "../doubles/github";
import { resolveDefaultsFor } from "../../src/config";

expect.extend(customJestExtensions);

const config = await resolveDefaultsFor({
  noRefreshSeconds: 0,
  github: createFakeGitHub,
});

const configWithNoRefreshTime = {
  noRefreshSeconds: 60,
  github: createFakeGitHub,
};

const configWithDepletedGitHub = {
  noRefreshSeconds: 0,
  github: createDepletedGitHub,
};

const configWithNoRefreshTimeAndThrowingGitHub = {
  noRefreshSeconds: 60,
  github: createThrowingGitHub,
};

const configWithThrowingGitHub = await resolveDefaultsFor({
  noRefreshSeconds: 0,
  github: createThrowingGitHub,
});

describe("Test getting GitHub repos", () => {
  test("get all user repos", async () => {
    const accounts = [{ name: "user1", type: "user" }];
    const expectations = [
      await getExpectedDataFor("user1", "repo-a"),
      await getExpectedDataFor("user1", "repo-b"),
    ];

    const { data } = await getRepositories1(accounts, config);
    expect(data).toCloselyMatch(expectations, repositoryComparator);
  });

  test("get specific user repo", async () => {
    const accounts = [{ name: "user1", type: "user", include: "repo-b" }];
    const expectations = [await getExpectedDataFor("user1", "repo-b")];
    const { data } = await getRepositories1(accounts, config);
    expect(data).toCloselyMatch(expectations, repositoryComparator);
  });

  test("get all org repos", async () => {
    const accounts = [{ name: "orga", type: "org" }];
    const expectations = [await getExpectedDataFor("orga", "repo-1")];
    const { data } = await getRepositories1(accounts, config);
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
    const { data } = await getRepositories1(accounts, config);
    expect(data).toCloselyMatch(expectations, repositoryComparator);
  });

  test("No API calls are attempted if rate limit is low", async () => {
    const accounts = [{ name: "not-cached-user", type: "user" }];
    const { data } = await getRepositories1(accounts, configWithDepletedGitHub);
    expect(data).toEqual([]);
  });

  test("Cached version is used if it is recent enough", async () => {
    // plan:
    // get repository from an API
    // get it again ensuring API was not called.
    // change time beyond cut off and try again. API should be used again

    jest.useFakeTimers();

    const accounts = [{ name: "user1", type: "user", include: "repo-b" }];
    const expectations = [await getExpectedDataFor("user1", "repo-b")];

    const { data: data1 } = await getRepositories1(accounts, config);
    expect(data1).toCloselyMatch(expectations, repositoryComparator);

    // this will throw if GitHub object is used
    const { data: data2 } = await getRepositories1(
      accounts,
      configWithNoRefreshTimeAndThrowingGitHub,
    );
    expect(data2).toCloselyMatch(expectations, repositoryComparator);

    jest.advanceTimersByTime(120_000);
    const { data: data3 } = await getRepositories1(
      accounts,
      configWithNoRefreshTime,
    );
    expect(data3).toCloselyMatch(expectations, repositoryComparator);
  });

  test.skip("cached version is used if there were no changes", async () => {
    // plan:
    // ensure that cache has recent version of a repo
    const accounts = [{ name: "user1", type: "user", include: "repo-b" }];
    const expectations = [await getExpectedDataFor("user1", "repo-b")];
    const { data: first } = await getRepositories1(accounts, config);
    expect(first).toCloselyMatch(expectations, repositoryComparator);

    // TODO: there must be a better way to manage github behaviour under test
    const config2 = configWithThrowingGitHub;
    config2.cache = config.cache;
    const second = await getRepositories1(accounts, config2);
    // ensure the noRefreshPeriod is 0
    // ensure the repository is returned
    expect(first).toBeEqual(second);
  });
});
