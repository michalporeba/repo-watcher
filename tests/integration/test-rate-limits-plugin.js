import { createOctokit } from "../../src/github-utils";

describe("Test rate limits octokit plugin", () => {
  test("Rate limit plugin is available", async () => {
    const octokit = await createOctokit();
    const response = await octokit.rest.rateLimit.get();
    const remaining = response.data.rate.remaining;
    const rate = await octokit.getRateInfo();
    expect(rate.remaining).toEqual(remaining);
  });

  test("Rate limit works even if no requests have been made", async () => {
    const octokit = await createOctokit();
    const rateInfo = await octokit.getRateInfo();
    expect(rateInfo).toMatchObject({
      remaining: expect.any(Number),
    });
  });

  test("Multiple checks of limit don't reduce what's available", async () => {
    const octokit = await createOctokit();
    const first = await octokit.getRateInfo();
    const second = await octokit.getRateInfo();

    expect(first).toMatchObject(second);
  });
});
