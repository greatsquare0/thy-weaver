import ora from "ora";
import { fancyLogFormater, colorizeEmiter, colorizeLabel } from "./utils.ts";
import { setupTweego } from "tweenode";
import { rolldown } from "rolldown";
import { setupRolldown } from "./rolldown_setup.ts";
import { loadConfig } from "./config/config_handler.ts";
import pico from "picocolors";
import { copy, remove } from "fs-extra/esm";
import { cwd } from "node:process";
import { resolve } from "node:path";

const config = await loadConfig();

export const handleTweegoSetup = async () => {
  const spinner = ora({
    prefixText: colorizeEmiter("TWEENODE"),
  });

  spinner.start("Setting-up...");

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

export const runRowndown = async () => {
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
  const bundle = await rolldown(setupRolldown());
  await bundle.write({
    format: "esm",
    file: resolve(config.bundler.filesystem!.stagingDir, "app.bundle.js"),
  });

  bundle.close();
  const duration = Date.now() - startStamp;
  spinner.render();
  spinner.succeed(`Rolldown finished in ${pico.yellow(`${duration}ms`)}`);

  return { bundle, duration };
};

export const moveFiles = async () => {
  const spinner = ora({
    prefixText: colorizeEmiter("BUNDLER"),
  });

  const filesystemConfig = config.bundler.filesystem;

  console.log(resolve(cwd(), filesystemConfig!.dist));
  try {
    spinner.start("Cleaning-up dist/...");
    //await remove(resolve(cwd(), filesystemConfig!.dist));
    spinner.succeed("dist/ clean!");
  } catch (error) {
    spinner.fail(` ${colorizeLabel("ERROR")} Failed cleanup dist:\n${error}\n`);
  }

  try {
    const startStamp = Date.now();
    spinner.start("Coping media files...");
    await copy(
      resolve(cwd(), filesystemConfig!.projectFiles.mediaDir),
      resolve(cwd(), filesystemConfig!.dist),
    );

    spinner.succeed(
      `Media files copied in ${pico.yellow(`${Date.now() - startStamp}`)}`,
    );
  } catch (error) {
    spinner.fail(
      ` ${colorizeLabel("ERROR")} Failed to copy media files:\n${error}\n`,
    );
  }
};
