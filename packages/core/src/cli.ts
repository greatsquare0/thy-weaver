#!/usr/bin/env node
import { program } from "commander";
import pkg from "../package.json" with { type: "json" };
const { version, description } = pkg;
import pico from "picocolors";
import { runBuild } from "./run_build.ts";
import { runDev } from "./run_dev.ts";
import { rm } from "fs/promises";
import { resolveToProjectRoot } from "./utils.ts";
import { handleTweegoSetup } from "./build_commands.ts";

program
  .name("weaver")
  .description(
    "\t\t" +
      pico.bgBlue(pico.bgMagenta(pico.bold("  Thy Weaver  "))) +
      "\n" +
      description,
  )
  .version(version);

program
  .command("build")
  .description("Build the project to dist/")
  .action(async (_str) => {
    await runBuild();
  });

program
  .command("dev")
  .description("Start the live dev environment")
  .action(async (_str) => {
    await runDev();
  });

program
  .command("setup")
  .description("Downloads tweego and storyformats")
  .option("-c", "--clean-setup")
  .action(async (options) => {
    console.log(
      `\n${pico.bgMagenta(pico.bold(" ThyWeaver - Running setup "))}ㅤ\n`,
    );
    const startStamp = Date.now();
    if (options.c) {
      await rm(resolveToProjectRoot(".tweenode"), {
        recursive: true,
        force: true,
      });
    }

    await handleTweegoSetup();

    console.log(
      `\n${pico.bgGreen(
        pico.bold(` Setup finished in ${Date.now() - startStamp}ms `),
      )}ㅤ\n`,
    );
  });

program
  .command("package")
  .description(
    "WIP - Build and package the project in to a .zip for distribution",
  )
  .action((_str) => {
    console.log("WIP");
  });

program.parse();
