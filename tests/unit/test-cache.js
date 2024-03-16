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
});
