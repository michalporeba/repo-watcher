"use strict";

import { Octokit } from "@octokit/rest";

export const GITHUB_PAGESIZE = 100;
export const GITHUB_HEADERS = {
  "X-GitHub-Api-Version": "2022-11-28",
};

export const createOctokit = async () => {
  const CustomOctokit = Octokit.plugin(rateLimitsPlugin);
  return new CustomOctokit({
    auth: process.env.GITHUB_TOKEN,
  });
};

const rateLimitsPlugin = (octokit, options) => {
  // hook into the request lifecycle
  octokit.hook.wrap("request", async (request, options) => {
    const response = await request(options);
    octokit.rate = getReteInfoFromResponse(response);

    return response;
  });

  const getReteInfoFromResponse = (response) => ({
    remaining: parseInt(response.headers["x-ratelimit-remaining"]),
  });

  const getRateInfoByRequest = async (octokit) => {
    const { data } = await octokit.rest.rateLimit.get();
    return {
      remaining: data.rate.remaining,
    };
  };

  // the below will be added to the octokit object as top level members
  return {
    remainingRateLimit: null,
    getRateInfo: async () => {
      if (!octokit?.rate) {
        octokit.rate = await getRateInfoByRequest(octokit);
      }
      return octokit.rate;
    },
  };
};
