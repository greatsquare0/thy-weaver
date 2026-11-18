import { resolve } from "node:path";
import { cwd } from "node:process";

import postcss from "rollup-plugin-postcss";
import { swc } from "rollup-plugin-swc3";
//import url, { type RollupUrlOptions } from "@rollup/plugin-url";
import type {
  LogLevel,
  LogOrStringHandler,
  Plugin,
  RolldownOptions,
  RolldownPluginOption,
  RollupLog,
  TransformResult,
} from "rolldown";

import { loadConfig } from "./config/config_handler.ts";
import { handleVendorFiles, rawImportSupport } from "./rolldown_plugins.ts";
import { fancyLogFormater, isTS, resolveToProjectRoot } from "./utils.ts";

//const mode = process.env.NODE_ENV || "development";

const onLog = (
  level: LogLevel,
  log: RollupLog,
  defaultHandler: LogOrStringHandler,
) => {
  switch (level) {
    case "debug":
      defaultHandler("debug", fancyLogFormater("ROLLDOWN", "DEBUG", log));
      break;

    case "info":
      defaultHandler("info", fancyLogFormater("ROLLDOWN", "INFO", log));
      break;

    case "warn":
      //Silence circular dependency warning
      if (log.code !== "CIRCULAR_DEPENDENCY") {
        defaultHandler("warn", fancyLogFormater("ROLLDOWN", "WARN", log));
      }

      break;
    default:
      break;
  }
};

// Rolldown 1.x picks the module type from the file extension and no longer
// bundles CSS itself, so a plugin that compiles styles into JS has to say so.
export const asJsModule = (plugin: Plugin): Plugin => {
  const transform = plugin.transform as (
    ...args: unknown[]
  ) => Promise<TransformResult> | TransformResult;

  return {
    ...plugin,
    async transform(...args: unknown[]) {
      const result = await transform.apply(this, args);
      if (result && typeof result === "object") {
        return { ...result, moduleType: "js" };
      }
      return result;
    },
  } as Plugin;
};

export const setupRolldown = async (
  extraPlugins: RolldownPluginOption[] = [],
) => {
  const config = await loadConfig();

  return {
    onLog,
    input: resolve(cwd(), config.bundler.filesystem!.projectFiles!.entryPoint!),
    resolve: {
      tsconfigFilename: isTS
        ? resolveToProjectRoot("tsconfig.json")
        : resolveToProjectRoot("jsconfig.json"),
    },
    plugins: [
      rawImportSupport(),
      asJsModule(
        // @ts-expect-error
        postcss({
          module: false,
          plugins: config.bundler.postcss!.plugins,
          extract: true,
          //sourceMap: mode === "development",
          modules: false,
          autoModules: false,
          use: {
            sass: {
              silenceDeprecations: ["legacy-js-api"],
            },
          },
        }),
      ),
      handleVendorFiles(),
      swc(config.bundler.swc),
      ...extraPlugins,
    ],
  } as RolldownOptions;
};
