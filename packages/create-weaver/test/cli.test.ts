import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CliError,
  parseArgs,
  resolveAddonList,
  resolveTemplate,
} from "../src/cli.ts";

const ids = (addons?: { id: string }[]) => addons?.map((addon) => addon.id);

describe("resolveTemplate", () => {
  it.each([
    "sugarcube",
    "sugarcube-2",
    "SugarCube",
    "sugarcube@2.37.3",
    "sugarcube-2@2.37.3",
  ])("accepts %s", (value) => {
    expect(resolveTemplate(value)).toMatchObject({
      id: "sugarcube-2",
      version: "2.37.3",
    });
  });

  it.each(["harlowe", "sugarcube@1.0.0", ""])("rejects %j", (value) => {
    expect(() => resolveTemplate(value)).toThrow(CliError);
  });
});

describe("resolveAddonList", () => {
  it("splits commas, merges repeats and keeps the declaration order", () => {
    expect(ids(resolveAddonList(["linting, tailwind", "typescript"]))).toEqual([
      "tailwind",
      "typescript",
      "linting",
    ]);
  });

  it("accepts none", () => {
    expect(resolveAddonList(["none"])).toEqual([]);
  });

  it("rejects unknown addons", () => {
    expect(() => resolveAddonList(["typescript,react"])).toThrow(/"react"/);
  });
});

describe("parseArgs", () => {
  it("leaves everything to the prompts without arguments", () => {
    expect(parseArgs([])).toEqual({
      help: false,
      version: false,
      interactive: undefined,
    });
  });

  it("reads every option", () => {
    const options = parseArgs([
      "my-game/",
      "-t",
      "sugarcube",
      "--addons=typescript",
      "-a",
      "tailwind",
      "--package-name",
      "@me/game",
      "--overwrite",
      "-y",
    ]);

    expect(options).toMatchObject({
      targetDir: "my-game",
      packageName: "@me/game",
      existing: "remove",
      interactive: false,
    });
    expect(options.storyFormatVersion?.id).toBe("sugarcube-2");
    expect(ids(options.addons)).toEqual(["tailwind", "typescript"]);
  });

  it.each([
    [["--interactive"], true],
    [["--no-interactive"], false],
    [["--yes"], false],
  ])("%j sets interactive to %s", (args, expected) => {
    expect(parseArgs(args).interactive).toBe(expected);
  });

  it("reads --ignore-existing", () => {
    expect(parseArgs(["--ignore-existing"]).existing).toBe("ignore");
  });

  it.each([
    [["--bogus"], /--bogus/],
    [["-t", "sugarcube", "-z"], /-z/],
    [["a", "b"], /single project-dir/],
    [["--overwrite", "--ignore-existing"], /either/],
    [["--yes", "--interactive"], /either/],
    [["-t"], /argument missing/],
    [["--addons"], /argument missing/],
    [["--addons="], /needs a value/],
    [["--package-name", "Not Valid"], /Invalid package.json name/],
    [["-t", "harlowe"], /Unknown template/],
  ])("rejects %j", (args, message) => {
    expect(() => parseArgs(args)).toThrow(message);
  });
});

describe("create-weaver binary", () => {
  const entry = fileURLToPath(new URL("../src/index.ts", import.meta.url));
  let dir: string;

  // Spawned without a TTY, like in CI or a devcontainer build
  const run = (...args: string[]) =>
    spawnSync(process.execPath, [entry, ...args], {
      cwd: dir,
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30_000,
    });

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "create-weaver-cli-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("scaffolds from arguments without prompting", async () => {
    const result = run("game", "-t", "sugarcube", "-a", "typescript");

    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(existsSync(join(dir, "game", "thyweaver.config.ts"))).toBe(true);

    const pkg = JSON.parse(
      await readFile(join(dir, "game", "package.json"), "utf8"),
    );
    expect(pkg.name).toBe("game");
  });

  it("uses the defaults when nothing is given", () => {
    const result = run();

    expect(result.status).toBe(0);
    expect(
      existsSync(join(dir, "thyweaver-project", "thyweaver.config.js")),
    ).toBe(true);
  });

  it("refuses a non empty folder unless told what to do", async () => {
    await mkdir(join(dir, "game"));
    await writeFile(join(dir, "game", "notes.txt"), "keep me");

    const refused = run("game", "-y");
    expect(refused.status).toBe(1);
    expect(refused.stdout + refused.stderr).toMatch(/--overwrite/);
    expect(existsSync(join(dir, "game", "package.json"))).toBe(false);

    expect(run("game", "-y", "--ignore-existing").status).toBe(0);
    expect(existsSync(join(dir, "game", "notes.txt"))).toBe(true);
    expect(existsSync(join(dir, "game", "package.json"))).toBe(true);

    expect(run("game", "-y", "--overwrite").status).toBe(0);
    expect(existsSync(join(dir, "game", "notes.txt"))).toBe(false);
    expect(existsSync(join(dir, "game", "package.json"))).toBe(true);
  });

  it("fails on bad arguments", () => {
    const result = run("-a", "react");
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toMatch(/Unknown addon "react"/);
  });
});
