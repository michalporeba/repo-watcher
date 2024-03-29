"use strict";

import { fetchRepositories, getRepositories } from "../../src";
import { githubUser, githubOrg } from "../../src/github-utils";
import {
  createMinimalExpectationFor,
  getAllTestAccounts,
  repositoryComparator,
} from "../data/test-data-utils";
import customJestExtensions from "../data/jest-extensions";
import { createTestConfig } from "../utils/config";
import { Account } from "../../src/model/account";

expect.extend(customJestExtensions);

let config;

const ensureGitHubStreamRepositoriesThrows = async (config) => {
  async function exerciseTheGenerator() {
    // it is necessary to trigger the exception
    const account = githubUser("testuser");
    return config.github.streamRepositories(account).next();
  }
  await expect(exerciseTheGenerator()).rejects.toThrow();
};

describe("Fetching data from GitHub", () => {
  beforeEach(async () => {
    config = await createTestConfig();
  });

  test("Fetching returns a status even if it couldn't fetch anything", async () => {
    const config = await createTestConfig({ githubThrowAll: true });
    await ensureGitHubStreamRepositoriesThrows(config);
    const account = [githubUser("michalporeba")];
    const status = await fetchRepositories(config, account);
    expect(status).toMatchObject({
      accounts: { total: 1, processed: 0, remaining: 1 },
      repositories: 0,
      apicalls: { github: 0 },
    });
  });

  test("Fetching in a single account returns correct status", async () => {
    const query = [githubUser("user1")];
    const status = await fetchRepositories(config, query);
    expect(status).toMatchObject({
      accounts: { total: 1, processed: 1, remaining: 0 },
      repositories: 2,
    });
  });

  test("Before fetching getRepositories returns no data", async () => {
    expect(await getRepositories(config)).toEqual([]);
  });

  test("After successful fetching getRepositories returns all the data", async () => {
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
    const query = [githubUser("user1", { include: ["repo-b"] })];
    const expectations = [createMinimalExpectationFor("user1", "repo-b")];

    await fetchRepositories(config, query);
    const repositories = await getRepositories(config);
    expect(repositories).toCloselyMatch(expectations, repositoryComparator);
  });

  test("Fetching is additive", async () => {
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
    const state = await Account.getFrom(cache, githubUser("user1"));
    expect(state).toMatchObject({
      service: "github",
      account: "user1",
      timestamp: expect.any(Number),
    });
  });

  test("Each repository has its own version information", async () => {
    await fetchRepositories(config, [githubUser("user1")]);
    const account = await Account.getFrom(config.cache, githubUser("user1"));

    const repoState = account.getRepository("repo-a");

    expect(repoState).toMatchObject({
      timestamp: expect.any(Number),
      versions: {
        first: expect.any(Number),
        current: expect.any(Number),
        latest: expect.any(Number),
      },
    });
  });
});
