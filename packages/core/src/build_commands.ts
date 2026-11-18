import ora from "ora";
import {
  fancyLogFormater,
  colorizeEmiter,
  colorizeLabel,
  resolveToProjectRoot,
} from "./utils.ts";
import { setupTweego, tweenode } from "tweenode";
import { rolldown, type RolldownPluginOption } from "rolldown";
import { setupRolldown } from "./rolldown_setup.ts";
import { loadConfig } from "./config/config_handler.ts";
import pico from "picocolors";
import { copy, remove } from "fs-extra/esm";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { copyStaticMounts, resolveStaticMounts } from "./static_assets.ts";

export const handleTweegoSetup = async () => {
  const spinner = ora({
    prefixText: colorizeEmiter("TWEENODE"),
  });

  spinner.start("Setting-up...");

  if (existsSync(resolveToProjectRoot(".tweenode"))) {
    return spinner.succeed(".tweenode folder already exists, skipping setup");
  }

  try {
    await setupTweego();
    spinner.succeed("Setup complete");
  } catch (error: any) {
    spinner.stop();
    console.log(
      fancyLogFormater("TWEENODE", "ERROR", {
        message: "Failed to setup Tweego",
        cause: error,
      }),
    );
  }
};

export const runRolldownn = async (
  extraPlugins: RolldownPluginOption[] = [],
) => {
  const config = await loadConfig();

  const spinner = ora({
    prefixText: colorizeEmiter("ROLLDOWN"),
  });

  spinner.start("Running bundler...");
  spinner.clear();

  console.log(
    fancyLogFormater("ROLLDOWN", "PROGRESS", {
      message: " Running bundler...",
    }),
  );

  const startStamp = Date.now();
  const bundle = await rolldown(await setupRolldown(extraPlugins));
  await bundle.write({
    format: "esm",
    file: resolve(config.bundler.filesystem!.stagingDir!, "app.bundle.js"),
  });

  bundle.close();
  const duration = Date.now() - startStamp;
  spinner.render();
  spinner.succeed(`Rolldown finished in ${pico.yellow(`${duration}ms`)}`);

  return { bundle, duration };
};

export const moveFiles = async () => {
  const config = await loadConfig();

  const spinner = ora({
    prefixText: colorizeEmiter("BUNDLER"),
  });

  const filesystemConfig = config.bundler.filesystem;

  try {
    spinner.start("Cleaning-up dist/...");
    await remove(resolveToProjectRoot(filesystemConfig!.dist!));
    spinner.succeed("dist/ clean!");
  } catch (error) {
    spinner.fail(` ${colorizeLabel("ERROR")} Failed cleanup dist:\n${error}\n`);
  }

  try {
    const startStamp = Date.now();
    spinner.start("Coping media files...");
    await copy(
      resolveToProjectRoot(filesystemConfig!.projectFiles!.mediaDir!),
      resolveToProjectRoot(filesystemConfig!.dist + "/media"),
    );

    spinner.succeed(
      `Media files copied in ${pico.yellow(`${Date.now() - startStamp}ms`)}`,
    );
  } catch (error) {
    spinner.fail(
      ` ${colorizeLabel("ERROR")} Failed to copy media files:\n${error}\n`,
    );
  }

  const mounts = resolveStaticMounts(config);
  if (mounts.length === 0) return;

  const startStamp = Date.now();
  spinner.start("Copying fonts and additional assets...");
  try {
    const copied = await copyStaticMounts(
      mounts,
      resolveToProjectRoot(filesystemConfig!.dist!),
    );
    spinner.succeed(
      `${copied.length} asset ${copied.length === 1 ? "entry" : "entries"} copied in ${pico.yellow(`${Date.now() - startStamp}ms`)}`,
    );
  } catch (error) {
    spinner.fail(
      ` ${colorizeLabel("ERROR")} Failed to copy additional assets:\n${error}\n`,
    );
    // Explicitly configured assets are part of the game, fail the build
    throw error;
  }
};

export interface GetTweegoOptions {
  /**
   * Compile in Twine test/debug mode (Tweego's `-t`)
   * @default false
   */
  testMode?: boolean;
}

export const getTweego = async (
  mode: "file" | "string",
  { testMode = false }: GetTweegoOptions = {},
): Promise<ReturnType<typeof tweenode>> => {
  const { bundler } = await loadConfig();
  const { filesystem } = bundler;

  return await tweenode({
    build: {
      input: {
        storyDir: resolveToProjectRoot(filesystem!.projectFiles!.storyDir!),
        scripts: filesystem!.stagingDir + "/app.bundle.js",
        styles: filesystem!.stagingDir + "/app.bundle.css",
        htmlHead: resolveToProjectRoot(filesystem!.projectFiles!.htmlHead!),
        modules: [
          filesystem!.stagingDir + "/vendor.bundle.css",
          filesystem!.stagingDir + "/vendor.bundle.js",
        ],
        useTwineTestMode: testMode,
      },
      output: {
        mode: mode,
        fileName:
          mode == "file"
            ? resolveToProjectRoot(filesystem!.dist + "/index.html")
            : undefined,
      },
    },
    debug: {
      writeToLog: true,
    },
  });
};
