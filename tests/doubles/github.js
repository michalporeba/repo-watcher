"use strict";

import fs from "fs/promises";

class FakeGitHub {
  streamRepositories = async function* ({ name }) {
    const configuration = await objectFromFile("repositories.json");
    for (const repository of configuration[name]) {
      yield await objectFromFile(`${name}-${repository}.json`);
    }
  };
}

class ThrowingGitHub {
  // eslint-disable-next-line require-yield
  streamRepositories = async function* ({ type, name }) {
    throw new Error(
      `This call to streamRepositories(${type}, ${name})should not been made!`,
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
