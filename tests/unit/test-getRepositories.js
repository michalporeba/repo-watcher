"use strict";

import { fetchRepositories, getRepositories } from "../../src";

import {
  createMinimalExpectationFor,
  getAllTestAccounts,
  getExpectedDataFor,
  repositoryComparator,
} from "../data/test-data-utils";

import customJestExtensions from "../data/jest-extensions";
import { createTestConfig } from "../utils/config";

expect.extend(customJestExtensions);

const config = await createTestConfig();

describe("Test getRepositories", () => {
  beforeAll(async () => {
    await fetchRepositories(config, getAllTestAccounts());
  });

  test("getRepositories can narrow results to a single account", async () => {
    const user1expectations = [
      createMinimalExpectationFor("user1", "repo-a"),
      createMinimalExpectationFor("user1", "repo-b"),
    ];
    const user1repositories = await getRepositories(config, {
      service: "github",
      account: "user1",
    });
    expect(user1repositories).toCloselyMatch(
      user1expectations,
      repositoryComparator,
    );

    const orgAexpectations = [createMinimalExpectationFor("orga", "repo-1")];
    const orgArepositories = await getRepositories(config, {
      account: "orga",
    });
    expect(orgArepositories).toCloselyMatch(
      orgAexpectations,
      repositoryComparator,
    );
  });

  test.only("All expected elements are present", async () => {
    for (const repository of await getRepositories(config)) {
      const expectation = await getExpectedDataFor(
        repository.account,
        repository.name,
      );
      expect(repository).toMatchObject(expectation);
    }
  });
});
