import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ThyWevearOptions } from "../src/config/config_types.ts";
import {
  copyStaticMounts,
  findStaticAsset,
  resolveStaticMounts,
} from "../src/static_assets.ts";

let root: string;
let dist: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "weaver-assets-"));
  dist = join(root, "dist");
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const write = async (file: string, content = file) => {
  await mkdir(dirname(join(root, file)), { recursive: true });
  await writeFile(join(root, file), content);
};

const config = (bundler: object) =>
  ({
    bundler: {
      watcherDelay: 0,
      filesystem: { projectFiles: { fontsDir: "src/assets/fonts/" } },
      ...bundler,
    },
  }) as ThyWevearOptions;

const mounts = (bundler: object = {}) =>
  resolveStaticMounts(config(bundler), root);

describe("resolveStaticMounts", () => {
  it("includes the fonts folder as optional", () => {
    expect(mounts()).toEqual([
      {
        source: join(root, "src/assets/fonts"),
        target: "fonts",
        optional: true,
      },
    ]);
  });

  it("adds additionalAssets after the fonts, normalizing the output", () => {
    const result = mounts({
      additionalAssets: [
        { input: "extra/licenses", output: "./docs/licenses/" },
        { input: "extra/readme.txt", output: "readme.txt" },
        { input: "public", output: "." },
      ],
    });

    expect(result.slice(1)).toEqual([
      {
        source: join(root, "extra/licenses"),
        target: "docs/licenses",
        optional: false,
      },
      {
        source: join(root, "extra/readme.txt"),
        target: "readme.txt",
        optional: false,
      },
      { source: join(root, "public"), target: "", optional: false },
    ]);
  });

  it.each(["../outside", "a/../../outside", "/abs/path", "C:\\abs"])(
    "rejects outputs outside dist/ (%s)",
    (output) => {
      expect(() =>
        mounts({ additionalAssets: [{ input: "public", output }] }),
      ).toThrow(/inside dist/);
    },
  );

  it("rejects incomplete entries", () => {
    expect(() => mounts({ additionalAssets: [{ input: "public" }] })).toThrow(
      /"input" and an "output"/,
    );
  });
});

describe("copyStaticMounts", () => {
  it("copies fonts, folders and files into dist/", async () => {
    await write("src/assets/fonts/inter.woff2", "font");
    await write("extra/licenses/font.txt", "license");
    await write("extra/readme.txt", "readme");
    await write("public/robots.txt", "robots");

    const copied = await copyStaticMounts(
      mounts({
        additionalAssets: [
          { input: "extra/licenses", output: "docs/licenses" },
          { input: "extra/readme.txt", output: "readme.txt" },
          { input: "public", output: "." },
        ],
      }),
      dist,
    );

    expect(copied).toHaveLength(4);
    expect(await readFile(join(dist, "fonts/inter.woff2"), "utf8")).toBe(
      "font",
    );
    expect(await readFile(join(dist, "docs/licenses/font.txt"), "utf8")).toBe(
      "license",
    );
    expect(await readFile(join(dist, "readme.txt"), "utf8")).toBe("readme");
    expect(await readFile(join(dist, "robots.txt"), "utf8")).toBe("robots");
  });

  it("skips a missing fonts folder", async () => {
    expect(await copyStaticMounts(mounts(), dist)).toEqual([]);
    expect(existsSync(join(dist, "fonts"))).toBe(false);
  });

  it("fails on a missing additional asset", async () => {
    await expect(
      copyStaticMounts(
        mounts({ additionalAssets: [{ input: "nope", output: "nope" }] }),
        dist,
      ),
    ).rejects.toThrow(/not found/);
  });

  it("fails when a file would replace dist/ itself", async () => {
    await write("readme.txt");
    await expect(
      copyStaticMounts(
        mounts({ additionalAssets: [{ input: "readme.txt", output: "." }] }),
        dist,
      ),
    ).rejects.toThrow(/must be a file path/);
  });
});

describe("findStaticAsset", () => {
  beforeEach(async () => {
    await write("src/assets/fonts/inter.woff2", "font");
    await write("src/assets/fonts/sub dir/a.woff", "nested");
    await write("extra/readme.txt", "readme");
    await write("public/robots.txt", "robots");
    await write("public/fonts/inter.woff2", "override");
    await write("secret.txt", "secret");
  });

  const all = () =>
    mounts({
      additionalAssets: [
        { input: "extra/readme.txt", output: "docs/readme.txt" },
        { input: "public", output: "." },
      ],
    });

  it("maps folder mounts", async () => {
    expect(await findStaticAsset("/fonts/sub%20dir/a.woff", mounts())).toBe(
      join(root, "src/assets/fonts/sub dir/a.woff"),
    );
  });

  it("maps file mounts and the dist/ root", async () => {
    expect(await findStaticAsset("/docs/readme.txt", all())).toBe(
      join(root, "extra/readme.txt"),
    );
    expect(await findStaticAsset("/robots.txt?v=2", all())).toBe(
      join(root, "public/robots.txt"),
    );
  });

  it("lets later mounts win, like copying does", async () => {
    expect(await findStaticAsset("/fonts/inter.woff2", all())).toBe(
      join(root, "public/fonts/inter.woff2"),
    );
  });

  it.each([
    "/",
    "/index.html",
    "/fonts/missing.woff",
    "/fonts",
    "/media/a.png",
  ])("ignores %s", async (path) => {
    expect(await findStaticAsset(path, all())).toBeUndefined();
  });

  it.each([
    "/fonts/../../../secret.txt",
    "/fonts/%2e%2e/%2e%2e/%2e%2e/secret.txt",
    "/%E0%A4%A",
  ])("never leaves the mounted folders (%s)", async (path) => {
    expect(await findStaticAsset(path, mounts())).toBeUndefined();
  });
});
