"use strict";

import { createCache } from "../../src/cache-utils";

describe("Test file system cache", () => {
  test("Ensure full value lifecycle is supported", async () => {
    const config = { type: "fs" };
    const cache = await createCache(config);
    const key = "test";
    const data = { value: 42, label: "fourty two" };
    const translated = {
      value: 42,
      label: "pedwardeg dau",
      translated: true,
    };

    await cache.remove(key);
    expect(await cache.get(key)).toBeUndefined();

    await cache.set(key, data);
    expect(await cache.get(key)).toMatchObject(data);

    await cache.update(key, { label: "pedwardeg dau", translated: true });
    expect(await cache.get(key)).toMatchObject(translated);

    await cache.remove(key);
    expect(await cache.get(key)).toBeUndefined();
  });

  test("Custom cache and key work too", async () => {
    const primaryCache = await createCache({ type: "fs" });
    const secondaryCache = await createCache({
      type: "fs",
      path: "cache/secondary",
    });
    const key = "path/like/key";
    const data = { hello: "world" };

    await primaryCache.remove(key);
    await secondaryCache.remove(key);

    expect(await primaryCache.get(key)).toBeUndefined();
    expect(await secondaryCache.get(key)).toBeUndefined();

    await secondaryCache.set(key, data);

    expect(await secondaryCache.get(key)).toMatchObject(data);
    expect(await primaryCache.get(key)).toBeUndefined();
  });
});
