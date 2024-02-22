import { getRepositories } from "../../src/index";
import {
  getExpectedDataFor,
  getMockResponseForGetRepositories,
} from "../data/test-data-utils";
import { jest } from "@jest/globals";

const getMockDataForGetRepositories = (endpoint, parameters) => {
  if (parameters.type === "owner") {
    console.log("In User");
    console.log(endpoint);
    return Promise.resolve(
      getMockResponseForGetRepositories(parameters.username),
    );
  }
  return Promise.resolve([]);
};

jest.unstable_mockModule("@octokit/rest", () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    paginate: jest.fn().mockImplementation(getMockDataForGetRepositories),
  })),
}));

describe("Test getting GitHub repos", () => {
  it("returns mock data", async () => {
    const { Octokit } = await import("@octokit/rest");
    console.log(Octokit);
    console.log(Octokit.paginate);
  });

  test("get all user repos", async () => {
    const accounts = [{ name: "user1", type: "user" }];

    const repositories = getRepositories(accounts);
    expect(repositories).toHaveLength(2);
    repositories.forEach((repository) => {
      expect(repository).toMatchObject(getExpectedDataFor("user1", "repo-a"));
    });
  });
});
