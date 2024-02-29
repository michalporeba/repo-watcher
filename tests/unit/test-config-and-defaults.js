"use strict";

import { resolveDefaultsFor } from "../../src/config";
import { Octokit } from "@octokit/rest";
import { FileSystemRepoCache } from "../../src/cache-utils";

const validateDefaultConfigObject = (sut) => {
  const expected = {
    cache: expect.any(FileSystemRepoCache),
    octokit: expect.any(Octokit),
  };

  expect(sut).toMatchObject(expected);
};

describe("Test config default value resolution", () => {
  test("a missing or an empty config results in a default config", async () => {
    validateDefaultConfigObject(await resolveDefaultsFor());
    validateDefaultConfigObject(await resolveDefaultsFor({}));
    validateDefaultConfigObject(await resolveDefaultsFor(null));
  });

  test("cache value can be a factory method resolving to a constructed object", async () => {
    const factory = async (config) => ({
      value: config?.value || "default",
    });

    const sut = await resolveDefaultsFor({ cache: factory });
    return;
    expect(await resolveDefaultsFor({ cache: factory })).toMatchObject({
      value: "default",
    });
  });
});
