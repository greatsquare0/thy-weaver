import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  colorizeEmiter,
  colorizeLabel,
  concat,
  devState,
  fancyLogFormater,
  resolveToProjectRoot,
  updateState,
  win2posixPath,
} from "../src/utils.ts";

// Strip ANSI color codes so assertions don't depend on the terminal
const plain = (value: string | null) =>
  // oxlint-disable-next-line no-control-regex
  value?.replace(/\u001b\[[0-9;]*m/g, "") ?? null;

describe("win2posixPath", () => {
  it("turns platform separators into forward slashes", () => {
    const path = join("a", "b", "c.txt");
    expect(win2posixPath(path)).toBe("a/b/c.txt");
  });

  it("normalizes redundant segments", () => {
    expect(win2posixPath(join("a", ".", "b", "..", "c"))).toBe("a/c");
  });
});

describe("resolveToProjectRoot", () => {
  it("resolves against the current working directory", () => {
    expect(resolveToProjectRoot("src")).toBe(resolve(process.cwd(), "src"));
  });
});

describe("concat", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "weaver-concat-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("joins files in order with a blank line between them", async () => {
    await writeFile(join(dir, "a.js"), "const a = 1;");
    await writeFile(join(dir, "b.js"), "const b = 2;");

    const result = await concat([join(dir, "a.js"), join(dir, "b.js")]);

    expect(result).toBe("const a = 1;\n\nconst b = 2;");
  });

  it("returns an empty string for no files", async () => {
    expect(await concat([])).toBe("");
  });

  it("bails out when one of the paths is a directory", async () => {
    await writeFile(join(dir, "a.js"), "a");
    await mkdir(join(dir, "folder"));

    expect(await concat([join(dir, "a.js"), join(dir, "folder")])).toBe(
      undefined,
    );
  });

  it("writes to the output file instead of returning", async () => {
    await writeFile(join(dir, "a.css"), "a {}");
    const output = join(dir, "out", "bundle.css");

    const result = await concat([join(dir, "a.css")], output);

    expect(result).toBeUndefined();
    await expect
      .poll(() => readFile(output, "utf8").catch(() => ""))
      .toBe("a {}");
  });
});

describe("log formatting", () => {
  it("labels emitters, padding BUNDLER and PLUGIN to line up", () => {
    expect(plain(colorizeEmiter("ROLLDOWN"))).toBe(" ROLLDOWN ");
    expect(plain(colorizeEmiter("BUNDLER"))).toBe("  BUNDLER ");
    expect(plain(colorizeEmiter("PLUGIN"))).toBe("   PLUGIN ");
  });

  it("has no label for progress messages", () => {
    expect(colorizeLabel("PROGRESS")).toBeNull();
    expect(plain(colorizeLabel("ERROR"))).toBe(" ERROR ");
  });

  it("includes the message, cause and stack", () => {
    const output = plain(
      fancyLogFormater("TWEENODE", "ERROR", {
        message: "Failed",
        cause: "bad passage",
        stack: "at line 1",
      }),
    );

    expect(output).toContain(" TWEENODE ");
    expect(output).toContain(" ERROR  Failed");
    expect(output).toContain("bad passage");
    expect(output).toContain("at line 1");
  });

  it("leaves out missing optional fields", () => {
    const output = plain(
      fancyLogFormater("ROLLDOWN", "PROGRESS", { message: "Running" }),
    );

    expect(output).toBe(" ROLLDOWN   Running");
  });
});

describe("dev state", () => {
  it("stores the last compiled HTML", () => {
    updateState("<html>story</html>");
    expect(devState.html).toBe("<html>story</html>");
  });
});
