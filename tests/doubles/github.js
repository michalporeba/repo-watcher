"use strict";

import fs from "fs/promises";

class FakeGitHub {
  streamRepositories = async function* ({ name }) {
    const configuration = await objectFromFile("repositories.json");
    for (const repository of configuration[name]) {
      yield await objectFromFile(`${name}-${repository}.first.json`);
    }
  };

  getLanguages = async function (owner, repo) {
    return await objectFromFile(`${owner}-${repo}.languages.json`);
  };
}

class ThrowingGitHub {
  // eslint-disable-next-line require-yield
  streamRepositories = async function* ({ type, name }) {
    throw new Error(
      `This call to streamRepositories(${type}, ${name}) should not have been made!`,
    );
  };

  getLanguages = async function (owner, repo) {
    // eslint-disable-next-line require-yield
    throw new Error(
      `This call to getLanguages(${owner}, ${repo}) should not have been made!`,
    );
  };
}

export const createFakeGitHub = async function () {
  return new FakeGitHub();
};

export const createThrowingGitHub = async function () {
  return new ThrowingGitHub();
};

const objectFromFile = async (path) => {
  return JSON.parse(await fs.readFile(`./tests/data/${path}`, "utf8"));
};
