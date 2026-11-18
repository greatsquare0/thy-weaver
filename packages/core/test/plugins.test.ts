import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { defineConfig } from "../src/config/config_handler.ts";
import {
  createPluginManager,
  resolveProjectPaths,
} from "../src/plugins/manager.ts";
import { callHook, sortPlugins } from "../src/plugins/sort.ts";
import type { Plugin } from "../src/plugins/types.ts";
import type { ThyWevearOptions } from "../src/config/config_types.ts";

const config = defineConfig({} as ThyWevearOptions);

describe("sortPlugins", () => {
  it("puts pre plugins first and post plugins last, keeping order otherwise", () => {
    const plugins: Plugin[] = [
      { name: "normal-1" },
      { name: "post-1", enforce: "post" },
      { name: "pre-1", enforce: "pre" },
      { name: "normal-2" },
      { name: "pre-2", enforce: "pre" },
    ];

    expect(sortPlugins(plugins).map((plugin) => plugin.name)).toEqual([
      "pre-1",
      "pre-2",
      "normal-1",
      "normal-2",
      "post-1",
    ]);
  });

  it("does not mutate the input", () => {
    const plugins: Plugin[] = [{ name: "a", enforce: "post" }, { name: "b" }];
    sortPlugins(plugins);
    expect(plugins.map((plugin) => plugin.name)).toEqual(["a", "b"]);
  });
});

describe("callHook", () => {
  it("returns the hook result", async () => {
    expect(await callHook({ name: "p" }, "buildStart", () => 42)).toBe(42);
  });

  it("names the plugin and hook in errors, keeping the cause", async () => {
    const cause = new Error("boom");

    const error = await callHook({ name: "my-plugin" }, "buildEnd", () => {
      throw cause;
    }).catch((error: Error) => error);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(
      'Plugin "my-plugin" failed in the "buildEnd" hook',
    );
    expect((error as Error).cause).toBe(cause);
  });
});

describe("resolveProjectPaths", () => {
  it("resolves every configured folder from the project root", () => {
    const paths = resolveProjectPaths(config);

    expect(paths.root).toBe(resolve("."));
    expect(paths.dist).toBe(resolve("dist"));
    expect(paths.storyDir).toBe(resolve("src/story"));
    expect(paths.mediaDir).toBe(resolve("src/assets/media"));
  });
});

describe("createPluginManager", () => {
  it("runs hooks in enforce order", async () => {
    const calls: string[] = [];
    const plugin = (name: string, enforce?: Plugin["enforce"]): Plugin => ({
      name,
      enforce,
      buildStart: () => {
        calls.push(name);
      },
    });

    const manager = createPluginManager(
      [plugin("b"), plugin("c", "post"), plugin("a", "pre")],
      config,
    );
    await manager.buildStart("build");

    expect(calls).toEqual(["a", "b", "c"]);
  });

  it("gives hooks the mode, paths and a logger", async () => {
    const buildStart = vi.fn();
    const manager = createPluginManager([{ name: "p", buildStart }], config);

    await manager.buildStart("dev");

    const context = buildStart.mock.calls[0][0];
    expect(context.mode).toBe("dev");
    expect(context.isDev).toBe(true);
    expect(context.paths).toEqual(manager.paths);
    expect(typeof context.logger.info).toBe("function");
    expect(typeof context.runPipeline).toBe("function");
  });

  it("chains transformStoryHtml, skipping hooks that return nothing", async () => {
    const manager = createPluginManager(
      [
        { name: "a", transformStoryHtml: (html) => html + "<a>" },
        { name: "noop", transformStoryHtml: () => undefined },
        { name: "b", transformStoryHtml: async (html) => html + "<b>" },
      ],
      config,
    );

    expect(await manager.transformStoryHtml("<story>", "build")).toBe(
      "<story><a><b>",
    );
  });

  it("collects rolldown plugins from every plugin", async () => {
    const first = { name: "rolldown-a" };
    const second = { name: "rolldown-b" };
    const manager = createPluginManager(
      [
        { name: "a", rolldownPlugins: () => [first] },
        { name: "none", rolldownPlugins: () => undefined },
        { name: "b", rolldownPlugins: async () => [second] },
      ],
      config,
    );

    expect(await manager.rolldownPlugins("build")).toEqual([first, second]);
  });

  it("passes the final HTML to buildEnd", async () => {
    const buildEnd = vi.fn();
    const manager = createPluginManager([{ name: "p", buildEnd }], config);

    await manager.buildEnd("compile", "<html>");

    expect(buildEnd.mock.calls[0][0]).toMatchObject({
      mode: "compile",
      isDev: false,
      html: "<html>",
    });
  });

  it("tags errors from hooks with the plugin name", async () => {
    const manager = createPluginManager(
      [
        {
          name: "broken",
          buildStart: () => {
            throw new Error("nope");
          },
        },
      ],
      config,
    );

    await expect(manager.buildStart("build")).rejects.toThrow(
      'Plugin "broken" failed in the "buildStart" hook',
    );
  });

  it("lets plugins extend the CLI and the dev server", async () => {
    const program = {};
    const app = {};
    const configureCli = vi.fn();
    const configureDevServer = vi.fn();
    const manager = createPluginManager(
      [{ name: "p", configureCli, configureDevServer }],
      config,
    );

    // oxlint-disable-next-line no-explicit-any
    await manager.configureCli(program as any);
    // oxlint-disable-next-line no-explicit-any
    await manager.configureDevServer(app as any);

    expect(configureCli.mock.calls[0][0]).toBe(program);
    expect(configureDevServer.mock.calls[0][0]).toBe(app);
  });
});
