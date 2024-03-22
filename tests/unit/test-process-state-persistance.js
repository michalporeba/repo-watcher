"use strict";

import { getRepositories1 } from "../../src/index";
import customJestExtensions from "../data/jest-extensions";
import { createFakeGitHub } from "../doubles/github";
import { ProcessState } from "../../src/cache/process-state";
import { resolveDefaultsFor } from "../../src/config";

expect.extend(customJestExtensions);

const config = {
  cache: { type: "gmem" },
  github: createFakeGitHub,
  noRefreshSeconds: 0,
};

describe("Test process state persistance", () => {
  test("All repositories are counted", async () => {
    const { cache } = await resolveDefaultsFor(config);

    const accounts = [
      { name: "user1", type: "user" },
      { name: "orga", type: "org" },
    ];
    const { state } = await getRepositories1(accounts, config);

    expect(state).toMatchObject(await ProcessState.getFrom(cache));
    expect(state).toMatchObject({
      repositories: {
        discovered: 3,
        collected: 3,
        remaining: 0,
      },
    });
  });
});
