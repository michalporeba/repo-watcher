"use strict";

import { getRepositories, getState } from "../../src/index";
import { createMockCache } from "../data/test-cache-utils";

import {
  createMockOctokit,
  getMockDataForGetRepositories,
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
      paginate: jest.fn().mockImplementation(getMockDataForGetRepositories),
    })),
  };
});

const config = {
  cache: createMockCache,
  octokit: createMockOctokit,
};

describe("Test process state persistance", () => {
  test("All repositories are present", async () => {
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
