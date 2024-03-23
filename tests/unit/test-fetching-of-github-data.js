"use strict";

import { fetchRepositories, getRepositories } from "../../src";
import { githubUser, githubOrg } from "../../src";
import {
  createMinimalExpectationFor,
  getAllTestAccounts,
  repositoryComparator,
} from "../data/test-data-utils";
import customJestExtensions from "../data/jest-extensions";
import { createTestConfig } from "../utils/config";
import { jest } from "@jest/globals";
import { AccountState } from "../../src/cache/account-state";

expect.extend(customJestExtensions);

const ensureGitHubStreamRepositoriesThrows = async (config) => {
  async function exerciseTheGenerator() {
    // it is necessary to trigger the exception
    const account = githubUser("testuser");
    return config.github.streamRepositories(account).next();
  }
  await expect(exerciseTheGenerator()).rejects.toThrow();
};

describe("Fetching data from GitHub", () => {
  test("Fetching returns a status even if it couldn't fetch anything", async () => {
    const config = await createTestConfig({ githubThrowAll: true });
    await ensureGitHubStreamRepositoriesThrows(config);
    const account = [githubUser("michalporeba")];
    const status = await fetchRepositories(config, account);
    expect(status).toMatchObject({
      last: {
        accounts: 0,
        repositories: 0,
        apicalls: { github: 0 },
      },
    });
  });

  test("Fetching in a single account returns correct status", async () => {
    const config = await createTestConfig();
    const query = [githubUser("user1")];
    const status = await fetchRepositories(config, query);
    expect(status).toMatchObject({
      last: {
        accounts: 1,
        repositories: 2,
      },
    });
  });

  test("Before fetching getRepositories returns no data", async () => {
    const config = await createTestConfig();
    expect(await getRepositories(config)).toEqual([]);
  });

  test("After successful fetching getRepositories returns all the data", async () => {
    const config = await createTestConfig();
    const expectations = [
      createMinimalExpectationFor("user1", "repo-a"),
      createMinimalExpectationFor("user1", "repo-b"),
      createMinimalExpectationFor("orga", "repo-1"),
    ];

    await fetchRepositories(config, getAllTestAccounts());
    const repositories = await getRepositories(config);
    expect(repositories).toCloselyMatch(expectations, repositoryComparator);
  });

  test("Fetching can be limited to a specific repository", async () => {
    const config = await createTestConfig();
    const query = [githubUser("user1", { include: ["repo-b"] })];
    const expectations = [createMinimalExpectationFor("user1", "repo-b")];

    await fetchRepositories(config, query);
    const repositories = await getRepositories(config);
    expect(repositories).toCloselyMatch(expectations, repositoryComparator);
  });

  test("Fetching is additive", async () => {
    const config = await createTestConfig();
    const expectations = [
      createMinimalExpectationFor("user1", "repo-a"),
      createMinimalExpectationFor("user1", "repo-b"),
      createMinimalExpectationFor("orga", "repo-1"),
    ];

    await fetchRepositories(config, [githubUser("user1")]);
    await fetchRepositories(config, [githubOrg("orga")]);

    const repositories = await getRepositories(config);
    expect(repositories).toCloselyMatch(expectations, repositoryComparator);
  });

  test("Fetching updates account state", async () => {
    const config = await createTestConfig();
    const { cache } = config;
    await fetchRepositories(config, [githubUser("user1")]);
    const state = await AccountState.getFrom(cache, githubUser("user1"));
    expect(state).toMatchObject({
      service: "github",
      account: "user1",
      timestamp: expect.any(Number),
    });
  });

  test.skip("Fetching can selectively update cache", async () => {
    jest.useFakeTimers();
    const config = await createTestConfig();
    const { cache } = config;
    await fetchRepositories(config, [githubUser("user1")]);
    await fetchRepositories(config, [githubOrg("orga")]);

    const b1version = await AccountState.getFrom(cache, githubUser("user1"));
    //const { versions = b1versions } = await getRepository(config, repoBquery);

    //expect(b1versions.last).toEqual(b1versions.first);

    jest.advanceTimersByTime(10_000);
    await fetchRepositories(config, [
      githubUser("user1", { include: ["repo-a"] }),
    ]);
  });
});
