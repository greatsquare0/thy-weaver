import type { Plugin, PluginContext } from "rolldown";
import { glob } from "tinyglobby";

import { resolve } from "node:path";
import { cwd } from "node:process";
import { transform as swcTranform } from "@swc/core";
import postcss from "postcss";

import { loadConfig } from "./config/config_handler.ts";
import { concat, win2posixPath } from "./utils.ts";
import { outputFile } from "fs-extra/esm";
import { platform } from "node:os";

const config = await loadConfig();

export const handleVendorFiles = async () => {
  return {
    name: "handle-vendor-files",
    async buildStart() {
      const path =
        platform() == "win32"
          ? win2posixPath(
              resolve(
                cwd(),
                config.bundler.filesystem!.projectFiles.vendorFilesDir,
              ),
            )
          : resolve(
              cwd(),
              config.bundler.filesystem!.projectFiles.vendorFilesDir,
            );

      await handleVendorScripts(this, path);
      await handleVendorStyles(this, path);
    },
  } as Plugin;
};

const handleVendorScripts = async (ctx: PluginContext, path: string) => {
  const pattern = path + "/**/*.{js,ts}";

  try {
    const files = await glob(pattern);

    const rawScripts = (await concat(files)) as string;
    const result = await swcTranform(rawScripts, config.bundler.swc);

    await outputFile(
      resolve(config.bundler.filesystem!.stagingDir, "vendor.bundle.js"),
      result.code,
    );

    if (result.map) {
      await outputFile(
        resolve(config.bundler.filesystem!.stagingDir, "vendor.bundle.js.map"),
        result.map,
      );
    }
  } catch (error: any) {
    ctx.error(error);
  }
};

const handleVendorStyles = async (ctx: PluginContext, path: string) => {
  const pattern = path + "/**/*.css";

  try {
    const files = await glob(pattern);

    const rawStyles = (await concat(files)) as string;
    const result = await postcss(config.bundler.postcss!.plugins).process(
      rawStyles,
      { from: undefined },
    );

    await outputFile(
      resolve(config.bundler.filesystem!.stagingDir, "vendor.bundle.css"),
      result.css,
    );

    if (result.map) {
      await outputFile(
        resolve(config.bundler.filesystem!.stagingDir, "vendor.bundle.css.map"),
        result.map.toString(),
      );
    }
  } catch (error: any) {
    ctx.error(error);
  }
};
