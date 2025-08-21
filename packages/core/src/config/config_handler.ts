import { lilconfig, type Options, defaultLoaders } from "lilconfig";
import swc from "@swc/core";
import { defaultConfig } from "./defaults.ts";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { isTS, resolveToProjectRoot, tempFolderPath } from "../utils.ts";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import type { ThyWevearOptions } from "./config_types.ts";
import { deepmerge } from "deepmerge-ts";

const loadTsConfig = async (_filepath: string, content: string) => {
  const script = await swc.transform(content, {
    module: {
      type: "es6",
    },
    jsc: {
      target: "es5",
      parser: {
        syntax: "typescript",
      },
    },
  });

  //Generate temporary file
  const tempFilename = `weaver-${randomUUID()}.config.mjs`;
  const tempFileDir = resolve(tempFolderPath(), "config");
  const tempFilepath = resolve(tempFileDir, tempFilename);

  try {
    if (!existsSync(tempFileDir)) {
      await mkdir(tempFileDir, {
        recursive: true,
      });
    }

    await writeFile(tempFilepath, script.code);
  } catch (error) {
    console.log(error);
  }

  //Try and load the file
  try {
    let importPath = tempFilepath;
    if (existsSync(tempFilepath)) {
      if (process.platform === "win32") {
        importPath = pathToFileURL(tempFilepath).href;
      }

      const result = await import(importPath);
      await rm(tempFileDir, { recursive: true });

      return result.default;
    } else {
      return null;
    }
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

export const loadConfig = async () => {
  const result = await lilconfig("weaver", options).load(
    isTS
      ? resolveToProjectRoot("thyweaver.config.ts")
      : resolveToProjectRoot("thyweaver.config.js"),
  );
  return result!.config as ThyWevearOptions;
};

/**
 * Defines configs for use in ThyWeaver
 * @param config {ThyWeaverConfig}
 */
export function defineConfig(config: ThyWevearOptions) {
  const merged = deepmerge(defaultConfig, config);
  return merged as ThyWevearOptions;
}
