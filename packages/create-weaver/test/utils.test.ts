import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  emptyDir,
  formatTargetDir,
  isEmpty,
  isValidPackageName,
  pkgFromUserAgent,
  templatesDir,
  toValidPackageName,
} from "../src/utils.ts";

describe("formatTargetDir", () => {
  it("trims whitespace and trailing slashes", () => {
    expect(formatTargetDir("  my-game//  ")).toBe("my-game");
    expect(formatTargetDir("nested/dir/")).toBe("nested/dir");
  });
});

describe("isValidPackageName", () => {
  it.each(["game", "my-game", "@scope/game", "game.v2", "a~b"])(
    "accepts %s",
    (name) => {
      expect(isValidPackageName(name)).toBe(true);
    },
  );

  it.each(["My Game", "Game", ".hidden", "_private", "", "@scope/"])(
    "rejects %j",
    (name) => {
      expect(isValidPackageName(name)).toBe(false);
    },
  );
});

describe("toValidPackageName", () => {
  it.each([
    ["My Game", "my-game"],
    ["  Spaced   Out  ", "spaced-out"],
    [".hidden", "hidden"],
    ["_private", "private"],
    ["Ação & Café!", "a-o---caf-"],
  ])("turns %j into %j", (input, expected) => {
    expect(toValidPackageName(input)).toBe(expected);
    expect(isValidPackageName(toValidPackageName(input))).toBe(true);
  });
});

describe("pkgFromUserAgent", () => {
  it("reads the package manager name and version", () => {
    expect(
      pkgFromUserAgent("pnpm/12.19.0 npm/? node/v24.22.2 win32 x64"),
    ).toEqual({ name: "pnpm", version: "12.19.0" });
  });

  it("returns undefined without a user agent", () => {
    expect(pkgFromUserAgent(undefined)).toBeUndefined();
  });
});

describe("templatesDir", () => {
  it("points at the bundled templates", () => {
    expect(existsSync(join(templatesDir, "base", "common"))).toBe(true);
  });
});

describe("isEmpty / emptyDir", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "create-weaver-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("treats a folder with only .git as empty", async () => {
    expect(isEmpty(dir)).toBe(true);
    await mkdir(join(dir, ".git"));
    expect(isEmpty(dir)).toBe(true);
    await writeFile(join(dir, "file.txt"), "");
    expect(isEmpty(dir)).toBe(false);
  });

  it("removes everything but .git", async () => {
    await mkdir(join(dir, ".git"));
    await writeFile(join(dir, ".git", "HEAD"), "ref");
    await mkdir(join(dir, "src"));
    await writeFile(join(dir, "src", "index.js"), "");
    await writeFile(join(dir, "package.json"), "{}");

    emptyDir(dir);

    expect(await readdir(dir)).toEqual([".git"]);
    expect(await readdir(join(dir, ".git"))).toEqual(["HEAD"]);
  });

  it("ignores folders that don't exist", () => {
    expect(() => emptyDir(join(dir, "missing"))).not.toThrow();
  });
});
