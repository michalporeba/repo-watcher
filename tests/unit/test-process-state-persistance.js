"use strict";

import { getRepositories, getState } from "../../src/index";

import {
  createMockOctokit,
  mockIteratorForGetRepositories,
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

const config = {
  cache: { type: "mem" },
  octokit: createMockOctokit,
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
