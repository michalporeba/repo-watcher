"use strict";

import { getRepositories, getState } from "../../src/index";
import customJestExtensions from "../data/jest-extensions";
import { createFakeGitHub } from "../doubles/github";

expect.extend(customJestExtensions);

const config = {
  cache: { type: "mem" },
  github: createFakeGitHub,
  noRefreshTime: 0,
};

describe("Test process state persistance", () => {
  test("All repositories are counted", async () => {
    const accounts = [
      { name: "user1", type: "user" },
      { name: "orga", type: "org" },
    ];
    const { state } = await getRepositories(accounts, config);

    expect(state).toMatchObject(await getState(config));
    expect(state).toMatchObject({
      repositories: {
        discovered: 3,
        collected: 3,
        remaining: 0,
      },
    });
  });
});
