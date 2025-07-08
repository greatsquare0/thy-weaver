#!/usr/bin/env node
import { program } from "commander";
import pkg from "../package.json" with { type: "json" };
const { version, description } = pkg;
import pico from "picocolors";
import { moveFiles } from "./build_commands.ts";

program
  .name("weaver")
  .description(
    "\t\t" +
      pico.bgBlue(pico.white(pico.bold("  Thy Weaver  "))) +
      "\n" +
      description,
  )
  .version(version);

program
  .command("build")
  .description("Build the project to dist")
  .action(async (_str) => {
    //return import("./run_build.ts");
    await moveFiles();
  });

program
  .command("dev")
  .description("Start the live dev environment")
  .action((str) => {
    console.log(str);
  });

program
  .command("package")
  .description("Build and package the project in to a .zip for distribution")
  .action((str) => {
    console.log(str);
  });

program.parse();
process.exit(0);
