"use strict";

import { resolveDefaultsFor } from "../../src/config";
import { FileSystemCache } from "../../src/cache/file-system";
import { NoopCache } from "../../src/cache/no-op";
import { GitHub } from "../../src/github";

const validateDefaultConfigObject = (sut) => {
  const expected = {
    cache: expect.any(FileSystemCache),
    github: expect.any(GitHub),
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
    expect(sut.cache).toBeInstanceOf(NoopCache);
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

  test("github value can be a factory method resolving to a constructed object", async () => {
    const factory = async () => ({
      value: "default",
    });

    const sut = await resolveDefaultsFor({ github: factory });
    expect(sut.github).toMatchObject({
      value: "default",
    });
  });

  test("github can have a factory method", async () => {
    const factory = async (config) => ({
      value: config?.value || "default",
    });

    const test1 = await resolveDefaultsFor({ github: { create: factory } });
    expect(test1.github).toMatchObject({
      value: "default",
    });

    const test2 = await resolveDefaultsFor({
      github: { create: factory, value: 42 },
    });
    expect(test2.github).toMatchObject({
      value: 42,
    });
  });

  test("the config can be resolved multiple times without affecting the output", async () => {
    const options = { cache: { type: "fs" } };
    const first = await resolveDefaultsFor(options);
    const second = await resolveDefaultsFor(first);
    validateDefaultConfigObject(second);
  });
});
