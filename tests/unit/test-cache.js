import { createCache } from "../../src/cache/utils";
import { FileSystemCache } from "../../src/cache/file-system";
import { NoopCache } from "../../src/cache/no-op";

describe("Ensure behaviour of the default cache utils", () => {
  test("By default a file system cache is created", async () => {
    const sut = await createCache();
    expect(sut).toBeInstanceOf(FileSystemCache);
  });

  test("The fs type returns a file system cache", async () => {
    const sut = await createCache({ type: "fs" });
    expect(sut).toBeInstanceOf(FileSystemCache);
  });

  test("The noop type returns a no-op cache", async () => {
    const sut = await createCache({ type: "noop" });
    expect(sut).toBeInstanceOf(NoopCache);
  });

  test("The unexpected type results in an exception", async () => {
    const sut = async () => {
      await createCache({ type: "something-unsupported" });
    };

    expect(sut()).rejects.toThrow();
  });

  test("Peeking non-existing data returns undefined", async () => {
    const cache = await createCache({ type: "mem" });
    const result = await cache.peek("test");
    expect(result).toBeUndefined();
  });

  test("Peeking without staging first pulls data from the cache", async () => {
    const cache = await createCache({ type: "fs" });
    const expected = { value: 42 };
    await cache.set("test", expected);
    const result = await cache.peek("test");
    expect(result).toMatchObject(expected);
  });

  test("Peaking gets the latest staged version while the get gets older", async () => {
    const cache = await createCache({ type: "fs" });
    await cache.set("test", 42);
    await cache.stage("test", 43);
    expect(await cache.peek("test")).toEqual(43);
    expect(await cache.get("test")).toEqual(42);
  });

  test("Flushing updates the cache with staged value", async () => {
    const cache = await createCache({ type: "fs" });
    expect(await cache.get("test")).toEqual(42);
    await cache.stage("test", 43);
    await cache.set("test", 42);
    await cache.flush();
    await cache.set("test", 43);
  });
});
