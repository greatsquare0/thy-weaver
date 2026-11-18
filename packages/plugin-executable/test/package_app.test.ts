import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as asar from "@electron/asar";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BuildEndContext } from "@thy-weaver/core/plugin_helpers";
import {
  createNeutralinoConfig,
  injectIntoHead,
  packageApp,
  toBinaryName,
} from "../src/package_app.ts";
import { ensureNeutralinoRuntime } from "../src/neutralino.ts";

vi.mock("../src/neutralino.ts", () => ({
  ensureNeutralinoRuntime: vi.fn(),
}));

describe("toBinaryName", () => {
  it.each([
    ["my-game", "my-game"],
    ["@scope/My Game", "My-Game"],
    ["--weird__name!!", "weird__name"],
    ["@scope/***", "game"],
  ])("turns %j into %j", (input, expected) => {
    expect(toBinaryName(input)).toBe(expected);
  });
});

describe("injectIntoHead", () => {
  it("adds the snippet right after the opening head tag", () => {
    expect(
      injectIntoHead('<html><head lang="en"><title>x</title></head>', "<s/>"),
    ).toBe('<html><head lang="en">\n<s/>\n<title>x</title></head>');
  });

  it("does not match tags that only start with head", () => {
    expect(() => injectIntoHead("<header></header>", "<s/>")).toThrow(
      "Could not find <head>",
    );
  });
});

describe("createNeutralinoConfig", () => {
  const meta = {
    applicationId: "dev.thyweaver.game",
    version: "1.2.3",
    title: "Game",
    binaryName: "game",
    saveSync: true,
  };

  it("uses sensible window defaults", () => {
    const config = createNeutralinoConfig({}, meta);

    expect(config.port).toBe(0);
    expect(config.modes.window).toMatchObject({
      title: "Game",
      width: 1100,
      height: 750,
      resizable: true,
      enableInspector: false,
    });
    expect(config.cli.binaryVersion).toBe("6.10.0");
    expect(config.modes.window).not.toHaveProperty("icon");
  });

  it("only allows the native API needed for save sync", () => {
    const withSync = createNeutralinoConfig({}, meta);
    const withoutSync = createNeutralinoConfig(
      {},
      { ...meta, saveSync: false },
    );

    expect(withSync.enableNativeAPI).toBe(true);
    expect(withSync.nativeAllowList).toContain("filesystem.*");
    // The app exits itself after flushing saves
    expect(withSync.modes.window.exitProcessOnClose).toBe(false);

    expect(withoutSync.enableNativeAPI).toBe(false);
    expect(withoutSync.nativeAllowList).toEqual([]);
    expect(withoutSync.modes.window.exitProcessOnClose).toBe(true);
  });

  it("applies user options", () => {
    const config = createNeutralinoConfig(
      {
        port: 8080,
        enableInspector: true,
        neutralinoVersion: "6.9.0",
        window: { width: 640, fullScreen: true },
      },
      { ...meta, icon: "/resources/app-icon.png" },
    );

    expect(config.port).toBe(8080);
    expect(config.cli.clientVersion).toBe("6.9.0");
    expect(config.modes.window).toMatchObject({
      width: 640,
      height: 750,
      fullScreen: true,
      enableInspector: true,
      icon: "/resources/app-icon.png",
    });
  });
});

describe("packageApp", () => {
  let root: string;
  let context: BuildEndContext;
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "weaver-package-"));
    const runtimeDir = join(root, "runtime");

    await mkdir(join(root, "dist", "media"), { recursive: true });
    await mkdir(runtimeDir);
    await writeFile(join(root, "dist", "media", "cover.png"), "png");
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({ name: "@me/Cool Game", version: "2.0.0" }),
    );
    await writeFile(join(runtimeDir, "neutralino-win_x64.exe"), "win");
    await writeFile(join(runtimeDir, "neutralino-linux_x64"), "linux");
    await writeFile(join(runtimeDir, "neutralino.js"), "client");

    vi.mocked(ensureNeutralinoRuntime).mockResolvedValue({
      binaries: {
        win_x64: join(runtimeDir, "neutralino-win_x64.exe"),
        linux_x64: join(runtimeDir, "neutralino-linux_x64"),
      } as Awaited<ReturnType<typeof ensureNeutralinoRuntime>>["binaries"],
      client: join(runtimeDir, "neutralino.js"),
      downloaded: false,
    });

    context = {
      html: "<html><head><title>Game</title></head><body></body></html>",
      logger,
      paths: {
        root,
        dist: join(root, "dist"),
        stagingDir: join(root, "staging"),
        storyDir: join(root, "src", "story"),
        mediaDir: join(root, "src", "assets", "media"),
      },
    } as unknown as BuildEndContext;

    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("creates one app folder per target with the binary and resources", async () => {
    await packageApp({ targets: ["win_x64", "linux_x64"] }, context);

    const win = join(root, "dist-app", "Cool-Game-win_x64");
    const linux = join(root, "dist-app", "Cool-Game-linux_x64");

    expect(await readFile(join(win, "Cool-Game.exe"), "utf8")).toBe("win");
    expect(await readFile(join(linux, "Cool-Game"), "utf8")).toBe("linux");
    expect(existsSync(join(win, "resources.neu"))).toBe(true);
    expect(existsSync(join(linux, "resources.neu"))).toBe(true);
    // The temporary archive is cleaned up
    expect(existsSync(join(root, "staging", "resources.neu"))).toBe(false);
  });

  it("packs the game, the client library and the config into resources.neu", async () => {
    await packageApp({ targets: ["win_x64"] }, context);

    const archive = join(
      root,
      "dist-app",
      "Cool-Game-win_x64",
      "resources.neu",
    );
    const files = asar.listPackage(archive, { isPack: false });
    // asar looks paths up with the platform separator
    const read = (file: string) =>
      asar.extractFile(archive, join(...file.split("/"))).toString("utf8");

    expect(files).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/neutralino\.config\.json$/),
        expect.stringMatching(/resources[\\/]index\.html$/),
        expect.stringMatching(/resources[\\/]media[\\/]cover\.png$/),
        expect.stringMatching(/resources[\\/]js[\\/]neutralino\.js$/),
      ]),
    );

    const config = JSON.parse(read("neutralino.config.json"));
    expect(config.applicationId).toBe("dev.thyweaver.cool-game");
    expect(config.version).toBe("2.0.0");
    expect(config.cli.binaryName).toBe("Cool-Game");

    const html = read("resources/index.html");
    expect(html).toContain('<script src="/js/neutralino.js"></script>');
    expect(html).toContain(
      'window.__THYWEAVER_SAVE_SYNC__ = {"fileName":"saves.json"}',
    );
  });

  it("leaves the HTML alone and warns when saves can't persist", async () => {
    await packageApp({ targets: ["win_x64"], saves: { sync: false } }, context);

    const archive = join(
      root,
      "dist-app",
      "Cool-Game-win_x64",
      "resources.neu",
    );
    const html = asar
      .extractFile(archive, join("resources", "index.html"))
      .toString("utf8");

    expect(html).toBe(context.html);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("saves won't persist"),
    );
  });

  it("only replaces its own folders inside outDir", async () => {
    const outDir = join(root, "dist-app");
    await mkdir(join(outDir, "Cool-Game-win_x64"), { recursive: true });
    await writeFile(join(outDir, "Cool-Game-win_x64", "stale.txt"), "old");
    await writeFile(join(outDir, "notes.txt"), "keep me");

    await packageApp({ targets: ["win_x64"] }, context);

    expect(existsSync(join(outDir, "Cool-Game-win_x64", "stale.txt"))).toBe(
      false,
    );
    expect(await readFile(join(outDir, "notes.txt"), "utf8")).toBe("keep me");
  });

  it("fails clearly when the window icon is missing", async () => {
    await expect(
      packageApp(
        { targets: ["win_x64"], window: { icon: "missing.png" } },
        context,
      ),
    ).rejects.toThrow("Window icon not found");
  });
});
