import { createOctokit } from "../../src/github-utils";

describe("Test last request octokit plugin", () => {
  test("last request can be retrieved", async () => {
    const octokit = await createOctokit();
    var response = await octokit.rest.rateLimit.get();
    console.log(response);
    const remaining = response.data.rate.remaining;
    console.log(remaining);
    var indirectResponse = octokit.getRemainingRateLimit();
    expect(indirectResponse).toEqual(remaining);
  });
});
