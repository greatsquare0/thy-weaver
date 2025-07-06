import pico from "picocolors";
import { loadConfig } from "./config/config_handler.ts";
import { resolve } from "node:path";
import { cwd } from "node:process";

import postcss from "rollup-plugin-postcss";
import { swc } from "rollup-plugin-swc3";
//import url, { type RollupUrlOptions } from "@rollup/plugin-url";
import type { RolldownOptions, WarningHandlerWithDefault } from "rolldown";

const config = await loadConfig();
//const mode = process.env.NODE_ENV || "development";

const onwarn: WarningHandlerWithDefault = (warning, log) => {
  //Silence circular dependency warning
  if (warning.code === "CIRCULAR_DEPENDENCY") {
    return undefined;
  }
  log(
    `\n\n${pico.inverse(pico.bold(" ROLLUP "))} ${pico.bgYellow(
      pico.bold(" WARN "),
    )} ${warning.message} \n`,
  );
};

export const rolldownOptions: RolldownOptions = {
  onwarn,
  input: resolve(cwd(), config.bundler.filesystem!.projectFiles.entryPoint),
  plugins: [
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
    swc(config.bundler.swc),
  ],
};
