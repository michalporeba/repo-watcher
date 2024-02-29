"use strict";

import { resolveDefaultsFor } from "../../src/config";
import { Octokit } from "@octokit/rest";
import { FileSystemRepoCache, NoopRepoCache } from "../../src/cache-utils";

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

  test("cache value is created based on the config", async () => {
    const sut = await resolveDefaultsFor({ cache: { type: "noop" } });
    expect(sut.cache).toBeInstanceOf(NoopRepoCache);
  });

  test("cache value can be a factory method resolving to a constructed object", async () => {
    const factory = async () => ({
      value: "default",
    });

    const sut = await resolveDefaultsFor({ cache: factory });
    expect(sut.cache).toMatchObject({
      value: "default",
    });
  });

  test("cache can have a factory method", async () => {
    const factory = async (config) => ({
      value: config?.value || "default",
    });

    const test1 = await resolveDefaultsFor({ cache: { create: factory } });
    expect(test1.cache).toMatchObject({
      value: "default",
    });

    const test2 = await resolveDefaultsFor({
      cache: { create: factory, value: 42 },
    });
    expect(test2.cache).toMatchObject({
      value: 42,
    });
  });
});
