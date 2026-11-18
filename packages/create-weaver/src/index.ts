#!/usr/bin/env node

// Based on create-vite
// https://github.com/vitejs/vite/tree/main/packages/create-vite

import * as prompts from "@clack/prompts";
import pico from "picocolors";
import { existsSync } from "node:fs";
import { basename, relative, resolve } from "node:path";
import { cwd, stdin, stdout } from "node:process";

import pkg from "../package.json" with { type: "json" };
import {
  emptyDir,
  formatTargetDir,
  isEmpty,
  isValidPackageName,
  pkgManager,
  toValidPackageName,
} from "./utils.ts";
import { ADDONS, STORYFORMATS, type StoryformatVersion } from "./constants.ts";
import { scaffold } from "./scaffold.ts";
import {
  CliError,
  defaults,
  helpMessage,
  parseArgs,
  type ExistingDirAction,
} from "./cli.ts";

/**
 * Thrown when the user cancels a prompt, ends the run quietly
 */
class Cancelled extends Error {}

const ask = <T>(value: T): Exclude<T, symbol> => {
  if (prompts.isCancel(value)) throw new Cancelled();
  return value as Exclude<T, symbol>;
};

const init = async (args: string[]) => {
  const options = parseArgs(args);

  if (options.help) {
    console.log(helpMessage);
    return;
  }

  if (options.version) {
    console.log(pkg.version);
    return;
  }

  const interactive =
    options.interactive ?? Boolean(stdin.isTTY && stdout.isTTY);

  prompts.intro(pico.bgMagenta(` ${pico.bold(pkg.name)} `));

  //#region Project name and target dir

  let targetDir = options.targetDir;

  if (targetDir === undefined && interactive) {
    targetDir = formatTargetDir(
      ask(
        await prompts.text({
          message: "Project name:",
          defaultValue: defaults.targetDir,
          placeholder: defaults.targetDir,
          validate: (value) =>
            !value || formatTargetDir(value).length > 0
              ? undefined
              : "Invalid project name",
        }),
      ),
    );
  }

  targetDir ??= defaults.targetDir;
  const root = resolve(cwd(), targetDir);

  //#endregion
  //#region Existing, non empty, target dir

  if (existsSync(root) && !isEmpty(root)) {
    const where =
      root === cwd() ? "Current directory" : `Target directory "${targetDir}"`;

    let action: ExistingDirAction | "cancel" | undefined = options.existing;

    if (action === undefined) {
      if (!interactive) {
        throw new CliError(
          `${where} is not empty. Pass --overwrite to remove its files, ` +
            `or --ignore-existing to scaffold over them`,
        );
      }

      action = ask(
        await prompts.select<ExistingDirAction | "cancel">({
          message: `${where} is not empty. Please choose how to proceed:`,
          options: [
            { label: "Cancel operation", value: "cancel" },
            { label: "Remove existing files and continue", value: "remove" },
            { label: "Ignore files and continue", value: "ignore" },
          ],
        }),
      );
    }

    if (action === "cancel") throw new Cancelled();
    if (action === "remove") emptyDir(root);
  }

  //#endregion
  //#region Package name

  let packageName = options.packageName ?? basename(root);

  if (!isValidPackageName(packageName)) {
    const suggestion = toValidPackageName(packageName);

    packageName = interactive
      ? ask(
          await prompts.text({
            message: "Package name:",
            defaultValue: suggestion,
            placeholder: suggestion,
            validate: (value) =>
              value && !isValidPackageName(value)
                ? "Invalid package.json name"
                : undefined,
          }),
        )
      : suggestion;
  }

  //#endregion
  //#region Story format

  let storyFormatVersion: StoryformatVersion | undefined =
    options.storyFormatVersion;

  if (!storyFormatVersion && interactive) {
    const storyFormat = ask(
      await prompts.select({
        message: "Select a storyformat:",
        options: STORYFORMATS.map((format) => ({
          label: format.color(format.display || format.id),
          value: format,
        })),
      }),
    );

    const versions = storyFormat.version ?? [];

    storyFormatVersion =
      versions.length > 1
        ? ask(
            await prompts.select({
              message: "Select the storyformat version:",
              options: versions.map((entry) => ({
                label: `v${entry.version} \t ${entry.color(entry.display || entry.id)}`,
                value: entry,
              })),
            }),
          )
        : versions[0];
  }

  storyFormatVersion ??= defaults.storyFormatVersion;

  //#endregion
  //#region Addons

  let addons = options.addons;

  if (!addons && interactive) {
    addons = ask(
      await prompts.multiselect({
        message: "Select addons:",
        options: ADDONS.map((addon) => ({
          label:
            addon.color(addon.display || addon.id) +
            (addon.tooltip ? pico.dim(` (${addon.tooltip})`) : ""),
          value: addon,
        })),
        required: false,
      }),
    );
  }

  addons ??= defaults.addons;

  //#endregion

  if (!interactive) {
    prompts.log.info(
      [
        `Directory:    ${targetDir}`,
        `Package name: ${packageName}`,
        `Template:     ${storyFormatVersion.id}@${storyFormatVersion.version}`,
        `Addons:       ${addons.map((addon) => addon.id).join(", ") || "none"}`,
      ].join("\n"),
    );
  }

  scaffold({ root, packageName, storyFormatVersion, addons });

  let doneMessage = `Done. Now run:\n`;
  const cdProjectName = relative(cwd(), root);
  if (root !== cwd()) {
    doneMessage += `\n  cd ${
      cdProjectName.includes(" ") ? `"${cdProjectName}"` : cdProjectName
    }`;
  }
  // npm can't run package binaries directly, unlike pnpm, yarn and bun
  const runBin = pkgManager === "npm" ? "npx" : pkgManager;
  doneMessage += `\n  ${pkgManager} install`;
  doneMessage += `\n  ${runBin} weaver setup`;
  doneMessage += `\n  ${runBin} weaver dev`;

  prompts.outro(doneMessage);
};

init(process.argv.slice(2)).catch((error) => {
  if (error instanceof Cancelled) {
    prompts.cancel("Operation cancelled");
  } else if (error instanceof CliError) {
    prompts.log.error(error.message);
    console.error(pico.dim(`\nRun with --help to see the available options`));
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
