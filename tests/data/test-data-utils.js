"use strict";

import fs from "fs/promises";

const objectFromFile = async (path) => {
  return JSON.parse(await fs.readFile(path, "utf8"));
};

export const getExpectedDataFor = async (account, repo) => {
  return await objectFromFile(`${account}-${repo}.json`);
};

export const getMockResponseForGetRepositories = async (account) => {
  console.log("WORKING!");
  return await objectFromFile(`get-repos-for-${account}-response.json`);
};
