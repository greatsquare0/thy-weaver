#!/usr/bin/env node

// Based on create-vite
// https://github.com/vitejs/vite/tree/main/packages/create-vite

import * as prompts from "@clack/prompts";
import pico from "picocolors";
import { existsSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { cwd } from "node:process";
// import mri from "mri";

// const argv = mri(process.argv.slice(2));

const defaultProjectName = "thyweaver-project";

import pkg from "../package.json" with { type: "json" };
import {
  emptyDir,
  formatTargetDir,
  isEmpty,
  isValidPackageName,
  pkgManager,
  toValidPackageName,
} from "./utils.ts";
import { ADDONS, STORYFORMATS } from "./constants.ts";
import { scaffold } from "./scaffold.ts";

const init = async () => {
  prompts.intro(pico.bgMagenta(` ${pico.bold(pkg.name)} `));
  //const argTargetDir = argv._[0] ? formatTargetDir(argv._[0]) : undefined;

  const cancel = () => prompts.cancel();

  //#region Get project name and target dir

  const projectName = await prompts.text({
    message: "Project name:",
    defaultValue: defaultProjectName,
    placeholder: defaultProjectName,
    validate: (value) => {
      return !value || formatTargetDir(value).length > 0
        ? undefined
        : "Invalid project name";
    },
  });

  if (prompts.isCancel(projectName)) return cancel();
  const targetDir = formatTargetDir(projectName);

  //#endregion
  //#region Handle directory if exisit and not enpty

  if (existsSync(targetDir) && !isEmpty(targetDir)) {
    const overwrite = await prompts.select({
      message:
        (targetDir === "."
          ? "Current directory"
          : `Target directory "${targetDir}`) +
        " is not empty. Please choose how to proceed:",
      options: [
        { label: "Cancel operation", value: "no" },
        { label: "Remove existing files and continue", value: "yes" },
        { label: "Ignore files and continue", value: "ignore" },
      ],
    });

    if (prompts.isCancel(projectName)) return cancel();

    switch (overwrite) {
      case "yes":
        emptyDir(targetDir);
        break;

      case "no":
        cancel();
        return;

      default:
        break;
    }
  }

  //#endregion
  //#region Get package name

  let packageName = basename(resolve(targetDir));
  if (!isValidPackageName(packageName)) {
    const result = await prompts.text({
      message: "Package name:",
      defaultValue: toValidPackageName(packageName),
      placeholder: toValidPackageName(packageName),
      validate(value) {
        if (value && !isValidPackageName(value)) {
          return "Invalid package.json name";
        }
      },
    });

    if (prompts.isCancel(result)) return cancel();
    packageName = result;
  }

  //#endregion
  //#region Choose storyformat

  const storyFormat = await prompts.select({
    message: "Select a storyformat:",
    options: STORYFORMATS.map((format) => {
      const colorize = format.color;

      return {
        label: colorize(format.display || format.id),
        value: format,
      };
    }),
  });

  if (prompts.isCancel(storyFormat)) return cancel();

  let storyFormatVersion;
  if (storyFormat.version!.length > 1) {
    const version = await prompts.select({
      message: "Select the storyformat version:",
      options: storyFormat.version!.map((entry) => {
        const colorize = entry.color;

        return {
          label: `v${entry.version} \t ${colorize(entry.display || entry.id)}`,
          value: entry,
        };
      }),
    });

    if (prompts.isCancel(version)) return cancel();
    storyFormatVersion = version;
  } else {
    storyFormatVersion = storyFormat.version![0];
  }

  //#endregion
  //#region Choose addons

  const addons = await prompts.multiselect({
    message: "Select addons:",
    options: ADDONS.map((addon) => {
      const colorize = addon.color;

      return {
        label:
          colorize(addon.display || addon.id) +
          (addon.tooltip ? pico.dim(` (${addon.tooltip})`) : ""),
        value: addon,
      };
    }),
    required: false,
  });

  if (prompts.isCancel(addons)) return cancel();

  //#endregion

  const root = join(cwd(), targetDir);

  scaffold({ root, packageName, storyFormatVersion, addons });

  let doneMessage = "";
  const cdProjectName = relative(cwd(), root);
  doneMessage += `Done. Now run:\n`;
  if (root !== cwd()) {
    doneMessage += `\n  cd ${
      cdProjectName.includes(" ") ? `"${cdProjectName}"` : cdProjectName
    }`;
  }
  switch (pkgManager) {
    case "yarn":
      doneMessage += "\n  yarn";
      doneMessage += "\n  yarn dev";
      break;
    default:
      doneMessage += `\n  ${pkgManager} install`;
      doneMessage += `\n  ${pkgManager} weaver setup`;
      doneMessage += `\n  ${pkgManager} weaver dev`;
      break;
  }
  prompts.outro(doneMessage);
};

init().catch((error) => {
  console.error(error);
});
