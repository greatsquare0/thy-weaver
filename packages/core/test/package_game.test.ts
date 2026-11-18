import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { toArchiveName, zipDirectory } from "../src/package_game.ts";

describe("toArchiveName", () => {
  it.each([
    [{ name: "my-game", version: "1.2.0" }, "my-game-1.2.0.zip"],
    [{ name: "@scope/My Game", version: "0.1.0" }, "My-Game-0.1.0.zip"],
    [{ name: "my-game" }, "my-game.zip"],
    [{ version: "1.0.0" }, "game-1.0.0.zip"],
    [{ name: "@scope/***" }, "game.zip"],
  ])("turns %j into %j", (input, expected) => {
    expect(toArchiveName(input)).toBe(expected);
  });
});

describe("zipDirectory", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "weaver-zip-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("zips nested files with posix paths, skipping the archive itself", async () => {
    await writeFile(join(dir, "index.html"), "<html></html>");
    await mkdir(join(dir, "media", "img"), { recursive: true });
    await writeFile(join(dir, "media", "img", "a.svg"), "<svg/>");
    // A stale archive from an earlier run must not end up inside the new one
    const archive = join(dir, "game.zip");
    await writeFile(archive, "stale");

    const { entries } = await zipDirectory(dir, archive);
    const files = unzipSync(new Uint8Array(await readFile(archive)));

    expect(entries).toBe(2);
    expect(Object.keys(files).sort()).toEqual(["index.html", "media/img/a.svg"]);
    expect(strFromU8(files["media/img/a.svg"]!)).toBe("<svg/>");
  });
});
