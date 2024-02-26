"use strict";

import { createCache } from "../../src/cache-utils";

describe("Test file system cache", () => {
  test("Value stored can be retrieved", async () => {
    const config = { cache: { type: "fs" } };
    const cache = await createCache(config);
    const data = { value: 42, label: "fourty two" };
    await cache.set("test", data);
    expect(await cache.get("test")).toMatchObject(data);
  });
});
