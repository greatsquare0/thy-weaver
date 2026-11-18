import { resolve } from "node:path";
import { outputFile } from "fs-extra/esm";
import ora from "ora";
import pico from "picocolors";
import { getTweego, moveFiles, runRolldownn } from "./build_commands.ts";
import { getPluginManager } from "./plugins/manager.ts";
import type {
  PipelineMode,
  PipelineOptions,
  PipelineResult,
} from "./plugins/types.ts";
import { colorizeEmiter, colorizeLabel, fancyLogFormater } from "./utils.ts";

const compileStory = async (): Promise<string | undefined> => {
  const tweego = await getTweego("string");

  const spinner = ora({
    prefixText: colorizeEmiter("TWEENODE"),
  });

  spinner.start("Compiling story...");
  const startStamp = Date.now();
  try {
    const result = await tweego.process();

    spinner.succeed(
      `Story compiled in ${pico.yellow(`${Date.now() - startStamp}ms`)}`,
    );

    return result;
  } catch (error) {
    spinner.fail(
      ` ${colorizeLabel("ERROR")} Failed to compile story:\n${error}\n`,
    );
  }
};

/**
 * The single build pipeline used by `build`, `dev` and plugin commands:
 *
 * 1. `buildStart` hooks
 * 2. Rolldown, with the plugins' `rolldownPlugins`
 * 3. Tweego, its HTML passed through `transformStoryHtml` hooks
 * 4. (not on dev) Clean dist/, copy media, write dist/index.html
 * 5. `buildEnd` hooks
 */
export const runPipeline = async (
  mode: PipelineMode,
  { banner = true }: PipelineOptions = {},
): Promise<PipelineResult> => {
  const startStamp = Date.now();
  const manager = await getPluginManager();
  const isDev = mode === "dev";

  if (banner) {
    console.log(
      `\n${pico.bgMagenta(pico.bold(` ThyWeaver - Running in ${mode} mode `))}\n`,
    );
  }

  let html: string | undefined;

  try {
    await manager.buildStart(mode);

    await runRolldownn(await manager.rolldownPlugins(mode));

    const rawHtml = await compileStory();

    if (rawHtml !== undefined) {
      html = await manager.transformStoryHtml(rawHtml, mode);

      if (!isDev) {
        await moveFiles();
        await outputFile(resolve(manager.paths.dist, "index.html"), html);
      }

      await manager.buildEnd(mode, html);
    }
  } catch (error: any) {
    html = undefined;
    console.log(
      fancyLogFormater("PLUGIN", "ERROR", {
        message: error?.message ?? String(error),
        cause: error?.cause,
      }),
    );
  }

  const duration = Date.now() - startStamp;

  if (banner) {
    const label =
      html === undefined
        ? pico.bgRed(pico.bold(` Build failed after ${duration}ms `))
        : pico.bgGreen(pico.bold(` Build finished in ${duration}ms `));

    console.log(`\n${label}ㅤ\n`);
  }

  return { html, duration };
};
