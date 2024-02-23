"use strict";

import { getRepositories } from "../../src/index";
import {
  getExpectedDataFor,
  getMockResponseForGetRepositories,
} from "../data/test-data-utils";
import { jest } from "@jest/globals";

const getMockDataForGetRepositories = (_, parameters) => {
  let account = "";
  if (parameters?.type === "owner") {
    account = parameters.username;
  }
  if (parameters?.type === "public") {
    account = parameters.org;
  }
  if (account) {
    return Promise.resolve(getMockResponseForGetRepositories(account));
  }
  throw "Incorrect API request";
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

const testReturnedData = async (expectations, actuals) => {
  let matched = [];

  expectations.forEach((expected) => {
    const i = actuals.findIndex(
      (actual) =>
        expected.account === actual.account && expected.name == actual.name,
    );

    if (i >= 0) {
      // result was found, check if it is in the right shape
      expect(actuals[i]).toMatchObject(expected);
      matched.push(expected);
      actuals.splice(i, 1);
    }
  });

  // nothing should be included unexpectadly
  expect(actuals).toHaveLength(0);
  // and everything expected should be returned
  expect(matched).toEqual(expectations);
};

describe("Test getting GitHub repos", () => {
  test("get all user repos", async () => {
    const accounts = [{ name: "user1", type: "user" }];
    const expectations = [
      await getExpectedDataFor("user1", "repo-a"),
      await getExpectedDataFor("user1", "repo-b"),
    ];
    const config = { createOctokit: createMockOctokit };
    const actuals = await getRepositories(accounts, config);
    await testReturnedData(expectations, actuals);
  });

  test("get specific user repo", async () => {
    const accounts = [{ name: "user1", type: "user", include: "repo-b" }];
    const expectations = [await getExpectedDataFor("user1", "repo-b")];
    const config = { createOctokit: createMockOctokit };
    const actuals = await getRepositories(accounts, config);
    await testReturnedData(expectations, actuals);
  });

  test("get all org repos", async () => {
    const accounts = [{ name: "orga", type: "org" }];
    const expectations = [await getExpectedDataFor("orga", "repo-1")];
    const config = { createOctokit: createMockOctokit };
    const actuals = await getRepositories(accounts, config);
    await testReturnedData(expectations, actuals);
  });

  test("get all repos", async () => {
    const accounts = [
      { name: "user1", type: "user" },
      { name: "orga", type: "org" },
    ];
    const expectations = [
      await getExpectedDataFor("user1", "repo-a"),
      await getExpectedDataFor("user1", "repo-b"),
      await getExpectedDataFor("orga", "repo-1"),
    ];
    const config = { createOctokit: createMockOctokit };
    const actuals = await getRepositories(accounts, config);
    await testReturnedData(expectations, actuals);
  });
});
