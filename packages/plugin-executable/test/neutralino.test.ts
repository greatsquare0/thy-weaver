import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { strToU8, zipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { binaryFileName, ensureNeutralinoRuntime } from "../src/neutralino.ts";

const releaseZip = zipSync({
  "neutralino-win_x64.exe": strToU8("win binary"),
  "neutralino-linux_x64": strToU8("linux binary"),
  "neutralino-mac_universal": strToU8("mac binary"),
  "README.md": strToU8("not a binary"),
});

const respond = (body: Uint8Array | string, status = 200) =>
  new Response(typeof body === "string" ? body : Buffer.from(body), {
    status,
    statusText: status === 200 ? "OK" : "Not Found",
  });

let cache: string;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  cache = await mkdtemp(join(tmpdir(), "weaver-neutralino-"));
  fetchMock = vi.fn(async (url: string) =>
    url.endsWith(".zip") ? respond(releaseZip) : respond("client library"),
  );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(async () => {
  await rm(cache, { recursive: true, force: true });
});

describe("binaryFileName", () => {
  it("adds .exe only for Windows", () => {
    expect(binaryFileName("win_x64")).toBe("neutralino-win_x64.exe");
    expect(binaryFileName("linux_arm64")).toBe("neutralino-linux_arm64");
  });
});

describe("ensureNeutralinoRuntime", () => {
  it("downloads the release and extracts only the wanted binaries", async () => {
    const runtime = await ensureNeutralinoRuntime(
      "6.10.0",
      ["win_x64", "linux_x64"],
      cache,
    );

    expect(runtime.downloaded).toBe(true);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "https://github.com/neutralinojs/neutralinojs/releases/download/v6.10.0/neutralinojs-v6.10.0.zip",
      "https://github.com/neutralinojs/neutralino.js/releases/download/v6.10.0/neutralino.js",
    ]);
    expect(await readFile(runtime.binaries.win_x64, "utf8")).toBe("win binary");
    expect(await readFile(runtime.binaries.linux_x64, "utf8")).toBe(
      "linux binary",
    );
    expect(await readFile(runtime.client, "utf8")).toBe("client library");
    expect(runtime.client).toBe(
      join(cache, "neutralino", "6.10.0", "neutralino.js"),
    );
  });

  it("reuses the cache on the next run", async () => {
    await ensureNeutralinoRuntime("6.10.0", ["win_x64"], cache);
    fetchMock.mockClear();

    const runtime = await ensureNeutralinoRuntime("6.10.0", ["win_x64"], cache);

    expect(runtime.downloaded).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("downloads again when a new target is missing from the cache", async () => {
    await ensureNeutralinoRuntime("6.10.0", ["win_x64"], cache);
    fetchMock.mockClear();

    await ensureNeutralinoRuntime(
      "6.10.0",
      ["win_x64", "mac_universal"],
      cache,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fails when the release has no binary for a target", async () => {
    await expect(
      ensureNeutralinoRuntime("6.10.0", ["linux_armhf"], cache),
    ).rejects.toThrow('Neutralino v6.10.0 has no binary for "linux_armhf"');
  });

  it("reports failed downloads", async () => {
    fetchMock.mockResolvedValue(respond("", 404));

    await expect(
      ensureNeutralinoRuntime("0.0.0", ["win_x64"], cache),
    ).rejects.toThrow(/Failed to download .*neutralinojs-v0\.0\.0\.zip: 404/);
  });
});
