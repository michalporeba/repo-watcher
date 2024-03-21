"use strict";

import { resolveDefaultsFor } from "../../src/config";
import { createConfigurableFakeGitHub } from "../doubles/github";
import { fetchRepositories } from "../../src";
import { githubUser } from "../../src";

const createConfig = async function ({ githubThrow, githubThrowAll } = {}) {
  return await resolveDefaultsFor({
    noRefreshSeconds: 0, // force API use for now, it will be removed
    github: createConfigurableFakeGitHub,
  });
};

describe("Fetching data from GitHub", () => {
  test("Fething returns a status even if it couldn't fetch anything", async () => {
    const accounts = [githubUser("michalporeba")];
    const config = createConfig();
    const status = await fetchRepositories(accounts, config);
    expect(status).toMatchObject({
      last: {
        accounts: 0,
        repositories: 0,
        apicalls: { github: 0 },
      },
    });
  });
});
