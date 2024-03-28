"use strict";

import { fetchRepositories, getRepositories } from "../../src";

import {
  getAllTestAccounts,
  getExpectedDataFor,
} from "../data/test-data-utils";

import customJestExtensions from "../data/jest-extensions";
import { createTestConfig } from "../utils/config";

expect.extend(customJestExtensions);

describe("Fetching can be split into multiple batches", () => {
  test("Even api limit of 1 is not a problem", async () => {
    const config = await createTestConfig();
    for (let i = 0; i < 10; i++) {
      config.github.setRemainingLimit(1);
      await fetchRepositories(config, getAllTestAccounts());
    }

    for (const repository of await getRepositories(config)) {
      const expectation = await getExpectedDataFor(
        repository.account,
        repository.name,
      );
      expect(repository).toMatchObject(expectation);
    }
  });
});
