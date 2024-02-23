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
    const expectations = [
      await getExpectedDataFor("user1", "repo-a"),
      await getExpectedDataFor("user1", "repo-b"),
    ];
    const config = { createOctokit: createMockOctokit };
    let repositories = await getRepositories(accounts, config);
    let matched = [];

    expectations.forEach((expected) => {
      const i = repositories.findIndex(
        (r) => expected.account === r.account && expected.name == r.name,
      );
      if (i >= 0) {
        expect(repositories[i]).toMatchObject(expected);
        matched.push(expected);
        repositories.splice(i, 1);
      }
    });

    expect(repositories).toHaveLength(0);
    expect(matched).toEqual(expectations);
  });
});
