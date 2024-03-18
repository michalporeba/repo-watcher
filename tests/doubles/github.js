"use strict";

import fs from "fs/promises";

class FakeGitHub {
  streamRepositories = streamRepositories;
  getLanguages = getLanguages;
  getRemainingLimit = async function () {
    return 100;
  };
}

class DepletedGitHub {
  reason = "rate limit is too low!";
  // eslint-disable-next-line require-yield
  streamRepositories = async function* ({ type, name }) {
    unexpectedCall("streamRepositories", [type, name], this.reason);
  };

  getLanguages = async function (owner, repo) {
    // eslint-disable-next-line require-yield
    unexpectedCall("getLanguages", [owner, repo], this.reason);
  };

  getRemainingLimit = async function () {
    return 8;
  };
}

class ThrowingGitHub {
  // eslint-disable-next-line require-yield
  streamRepositories = async function* ({ type, name }) {
    unexpectedCall("streamRepositories", [type, name]);
  };

  getLanguages = async function (owner, repo) {
    // eslint-disable-next-line require-yield
    unexpectedCall("getLanguages", [owner, repo]);
  };

  getRemainingLimit = async function () {
    // eslint-disable-next-line require-yield
    unexpectedCall("getRemainingLimit");
  };
}

export const createDepletedGitHub = async function () {
  return new DepletedGitHub();
};

export const createFakeGitHub = async function () {
  return new FakeGitHub();
};

export const createThrowingGitHub = async function () {
  return new ThrowingGitHub();
};

const streamRepositories = async function* ({ name }) {
  const configuration = await objectFromFile("repositories.json");
  for (const repository of configuration[name]) {
    yield await objectFromFile(`${name}-${repository}.first.json`);
  }
};

const getLanguages = async function (owner, repo) {
  return await objectFromFile(`${owner}-${repo}.languages.json`);
};

const unexpectedCall = (functionName, parameters = []) => {
  const values = parameters.join(", ");
  const message = `This call to ${functionName}(${values}) should not have been made!`;
  throw new Error(message);
};

const objectFromFile = async (path) => {
  return JSON.parse(await fs.readFile(`./tests/data/${path}`, "utf8"));
};
