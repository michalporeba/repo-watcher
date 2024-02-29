import { createOctokit } from "../../src/github-utils";

describe("Test rate limits octokit plugin", () => {
  test("Rate limit plugin is available", async () => {
    const octokit = await createOctokit();
    var response = await octokit.rest.rateLimit.get();
    const remaining = response.data.rate.remaining;
    var rate = octokit.getRateInfo();
    expect(rate.remaining).toEqual(remaining);
  });
});
