"use strict";

import fs from "fs/promises";

const objectFromFile = async (path) => {
  return JSON.parse(await fs.readFile(`./tests/data/${path}`, "utf8"));
};

export const getExpectedDataFor = async (account, repo) => {
  return await objectFromFile(`${account}-${repo}.json`);
};

export const getMockResponseForGetRepositories = async (account) => {
  return await objectFromFile(`get-repos-for-${account}-response.json`);
};

export const getMockDataForGetRepositories = (_, parameters) => {
  let account = "";
  if (parameters?.type === "owner") {
    account = parameters.username;
  }
  if (parameters?.type === "public") {
    account = parameters.org;
  }
  if (account) {
    return Promise.resolve(getMockResponseForGetRepositories(account));
  }
  throw "Incorrect API request";
};

export const repositoryComparator = (expected, actual) => {
  return expected.account === actual.account && expected.name === actual.name;
};

export const createMockOctokit = async () => {
  const { Octokit } = await import("@octokit/rest");
  return new Octokit();
};
