import { lilconfig, type Options, defaultLoaders } from "lilconfig";
import swc from "@swc/core";
import { defaultConfig } from "./defaults.ts";
import { createHash } from "node:crypto";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { isTS, resolveToProjectRoot, tempFolderPath } from "../utils.ts";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import type { ThyWevearOptions } from "./config_types.ts";
import { deepmerge } from "deepmerge-ts";
import { callHook, sortPlugins } from "../plugins/sort.ts";
import { resolveDerivedOptions } from "./resolve_config.ts";

function stripDefineConfig(content: string): string {
  const importRegex =
    /^import\s*\{\s*defineConfig\s*\}\s*from\s*["']@thy-weaver\/core["'];?$/gm;

  if (importRegex.test(content)) {
    return content.replace(
      importRegex,
      "const defineConfig = (config) => config;",
    );
  }
  return content;
}

const loadTsConfig = async (_filepath: string, content: string) => {
  const sanitizedContent = stripDefineConfig(content);

  const hash = createHash("md5").update(sanitizedContent).digest("hex");
  const tempFileName = `weaver-${hash}.config.mjs`;
  const tempFileDir = resolve(tempFolderPath(), "config");
  const tempFilePath = resolve(tempFileDir, tempFileName);

  if (existsSync(tempFilePath)) {
    try {
      const importPath = pathToFileURL(tempFilePath).href;
      const result = await import(importPath);

      return result.default;

      // oxlint-disable-next-line no-unused-vars
    } catch (error) {
      console.warn("Cached config found but failed to load.");
    }
  }

  const script = await swc.transform(sanitizedContent, {
    module: {
      type: "es6",
    },
    jsc: {
      target: "es2022",
      parser: {
        syntax: "typescript",
      },
    },
  });

  if (existsSync(tempFileDir)) {
    await rm(tempFileDir, {
      recursive: true,
    });
  }

  if (!existsSync(tempFileDir)) {
    await mkdir(tempFileDir, {
      recursive: true,
    });
  }

  try {
    await writeFile(tempFilePath, script.code);
    let importPath = pathToFileURL(tempFilePath).href;
    const result = await import(importPath);

    return result.default;
  } catch (error) {
    console.log(error);
  }
};

const options: Partial<Options> = {
  loaders: {
    ...defaultLoaders,
    ".ts": loadTsConfig,
  },
};

const searcher = lilconfig("weaver", options);

/**
 * Lets plugins modify the config (`config` hook), then notifies them of the
 * final one (`configResolved` hook)
 */
const applyPluginConfigHooks = async (
  initial: ThyWevearOptions,
): Promise<ThyWevearOptions> => {
  const plugins = sortPlugins(initial.plugins ?? []);
  let config = initial;

  for (const plugin of plugins) {
    const hook = plugin.config;
    if (hook) {
      const partial = await callHook(plugin, "config", () => hook(config));
      if (partial) {
        config = deepmerge(config, partial) as ThyWevearOptions;
      }
    }
  }

  // Plugins can't add or remove plugins through the config hook
  config.plugins = initial.plugins;

  config = resolveDerivedOptions(config);

  for (const plugin of plugins) {
    const hook = plugin.configResolved;
    if (hook) {
      await callHook(plugin, "configResolved", () => hook(config));
    }
  }

  return config;
};

let configPromise: Promise<ThyWevearOptions> | null = null;

export const loadConfig = async (): Promise<ThyWevearOptions> => {
  if (configPromise) {
    return configPromise;
  }

  configPromise = (async () => {
    const result = await searcher.load(
      isTS
        ? resolveToProjectRoot("thyweaver.config.ts")
        : resolveToProjectRoot("thyweaver.config.js"),
    );

    const merged = deepmerge(defaultConfig, result!.config) as ThyWevearOptions;

    return applyPluginConfigHooks(merged);
  })();

  return configPromise;
};

/**
 * Defines configs for use in ThyWeaver
 * @param config {ThyWeaverConfig}
 */
export function defineConfig(config: ThyWevearOptions) {
  const merged = deepmerge(defaultConfig, config);
  return merged as ThyWevearOptions;
}
