"use strict";

import fs from "fs/promises";

const objectFromFile = async (path) => {
  return JSON.parse(await fs.readFile(`./tests/data/${path}`, "utf8"));
};

export const getExpectedDataFor = async (account, repo) => {
  return await objectFromFile(`${account}-${repo}.expected.json`);
};

export const createMinimalExpectationFor = (account, name) => ({
  account,
  name,
});

export const getMockResponseForGetRepositories = async function (account) {
  return await objectFromFile(`get-repos-for-${account}-response.json`);
};

export const getRepositoriesFor = async function* (account) {
  const configuration = await objectFromFile("repositories.json");
  for (const repository of configuration[account]) {
    yield await objectFromFile(`${account}-${repository}.json`);
  }
};

export const repositoryComparator = (expected, actual) => {
  return expected.account === actual.account && expected.name === actual.name;
};
