"use strict";

import { getRepositories } from "../../src/index";
import {
  getExpectedDataFor,
  getMockResponseForGetRepositories,
} from "../data/test-data-utils";
import { jest } from "@jest/globals";

const getMockDataForGetRepositories = (_, parameters) => {
  if (parameters.type === "owner") {
    return Promise.resolve(
      getMockResponseForGetRepositories(parameters.username),
    );
  }
  return Promise.resolve([]);
};

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

const createMockOctokit = async () => {
  const { Octokit } = await import("@octokit/rest");
  return new Octokit();
};

describe("Test getting GitHub repos", () => {
  test("get all user repos", async () => {
    const accounts = [{ name: "user1", type: "user" }];
    const config = { createOctokit: createMockOctokit };
    const repositories = await getRepositories(accounts, config);

    expect(repositories).toHaveLength(2);

    repositories.forEach((r) => {
      expect(r).toMatchObject(getExpectedDataFor(r.account, r.name));
    });
  });
});
