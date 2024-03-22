"use strict";

import { resolveDefaultsFor } from "../../src/config";
import { createConfigurableFakeGitHub } from "../doubles/github";
import { fetchRepositories, getRepositories } from "../../src";
import { githubUser } from "../../src";
import {
  createMinimalExpectationFor,
  repositoryComparator,
} from "../data/test-data-utils";
import customJestExtensions from "../data/jest-extensions";

expect.extend(customJestExtensions);

const createConfig = async function ({ githubThrow, githubThrowAll } = {}) {
  const config = await resolveDefaultsFor({
    noRefreshSeconds: 0, // force API use for now, it will be removed
    cache: { type: "mem" },
    github: createConfigurableFakeGitHub,
  });
  if (githubThrow) {
    config.github.throwOnCall();
  }
  if (githubThrowAll) {
    config.github.throwOnAllCalls();
  }
  return config;
};

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
    const config = await createConfig({ githubThrowAll: true });
    await ensureGitHubStreamRepositoriesThrows(config);
    const account = githubUser("michalporeba");
    const status = await fetchRepositories(config, [account]);
    expect(status).toMatchObject({
      last: {
        accounts: 0,
        repositories: 0,
        apicalls: { github: 0 },
      },
    });
  });

  test("Fetching in a single account returns correct status", async () => {
    const config = await createConfig();
    const account = githubUser("user1");
    const status = await fetchRepositories(config, [account]);
    expect(status).toMatchObject({
      last: {
        accounts: 1,
        repositories: 2,
      },
    });
  });

  test("Before fetching getRepositories returns no data", async () => {
    const config = await createConfig();
    expect(await getRepositories(config)).toEqual([]);
  });

  test("After successful fetching getRepositories returns all the data by default", async () => {
    const config = await createConfig();
    const accounts = [githubUser("user1")];
    const expectations = [
      createMinimalExpectationFor("user1", "repo-a"),
      createMinimalExpectationFor("user1", "repo-b"),
    ];

    await fetchRepositories(config, accounts);
    const repositories = await getRepositories(config);
    expect(repositories).toCloselyMatch(expectations, repositoryComparator);
  });
});
