import { Octokit } from "@octokit/rest";

const GITHUB_PAGESIZE = 100;
const GITHUB_HEADERS = {
  "X-GitHub-Api-Version": "2022-11-28",
};

export const createOctokit = () => {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
};

export const createRequestForUserRepos = (username) => {
  return {
    username: username,
    type: "owner",
    per_page: GITHUB_PAGESIZE,
    headers: GITHUB_HEADERS,
  };
};

export const createRequestForOrgRepos = (org) => {
  return {
    org: org,
    type: "public",
    per_page: GITHUB_PAGESIZE,
    headers: GITHUB_HEADERS,
  };
};
