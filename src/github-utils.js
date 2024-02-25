"use strict";

import { Octokit } from "@octokit/rest";

export const GITHUB_PAGESIZE = 100;
export const GITHUB_HEADERS = {
  "X-GitHub-Api-Version": "2022-11-28",
};

export const createOctokit = async () => {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
};
