"use strict";

import fs from "fs/promises";

class ConfigurableFakeGitHub {
  #remainingLimit = 1_000;
  #throwOnCall = false;
  #throwOnAllCalls = false;

  streamRepositories = async function* ({ type, name }) {
    if (this.#throwOnAllCalls) {
      return unexpectedCall("streamRepositories", [type, name]);
    }
    if (this.#remainingLimit <= 0) {
      return apiRateExceeded("streamRepositories", [type, name]);
    }
    this.#remainingLimit -= 1;

    const configuration = await objectFromFile("repositories.json");
    for (const repository of configuration[name]) {
      yield await objectFromFile(`${name}-${repository}.first.json`);
    }
  };

  getLanguages = async function (owner, repo) {
    if (this.#throwOnCall || this.#throwOnAllCalls) {
      return unexpectedCall("getLanguages", [owner, repo]);
    }
    if (this.#remainingLimit <= 0) {
      return apiRateExceeded("getLanguages", [owner, repo]);
    }

    this.#remainingLimit -= 1;
    return getExpectedLanguages(owner, repo);
  };

  getRemainingLimit = async function () {
    // this always works, regardless of the actual limit
    // and doesn't reduce the availabile limit
    return Promise.resolve(this.#remainingLimit);
  };

  setRemainingLimit = function (newLimit) {
    this.#remainingLimit = newLimit;
  };

  throwOnCall = async function (value = true) {
    this.#throwOnCall = value;
  };

  throwOnAllCalls = async function (value = true) {
    this.#throwOnAllCalls = value;
  };
}

export const createConfigurableFakeGitHub = async function () {
  return new ConfigurableFakeGitHub();
};

const getExpectedLanguages = async function (owner, repo) {
  return await objectFromFile(`${owner}-${repo}.languages.json`);
};

const unexpectedCall = (functionName, parameters = []) => {
  const values = parameters.join(", ");
  const message = `The call to ${functionName}(${values}) should not have been made!`;
  throw new Error(message);
};

const apiRateExceeded = (functionName, parameters = []) => {
  const values = parameters.join(", ");
  const message = `GitHub API call was attempted ${functionName}(${values}), but the API limit is exhausted!`;
  return new Error(message);
};

const objectFromFile = async (path) => {
  return JSON.parse(await fs.readFile(`./tests/data/${path}`, "utf8"));
};
