import { signal } from "alien-signals";
import { tweenode } from "tweenode";
import { loadConfig } from "./config/config_handler.ts";
import {
  colorizeEmiter,
  colorizeLabel,
  resolveToProjectRoot,
} from "./utils.ts";
import ora from "ora";
import pico from "picocolors";
import { runRowndown } from "./build_commands.ts";
import { watch } from "chokidar";

const { bundler } = await loadConfig();
const { filesystem } = bundler;

export const htmlData = signal<string>("");

const tweego = await tweenode({
  build: {
    input: {
      storyDir: resolveToProjectRoot(filesystem!.projectFiles.storyDir),
      scripts: filesystem!.stagingDir + "/app.bundle.js",
      styles: filesystem!.stagingDir + "/app.bundle.css",
      modules: [
        filesystem!.stagingDir + "/vendor.bundle.css",
        filesystem!.stagingDir + "/vendor.bundle.js",
      ],
    },
    output: {
      mode: "string",
    },
  },
  debug: {
    writeToLog: true,
  },
});

const runTweego = async () => {
  const spinner = ora({
    prefixText: colorizeEmiter("TWEENODE"),
  });
  let result: string | undefined;
  spinner.start("Compiling story...");
  const startStamp = Date.now();
  try {
    result = await tweego.process();

    spinner.succeed(
      `Story compiled in ${pico.yellow(`${Date.now() - startStamp}ms`)}`,
    );
  } catch (error) {
    spinner.fail(
      ` ${colorizeLabel("ERROR")} Failed to compile story:\n${error}\n`,
    );
  }

  return result;
};

const devBuilder = async (): Promise<string | undefined> => {
  const startStamp = Date.now();

  await runRowndown();
  const html = await runTweego();

  return new Promise((resolve) => {
    console.log(
      `\n${pico.bgGreen(
        pico.bold(` Build finished in ${Date.now() - startStamp}ms `),
      )}ㅤ\n`,
    );

    return resolve(html);
  });
};

export const runDev = async () => {
  devBuilder().then(async (firstResult) => {
    if (firstResult) {
      htmlData(firstResult);
    }
    console.log(pico.yellow(pico.bold("Waiting for file changes...")));
    await import("./dev_server/main.ts");

    watch(resolveToProjectRoot("src"), {
      interval: bundler.watcherDelay,
      ignoreInitial: true,
      awaitWriteFinish: {
        pollInterval: 50,
      },
    }).on("all", async () => {
      process.stdout.write("\x1Bc");
      console.log(
        `\n${pico.bgMagenta(pico.bold(" ThyWeaver - Running in dev mode "))}ㅤ`,
      );

      const result = await devBuilder();
      if (result) {
        htmlData(result);
      }

      console.log(pico.yellow(pico.bold("Waiting for file changes...")));
    });
  });

  process.on("SIGTERM", () => {
    tweego.kill();
    process.exit();
  });

  process.on("SIGINT", () => {
    tweego.kill();
    process.exit();
  });
};
