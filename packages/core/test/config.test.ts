import { describe, expect, it } from "vitest";
import { defineConfig } from "../src/config/config_handler.ts";
import { defaultConfig } from "../src/config/defaults.ts";
import type { ThyWevearOptions } from "../src/config/config_types.ts";

// defineConfig is typed with the full options, users only pass what they change
const partial = (config: object) => config as ThyWevearOptions;

describe("defineConfig", () => {
  it("fills in the defaults", () => {
    const config = defineConfig(partial({}));

    expect(config.devServer).toEqual(defaultConfig.devServer);
    expect(config.bundler.filesystem!.dist).toBe("dist/");
    expect(config.bundler.filesystem!.projectFiles!.storyDir).toBe(
      "src/story/",
    );
  });

  it("deep merges overrides, keeping sibling defaults", () => {
    const config = defineConfig(
      partial({
        devServer: { port: 4321 },
        bundler: {
          filesystem: { projectFiles: { storyDir: "story/" } },
        },
      }),
    );

    expect(config.devServer!.port).toBe(4321);
    expect(config.devServer!.restricToLocalhost).toBe(true);
    expect(config.bundler.filesystem!.projectFiles!.storyDir).toBe("story/");
    expect(config.bundler.filesystem!.projectFiles!.mediaDir).toBe(
      "src/assets/media/",
    );
  });

  it("keeps the plugin list", () => {
    const plugins = [{ name: "a" }, { name: "b" }];
    expect(defineConfig(partial({ plugins })).plugins).toEqual(plugins);
  });

  it("does not mutate the defaults", () => {
    defineConfig(partial({ devServer: { port: 1 } }));
    expect(defaultConfig.devServer!.port).toBe(3000);
  });
});
