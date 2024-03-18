"use strict";

import { Octokit } from "@octokit/rest";
import { GitHub } from "./github";

export const GITHUB_PAGESIZE = 100;
export const GITHUB_HEADERS = {
  "X-GitHub-Api-Version": "2022-11-28",
};

export const createGitHub = async (config = {}) => {
  const octokit = await createOctokit();
  return new GitHub(octokit, config);
};

export const createOctokit = async () => {
  const CustomOctokit = Octokit.plugin(rateLimitsPlugin);
  return new CustomOctokit({
    auth: process.env.GITHUB_TOKEN,
  });
};

const rateLimitsPlugin = (octokit, _options) => {
  // hook into the request lifecycle
  octokit.hook.wrap("request", async (request, options) => {
    const response = await request(options);
    octokit.rateInfo = getReteInfoFromResponse(response);

    return response;
  });

  const getReteInfoFromResponse = (response) => ({
    limit: parseInt(response.headers["x-ratelimit-limit"]),
    remaining: parseInt(response.headers["x-ratelimit-remaining"]),
    cooldown:
      parseInt(response.headers["x-ratelimit-remaining"]) - Date.now() / 1000,
  });

  const getRateInfoByRequest = async (octokit) => {
    // this call is not rate limited and will succeed even if rate limit is exhausted
    // if there is an exception throw it is caused by something else
    const { data } = await octokit.rest.rateLimit.get();
    return {
      limit: data.rate.limit,
      remaining: data.rate.remaining,
      cooldown: Date.now() / 1000 - data.rate.reset,
    };
  };

  // the below will be added to the octokit object as top level members
  return {
    rateInfo: null,
    getRateInfo: async () => {
      if (!octokit?.rateInfo) {
        octokit.rateInfo = await getRateInfoByRequest(octokit);
      }
      return octokit.rateInfo;
    },
  };
};
