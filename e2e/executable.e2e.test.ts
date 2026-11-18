import { existsSync } from "node:fs";
import { cp, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { currentPlatformTarget } from "../packages/plugin-executable/src/options.ts";
import {
  cacheDir,
  createProject,
  runWeaver,
  workspacePackages,
  type RunResult,
  type TestProject,
} from "./helpers.ts";

// @electron/asar is a dependency of the plugin, not of the repo root
const pluginRequire = createRequire(
  join(workspacePackages["plugin-executable"], "package.json"),
);
const asar: typeof import("@electron/asar") = await import(
  pathToFileURL(pluginRequire.resolve("@electron/asar")).href
);

const target = currentPlatformTarget();
const appDir = `dist-app/e2e-game-${target}`;
const executable = `${appDir}/e2e-game${target.startsWith("win") ? ".exe" : ""}`;

// Neutralino release downloads are cached between runs
const neutralinoCache = join(cacheDir, "neutralino");
const projectNeutralino = "node_modules/.lib-weaver-temp/neutralino";

let project: TestProject;
let result: RunResult;

beforeAll(async () => {
  project = await createProject({ link: ["plugin-executable"] });
  await project.write(
    "thyweaver.config.js",
    `import { defineConfig } from "@thy-weaver/core";
import executable from "@thy-weaver/plugin-executable";

export default defineConfig({
  bundler: { filesystem: { projectFiles: { entryPoint: "src/assets/app/index.js" } } },
  plugins: [executable({ targets: ["${target}"], windowTitle: "E2E Game" })],
});
`,
  );

  if (existsSync(neutralinoCache)) {
    await cp(neutralinoCache, project.path(projectNeutralino), {
      recursive: true,
    });
  }

  result = await runWeaver(project.root, ["build", "compile"], 300_000);

  if (project.exists(projectNeutralino)) {
    await mkdir(neutralinoCache, { recursive: true });
    await cp(project.path(projectNeutralino), neutralinoCache, {
      recursive: true,
    });
  }
}, 600_000);

afterAll(async () => {
  await project?.cleanup();
});

describe("weaver build compile (plugin-executable)", () => {
  it("is added to the CLI by the plugin", async () => {
    const help = await runWeaver(project.root, ["build", "--help"]);
    expect(help.output).toContain("compile");
  });

  it("builds the game and packages it for the current platform", () => {
    expect(result.code, result.output).toBe(0);
    expect(project.exists("dist/index.html")).toBe(true);
    expect(project.exists(executable)).toBe(true);
    expect(project.exists(`${appDir}/resources.neu`)).toBe(true);
  });

  it("ships the story with save sync and the Neutralino config", () => {
    const archive = project.path(`${appDir}/resources.neu`);
    // asar looks paths up with the platform separator
    const read = (file: string) =>
      asar.extractFile(archive, join(...file.split("/"))).toString("utf8");

    const config = JSON.parse(read("neutralino.config.json"));
    expect(config.modes.window.title).toBe("E2E Game");
    expect(config.cli.binaryName).toBe("e2e-game");

    const html = read("resources/index.html");
    expect(html).toContain("Hello World!");
    expect(html).toContain("__THYWEAVER_SAVE_SYNC__");
    expect(read("resources/js/neutralino.js").length).toBeGreaterThan(0);
  });
});
