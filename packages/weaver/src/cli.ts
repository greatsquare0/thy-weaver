#!/usr/bin/env node
import { program } from "commander";
import pkg from "../package.json" with { type: "json" };
const { version, description } = pkg;
import pico from "picocolors";
import { runBuild } from "./run_build.ts";

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
    await runBuild();
  });

program
  .command("dev")
  .description("Start the live dev environment")
  .action((str) => {
    console.log(str);
  });

program
  .command("setup")
  .description("Downloads tweego and storyformats")
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
