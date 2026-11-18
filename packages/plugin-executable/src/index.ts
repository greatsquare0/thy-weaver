import type { Plugin } from "@thy-weaver/core/plugin_helpers";
import { runBunCompilation } from "./compile_commands.ts";
import type { Build } from "bun";

export type Target = Build.Target;

export interface PluginExecutableOptions {
  windowTitle?: string;
  windowsSpecific?: {
    hideConsole?: boolean;
  };
  server?: {
    port: number;
  };
}

const COMPILE_MODE = "compile";

export default function compilePlugin(
  options: PluginExecutableOptions = {},
): Plugin {
  return {
    name: "executable-maker",
    configureCli(program, context) {
      const buildCmd = program.commands.find((cmd) => cmd.name() === "build");

      if (buildCmd) {
        buildCmd
          .command(COMPILE_MODE)
          .description(
            "Compiles and creates a standalone executable for the game",
          )
          .action(async () => {
            if (process.versions.bun) {
              await context.runPipeline(COMPILE_MODE);
            } else {
              context.logger.error("Bun is required to make executables");
            }
          });
      }
    },
    async buildEnd(context) {
      if (context.mode !== COMPILE_MODE) return;

      await runBunCompilation(options, context);
    },
  };
}
