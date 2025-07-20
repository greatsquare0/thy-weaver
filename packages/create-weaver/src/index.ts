#!/usr/bin/env node

// Based on create-vite
// https://github.com/vitejs/vite/tree/main/packages/create-vite

import * as prompts from "@clack/prompts";
import pico from "picocolors";
import {
  existsSync,
  cpSync,
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { basename, resolve } from "path";
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
  templatesDir,
  toValidPackageName,
} from "./utils.ts";
import { ADDONS, STORYFORMATS } from "./constants.ts";
import { cwd } from "node:process";
import { dirname, extname, join, relative } from "node:path";
import { deepmerge } from "deepmerge-ts";
import { randomUUID } from "node:crypto";
import { globSync } from "tinyglobby";

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
      return value.length === 0 || formatTargetDir(value).length > 0
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
        if (!isValidPackageName(value)) {
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

  if (
    addons.some((addon) => addon.id === "tailwind") &&
    !addons.some((addon) => addon.id === "linting")
  ) {
    addons.push(ADDONS.filter((addon) => addon.id === "linting")[0]);
  }

  //#endregion

  const root = join(cwd(), targetDir);

  const isTS = addons.some((addon) => addon.id === "typescript");

  const templateBasePath = join(
    templatesDir,
    "base",
    isTS ? "typescript" : "default",
  );

  const templateFormatPath = join(
    templatesDir,
    "formats",
    storyFormatVersion.id,
  );
  const templateConfigPath = join(templatesDir, "config");

  //#region 1) Copy base

  cpSync(templateBasePath, root, { recursive: true, force: true });
  cpSync(join(templatesDir, "base", "common"), root, {
    recursive: true,
    force: true,
  });

  const toRemove = globSync("**/.gitkeep", { cwd: root });
  for (const file of toRemove) {
    rmSync(resolve(root, file), { recursive: true, force: true });
  }

  cpSync(join(templateConfigPath, "vscode"), root, {
    recursive: true,
    force: true,
  });
  cpSync(join(templateConfigPath, "editorconfig"), root, {
    recursive: true,
    force: true,
  });

  //#endregion
  //#region 2) Copy story format stuff

  filterCopy(join(templateFormatPath, "base"), root);

  const templateFormatVersionDir = join(
    templateFormatPath,
    storyFormatVersion.version.replaceAll(".", "_"),
  );

  if (existsSync(join(templateFormatVersionDir, "base"))) {
    filterCopy(join(templateFormatVersionDir, "base"), root);

    if (isTS && existsSync(join(templateFormatVersionDir, "typescript"))) {
      filterCopy(join(templateFormatVersionDir, "typescript"), root);
    }
  } else {
    filterCopy(join(templateFormatVersionDir, "base"), root);
  }

  //#region 3) Copy addon stuff

  const templateAddonsDir = join(templatesDir, "addons");

  for (const addon of addons) {
    if (addon.id !== "typescript") {
      if (existsSync(join(templateAddonsDir, addon.id, "base"))) {
        filterCopy(join(templateAddonsDir, addon.id, "base"), root);
        cpSync(
          join(templateAddonsDir, addon.id, isTS ? "typescript" : "default"),
          root,
          { recursive: true, force: true },
        );
      } else {
        filterCopy(join(templateAddonsDir, addon.id), root);
      }
    }
  }

  //#endregion
  //#region 4) Last touches

  editFile(resolve(root, "package.json"), (content) => {
    return content.replace(
      `"name": "thyweaver-base"`,
      `"name": "${packageName}"`,
    );
  });

  editFile(resolve(root, "src/story/StoryData.twee"), (content) => {
    return content.replace("{{ifid}}", randomUUID().toUpperCase());
  });

  //#endregion

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

const filterCopy = (src: string, dest: string) => {
  for (const file of readdirSync(src, { recursive: true, encoding: "utf-8" })) {
    const srcFile = resolve(src, file);
    const destFile = resolve(dest, file);

    const srcStat = statSync(srcFile);

    if (srcStat.isDirectory() && isEmpty(srcFile)) {
      cpSync(srcFile, destFile, { force: true, recursive: true });
    }

    if (srcStat.isFile()) {
      if (extname(srcFile) === ".json" && existsSync(destFile)) {
        mergeJsonFromFiles(srcFile, destFile);
      } else if (basename(srcFile).startsWith("_")) {
        const newDest = dirname(destFile) + basename(srcFile).replace("_", ".");
        cpSync(srcFile, newDest, { force: true, recursive: true });
      } else {
        cpSync(srcFile, destFile, { force: true, recursive: true });
      }
    }
  }
};

const mergeJsonFromFiles = (fromPath: string, intoPath: string) => {
  let fromFile;
  let intoRaw;
  let fromRaw;

  try {
    fromRaw = readFileSync(fromPath, { encoding: "utf-8" });
    fromFile = JSON.parse(fromRaw);
  } catch (error) {
    console.error(`Error parsing: ${fromPath}\n`, error, "\n\n" + fromRaw);
  }

  let intoFile;
  try {
    intoRaw = readFileSync(intoPath, { encoding: "utf-8" });
    intoFile = JSON.parse(intoRaw);
  } catch (error) {
    console.error(`Error parsing: ${fromPath}\n`, error, "\n\n" + intoRaw);
  }

  const merged = JSON.stringify(deepmerge(intoFile, fromFile), null, 2);
  writeFileSync(intoPath, merged, { encoding: "utf-8" });
};

const editFile = (file: string, callback: (content: string) => string) => {
  const content = readFileSync(file, "utf-8");
  writeFileSync(file, callback(content), "utf-8");
};

init().catch((error) => {
  console.error(error);
});
