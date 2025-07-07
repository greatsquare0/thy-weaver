import ora from "ora";
import { fancyLogFormater, fancyOraPrefixer } from "./utils.ts";
import { setupTweego } from "tweenode";
import { rolldown } from "rolldown";
import { setupRolldown } from "./rolldown_setup.ts";
import { resolve } from "node:path";
import { loadConfig } from "./config/config_handler.ts";
import pico from "picocolors";
const config = await loadConfig();

export const handleTweegoSetup = async () => {
  const spinner = ora({
    prefixText: fancyOraPrefixer("TWEENODE"),
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
    prefixText: fancyOraPrefixer("ROLLDOWN"),
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
