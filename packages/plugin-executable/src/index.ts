import type { Plugin } from "@thy-weaver/core/plugin_helpers";
import { packageApp } from "./package_app.ts";
import type { PluginExecutableOptions } from "./options.ts";

export type {
  PluginExecutableOptions,
  NeutralinoTarget,
} from "./options.ts";
export { NEUTRALINO_TARGETS } from "./options.ts";

const COMPILE_MODE = "compile";

export default function executablePlugin(
  options: PluginExecutableOptions = {},
): Plugin {
  return {
    name: "executable",
    configureCli(program, context) {
      const buildCmd = program.commands.find((cmd) => cmd.name() === "build");

      if (buildCmd) {
        buildCmd
          .command(COMPILE_MODE)
          .description(
            "Builds the game and packages it as a desktop app (Neutralinojs)",
          )
          .action(async () => {
            await context.runPipeline(COMPILE_MODE);
          });
      }
    },
    async buildEnd(context) {
      if (context.mode !== COMPILE_MODE) return;

      await packageApp(options, context);
    },
  };
}
