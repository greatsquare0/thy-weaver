import { loadConfig } from "./config/config_handler.ts";
import type { RollupLog } from "rolldown";
import {
  fancyLogFormater,
  resolveToProjectRoot,
  updateState,
} from "./utils.ts";
import pico from "picocolors";
import { watch } from "chokidar";
import { startServer } from "./dev_server/main.ts";
import { broadcast } from "./dev_server/streams.ts";
import { runPipeline } from "./pipeline.ts";

const printBanner = () => {
  console.log(
    `\n${pico.bgMagenta(pico.bold(" ThyWeaver - Running in dev mode "))}ㅤ\n`,
  );
};

const devBuilder = async (): Promise<string | undefined> => {
  const { html, duration } = await runPipeline("dev", { banner: false });

  if (html !== undefined) {
    console.log(
      `\n${pico.bgGreen(pico.bold(` Build finished in ${duration}ms `))}ㅤ\n`,
    );
  }

  return html;
};

export const runDev = async () => {
  const { bundler } = await loadConfig();

  printBanner();

  const firstResult = await devBuilder();
  if (firstResult) {
    updateState(firstResult);
  }

  const server = await startServer();

  const printWaiting = () => {
    console.log(pico.yellow(pico.bold("Waiting for file changes...")));
    console.log(
      `${pico.yellow(
        pico.bold(
          `Dev Server available at ${pico.cyan(`http://localhost:${server.options.port}/`)}`,
        ),
      )}\n`,
    );
  };

  printWaiting();

  watch(resolveToProjectRoot("src"), {
    interval: bundler.watcherDelay,
    ignoreInitial: true,
    awaitWriteFinish: {
      pollInterval: 50,
    },
  }).on("all", async () => {
    process.stdout.write("\x1Bc");
    printBanner();

    // An error here would be an unhandled rejection and stop the dev server
    try {
      const result = await devBuilder();
      if (result) {
        updateState(result);
        await broadcast("update");
      }
    } catch (error) {
      console.error(
        fancyLogFormater("DEV SERVER", "ERROR", {
          message: "Rebuild failed, waiting for the next change",
          cause: error,
        } as RollupLog),
      );
    }

    printWaiting();
  });
};
