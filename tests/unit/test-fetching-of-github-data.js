"use strict";

import { resolveDefaultsFor } from "../../src/config";
import { createConfigurableFakeGitHub } from "../doubles/github";
import { fetchRepositories } from "../../src";
import { githubUser } from "../../src";

const createConfig = async function ({ githubThrow, githubThrowAll } = {}) {
  const config = await resolveDefaultsFor({
    noRefreshSeconds: 0, // force API use for now, it will be removed
    cache: "mem",
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
    const status = await fetchRepositories([account], config);
    expect(status).toMatchObject({
      last: {
        accounts: 0,
        repositories: 0,
        apicalls: { github: 0 },
      },
    });
  });

  test("Fetching in a single run returns correct status", async () => {
    const config = await createConfig();
    const account = githubUser("user1");
    const status = await fetchRepositories([account], config);
    expect(status).toMatchObject({
      last: {
        accounts: 1,
        repositories: 0,
        apicalls: {
          github: expect.any(Number),
        },
      },
    });
  });
});
