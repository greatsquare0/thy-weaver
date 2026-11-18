import postcss from "postcss";
import { deepmerge } from "deepmerge-ts";
import { describe, expect, it } from "vitest";
import { defineConfig } from "../src/config/config_handler.ts";
import { defaultConfig } from "../src/config/defaults.ts";
import { resolveDerivedOptions } from "../src/config/resolve_config.ts";
import type { ThyWevearOptions } from "../src/config/config_types.ts";

const partial = (config: object) => config as ThyWevearOptions;

/**
 * Same merging `loadConfig` does on a config file written with `defineConfig`
 */
const load = (config: object) =>
  resolveDerivedOptions(
    deepmerge(defaultConfig, defineConfig(partial(config))) as ThyWevearOptions,
  );

const compileCss = async (config: ThyWevearOptions, css: string) =>
  (
    await postcss(config.bundler.postcss!.plugins).process(css, {
      from: undefined,
    })
  ).css;

describe("resolveDerivedOptions", () => {
  it("defaults the compilation target to browserslist defaults", () => {
    const config = load({});

    expect(config.bundler.compilationTarget).toBe("defaults");
    expect(config.bundler.swc!.env!.targets).toBe("defaults");
  });

  it("passes compilationTarget to SWC", () => {
    const config = load({ bundler: { compilationTarget: "chrome 80" } });
    expect(config.bundler.swc!.env!.targets).toBe("chrome 80");
  });

  it("keeps targets set directly in the SWC options", () => {
    const config = load({
      bundler: {
        compilationTarget: "chrome 80",
        swc: { env: { targets: "firefox 100" } },
      },
    });
    expect(config.bundler.swc!.env!.targets).toBe("firefox 100");
  });

  it("never sets jsc.target, SWC rejects it together with env", () => {
    expect(load({}).bundler.swc!.jsc?.target).toBeUndefined();
  });

  it("compiles CSS for compilationTarget", async () => {
    const css = ".a { user-select: none }";

    const old = await compileCss(
      load({ bundler: { compilationTarget: "safari 10" } }),
      css,
    );
    const modern = await compileCss(
      load({ bundler: { compilationTarget: "last 1 chrome version" } }),
      css,
    );

    expect(old).toContain("-webkit-user-select");
    expect(modern).not.toContain("-webkit-user-select");
  });

  it("adds the built-in PostCSS plugins once, before the user ones", () => {
    const userPlugin = { postcssPlugin: "user-plugin" };
    const config = load({ bundler: { postcss: { plugins: [userPlugin] } } });
    const plugins = config.bundler.postcss!.plugins;

    // postcss-import + lightningcss, then the user plugin
    expect(plugins).toHaveLength(3);
    expect(plugins.at(-1)).toBe(userPlugin);
  });

  it("runs the user PostCSS plugins", async () => {
    const config = load({
      bundler: {
        postcss: {
          plugins: [
            {
              postcssPlugin: "rename",
              Declaration: (decl: { value: string }) => {
                if (decl.value === "red") decl.value = "blue";
              },
            },
          ],
        },
      },
    });

    // lightningcss runs last (on OnceExit) and shortens blue to #00f
    expect(await compileCss(config, ".a { color: red }")).toMatch(
      /color:\s*(blue|#00f)/,
    );
  });
});
