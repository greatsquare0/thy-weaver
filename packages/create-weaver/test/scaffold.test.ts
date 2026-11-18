import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { glob } from "tinyglobby";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ADDONS, STORYFORMATS, type Addon } from "../src/constants.ts";
import { resolveAddons, scaffold } from "../src/scaffold.ts";

const sugarcube = STORYFORMATS.find((format) => format.id === "sugarcube")!
  .version![0];
const addon = (id: Addon["id"]) => ADDONS.find((entry) => entry.id === id)!;

let root: string;

beforeEach(async () => {
  root = join(await mkdtemp(join(tmpdir(), "create-weaver-")), "project");
});

afterEach(async () => {
  await rm(join(root, ".."), { recursive: true, force: true });
});

const readJson = async (path: string) =>
  JSON.parse(await readFile(join(root, path), "utf8"));

describe("resolveAddons", () => {
  it("adds linting when tailwind is selected, applying it first", () => {
    const ids = resolveAddons([addon("tailwind")]).map((entry) => entry.id);
    expect(ids).toEqual(["linting", "tailwind"]);
  });

  it("does not duplicate addons already selected", () => {
    const ids = resolveAddons([addon("linting"), addon("tailwind")]).map(
      (entry) => entry.id,
    );
    expect(ids).toEqual(["linting", "tailwind"]);
  });
});

describe("scaffold", () => {
  it("creates a JavaScript SugarCube project", async () => {
    scaffold({
      root,
      packageName: "my-game",
      storyFormatVersion: sugarcube,
      addons: [],
    });

    for (const file of [
      "thyweaver.config.js",
      "jsconfig.json",
      "src/assets/app/index.js",
      "src/assets/app/styles/main.css",
      "src/head_content.html",
      "src/story/Start.twee",
      ".gitignore",
      ".editorconfig",
    ]) {
      expect(existsSync(join(root, file)), file).toBe(true);
    }

    expect(existsSync(join(root, "thyweaver.config.ts"))).toBe(false);
    expect(existsSync(join(root, "_gitignore"))).toBe(false);
  });

  it("names the package and merges the story format's dependencies", async () => {
    scaffold({
      root,
      packageName: "my-game",
      storyFormatVersion: sugarcube,
      addons: [],
    });

    const pkg = await readJson("package.json");
    expect(pkg.name).toBe("my-game");
    expect(pkg.scripts).toMatchObject({
      dev: "weaver dev",
      build: "weaver build",
    });
    expect(pkg.dependencies).toHaveProperty("@thy-weaver/core");
    expect(pkg.devDependencies).toHaveProperty("@types/twine-sugarcube");
  });

  it("gives the story a fresh IFID", async () => {
    scaffold({
      root,
      packageName: "my-game",
      storyFormatVersion: sugarcube,
      addons: [],
    });

    const storyData = await readFile(
      join(root, "src/story/StoryData.twee"),
      "utf8",
    );
    const data = JSON.parse(storyData.slice(storyData.indexOf("{")));

    expect(data.ifid).toMatch(
      /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/,
    );
    expect(data.format).toBe("SugarCube");
    expect(data["format-version"]).toBe(sugarcube.version);
  });

  it("removes the .gitkeep placeholders", async () => {
    scaffold({
      root,
      packageName: "my-game",
      storyFormatVersion: sugarcube,
      addons: [],
    });

    expect(await glob("**/.gitkeep", { cwd: root, dot: true })).toEqual([]);
    // The folders themselves stay
    expect(existsSync(join(root, "src/assets/fonts"))).toBe(true);
  });

  it("creates a TypeScript project", async () => {
    scaffold({
      root,
      packageName: "ts-game",
      storyFormatVersion: sugarcube,
      addons: [addon("typescript")],
    });

    expect(existsSync(join(root, "thyweaver.config.ts"))).toBe(true);
    expect(existsSync(join(root, "tsconfig.json"))).toBe(true);
    expect(existsSync(join(root, "src/assets/app/index.ts"))).toBe(true);
    expect(existsSync(join(root, "thyweaver.config.js"))).toBe(false);

    const pkg = await readJson("package.json");
    expect(pkg.devDependencies).toHaveProperty("typescript");
    expect(pkg.devDependencies).toHaveProperty("@types/twine-sugarcube");
  });

  it("adds tailwind with linting, using the matching config flavour", async () => {
    scaffold({
      root,
      packageName: "styled-game",
      storyFormatVersion: sugarcube,
      addons: [addon("tailwind"), addon("typescript")],
    });

    const pkg = await readJson("package.json");
    expect(pkg.devDependencies).toHaveProperty("tailwindcss");
    expect(pkg.devDependencies).toHaveProperty("@tailwindcss/postcss");
    expect(pkg.devDependencies).toHaveProperty("prettier");
    expect(pkg.devDependencies).toHaveProperty("oxlint");

    const config = await readFile(join(root, "thyweaver.config.ts"), "utf8");
    expect(config).toContain("@tailwindcss/postcss");

    const css = await readFile(
      join(root, "src/assets/app/styles/main.css"),
      "utf8",
    );
    expect(css).toContain("tailwindcss");
  });

  it.each([
    ["tailwind first", ["tailwind", "linting"] as const],
    ["linting first", ["linting", "tailwind"] as const],
  ])("keeps the tailwind prettier plugin last (%s)", async (_, ids) => {
    scaffold({
      root,
      packageName: "order-game",
      storyFormatVersion: sugarcube,
      addons: ids.map(addon),
    });

    const prettierrc = await readJson(".prettierrc.json");
    expect(prettierrc.plugins.at(-1)).toBe("prettier-plugin-tailwindcss");
    expect(new Set(prettierrc.plugins).size).toBe(prettierrc.plugins.length);
  });

  it("does not repeat merged array entries", async () => {
    scaffold({
      root,
      packageName: "dedupe-game",
      storyFormatVersion: sugarcube,
      addons: ADDONS,
    });

    const { recommendations } = await readJson(".vscode/extensions.json");
    expect(new Set(recommendations).size).toBe(recommendations.length);
    expect(recommendations).toContain("bradlc.vscode-tailwindcss");
    expect(recommendations).toContain("EditorConfig.EditorConfig");
  });

  it("keeps the JS entry point when tailwind replaces the config", async () => {
    scaffold({
      root,
      packageName: "js-tailwind",
      storyFormatVersion: sugarcube,
      addons: [addon("tailwind")],
    });

    const config = await readFile(join(root, "thyweaver.config.js"), "utf8");
    expect(config).toContain(`entryPoint: "src/assets/app/index.js"`);
    expect(config).toContain(`plugins: [tailwind()]`);
  });

  it("leaves unrelated files in an existing folder alone", async () => {
    await mkdir(join(root, ".devcontainer"), { recursive: true });
    await writeFile(join(root, ".devcontainer", "devcontainer.json"), "{}");
    await writeFile(join(root, ".gitkeep"), "mine");

    scaffold({
      root,
      packageName: "existing",
      storyFormatVersion: sugarcube,
      addons: [],
    });

    expect(await readFile(join(root, ".gitkeep"), "utf8")).toBe("mine");
    expect(
      await readFile(join(root, ".devcontainer", "devcontainer.json"), "utf8"),
    ).toBe("{}");
    expect(existsSync(join(root, "package.json"))).toBe(true);
  });

  it("writes nothing when the template can't be rendered", () => {
    expect(() =>
      scaffold({
        root,
        packageName: "broken",
        storyFormatVersion: { ...sugarcube, id: "missing-format" },
        addons: [],
      }),
    ).toThrow(/missing-format/);
    expect(existsSync(root)).toBe(false);
  });

  it("writes valid JSON for every merged file", async () => {
    scaffold({
      root,
      packageName: "json-game",
      storyFormatVersion: sugarcube,
      addons: ADDONS,
    });

    const files = await glob("**/*.json", { cwd: root, dot: true });
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      // tsconfig/jsconfig allow comments, everything else must be plain JSON
      if (/(ts|js)config\.json$|\.vscode\//.test(file)) continue;
      await expect(readJson(file), file).resolves.toBeTypeOf("object");
    }
  });
});
