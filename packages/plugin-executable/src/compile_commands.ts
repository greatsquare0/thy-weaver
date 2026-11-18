import {
  colorizeEmiter,
  colorizeLabel,
  type BuildEndContext,
} from "@thy-weaver/core/plugin_helpers";
import { cp } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ora from "ora";
import pico from "picocolors";
import type { PluginExecutableOptions } from "./index.ts";

const serverMainPath = resolve(
  fileURLToPath(import.meta.url),
  "../..",
  "server/main.ts",
);
const serverWorkerPath = resolve(
  fileURLToPath(import.meta.url),
  "../..",
  "server/worker.ts",
);

export const runBunCompilation = async (
  options: PluginExecutableOptions,
  { config, paths, html }: BuildEndContext,
) => {
  const startStamp = Date.now();
  const { stagingDir, dist } = paths;

  const spinner = ora({
    prefixText: colorizeEmiter("PLUGIN"),
  });

  const packageData = JSON.parse(
    await Bun.file(resolve(paths.root, "package.json")).text(),
  );

  spinner.start("Copying server files");
  await cp(serverMainPath, resolve(stagingDir, "main.ts"));
  await cp(serverWorkerPath, resolve(stagingDir, "worker.ts"));
  // The worker embeds the story HTML at compile time
  await Bun.write(resolve(stagingDir, "index.html"), html);
  await Bun.write(
    resolve(stagingDir, "config.json"),
    JSON.stringify({
      title: options.windowTitle ? options.windowTitle : packageData.name,
      port: options.server?.port ? options.server?.port : config.devServer?.port,
      mediaPath: "/media",
    }),
  );
  spinner.succeed("Server files copied!");

  spinner.start("Compiling executable");
  try {
    await Bun.build({
      compile: {
        outfile: `${packageData.name}_${packageData.version.replaceAll(".", "-")}`,
        windows:
          process.platform === "win32"
            ? {
                hideConsole: options.windowsSpecific?.hideConsole,
                title: options.windowTitle
                  ? options.windowTitle
                  : packageData.name,
                version: packageData.version,
              }
            : undefined,
      },

      entrypoints: [
        resolve(stagingDir, "main.ts"),
        resolve(stagingDir, "worker.ts"),
      ],
      outdir: dist,
      minify: true,
      sourcemap: true,
    });
    spinner.succeed(
      `Executable compiled in ${pico.yellow(`${Date.now() - startStamp}ms`)}`,
    );
  } catch (error) {
    spinner.fail(
      ` ${colorizeLabel("ERROR")} Failed to compile executable:\n${error}\n`,
    );
  }
};
