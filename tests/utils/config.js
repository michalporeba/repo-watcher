"use strict";

import { resolveDefaultsFor } from "../../src/config";
import { createConfigurableFakeGitHub } from "../doubles/github";

export const createTestConfig = async function ({
  githubThrow,
  githubThrowAll,
} = {}) {
  const config = await resolveDefaultsFor({
    noRefreshSeconds: 0, // force API use for now, it will be removed
    cache: { type: "mem" },
    github: createConfigurableFakeGitHub,
  });
  if (githubThrow) {
    config.github.throwOnCall();
  }
  if (githubThrowAll) {
    config.github.throwOnAllCalls();
  }
  return config;
};
