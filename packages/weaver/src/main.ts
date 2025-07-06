#!/usr/bin/env node

import { loadConfig } from "./config/config_handler.ts";
export { defineConfig } from "./config/config_handler.ts";
import { rolldownOptions } from "./rolldown_setup.ts";
export type { ThyWevearOptions } from "./config/config_types.ts";
import { rolldown } from "rolldown";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";

const main = async () => {
  const config = await loadConfig();
  await rm(config.bundler.filesystem!.stagingDir, {
    recursive: true,
    force: true,
  });

  const bundle = await rolldown(rolldownOptions);
  await bundle.write({
    format: "esm",
    file: resolve(config.bundler.filesystem!.stagingDir, "app.bundle.js"),
  });

  bundle.close();
};

await main();

console.log(import.meta.dirname);
console.log(resolve(process.cwd(), "src"));

process.exit(0);
