import { getRepositories } from "../../src/index";
import {
  getExpectedDataFor,
  getMockResponseForGetRepositories,
} from "../data/test-data-utils";
import { jest } from "@jest/globals";

// the idea is that one Octokit.paginate is used to fetch data
// in getUserRepositories (index.js), then a fixed dataset will be returned.
const getMockDataForGetRepositories = (endpoint, parameters) => {
  if (parameters.type === "owner") {
    console.log("In get Mock Data for Get Repositories (User)");
    return Promise.resolve(
      getMockResponseForGetRepositories(parameters.username),
    );
  }
  return Promise.resolve([]);
};

jest.unstable_mockModule("@octokit/rest", () => {
  const original = jest.requireActual("@octokit/rest");
  console.log("MOCKING OCTOKIT");
  return {
    ...original,
    Octokit: jest.fn().mockImplementation(() => {
      return {
        ...new original.Octokit(),
        paginate: jest.fn().mockImplementation(getMockDataForGetRepositories),
      };
    }),
  };
});

const createMockOctokit = async () => {
  const { Octokit } = await import("@octokit/rest");
  return new Octokit();
};

describe("Test getting GitHub repos", () => {
  test("get all user repos", async () => {
    const accounts = [{ name: "user1", type: "user" }];

    const repositories = getRepositories(accounts, {
      createOctokit: createMockOctokit,
    });
    expect(repositories).toHaveLength(2);
    repositories.forEach((repository) => {
      expect(repository).toMatchObject(getExpectedDataFor("user1", "repo-a"));
    });

    // the test looks very simplistic. I've got a fixed mock API response
    // and want to have a prescribed data object at the back of it.
    // I will be using json files in the data folder to store the expected objects
    // due to their size.
    // Ultimately the resulting object, for example user1.repo-a.json will be more complex
    // and it will be the result of multiple API calls and potentially backfilling from cache.
    // Then this test setup will make more sense. I hope.
  });
});
