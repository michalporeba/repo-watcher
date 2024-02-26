"use strict";

import { createCache } from "../../src/cache-utils";

describe("Test file system cache", () => {
  test("Ensure full value lifecycle is supported", async () => {
    const config = { cache: { type: "fs" } };
    const cache = await createCache(config);

    const key = "test";
    await cache.remove(key);
    expect(await cache.get(key)).toBeUndefined();

    const data = { value: 42, label: "fourty two" };
    await cache.set(key, data);
    expect(await cache.get(key)).toMatchObject(data);

    await cache.update(key, { label: "pedwardeg dau", translated: true });
    const translated = {
      value: 42,
      label: "pedwardeg dau",
      translated: true,
    };
    expect(await cache.get(key)).toMatchObject(translated);

    await cache.remove(key);
    expect(await cache.get(key)).toBeUndefined();
  });
});
