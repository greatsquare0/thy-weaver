import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { deepmerge } from "deepmerge-ts";
import { globSync } from "tinyglobby";
import { ADDONS, type Addon, type StoryformatVersion } from "./constants.ts";
import { isEmpty, templatesDir } from "./utils.ts";

export interface ScaffoldOptions {
  /**
   * Absolute path of the project folder, created if missing
   */
  root: string;
  packageName: string;
  storyFormatVersion: StoryformatVersion;
  addons: readonly Addon[];
}

/**
 * Adds the addons other addons depend on (e.g. tailwind needs linting)
 */
export const resolveAddons = (addons: readonly Addon[]): Addon[] => {
  const result = [...addons];

  for (const addon of addons) {
    for (const id of addon.require ?? []) {
      if (!result.some((entry) => entry.id === id)) {
        const required = ADDONS.find((entry) => entry.id === id);
        if (required) result.push(required);
      }
    }
  }

  return result;
};

/**
 * Copies the templates for the chosen story format and addons into `root`
 */
export const scaffold = ({
  root,
  packageName,
  storyFormatVersion,
  addons: selectedAddons,
}: ScaffoldOptions) => {
  const addons = resolveAddons(selectedAddons);
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
  filterCopy(join(templatesDir, "base", "common"), root);

  const toRemove = globSync("**/.gitkeep", { cwd: root, dot: true });
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
  }

  //#endregion
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
};

/**
 * Copies `src` into `dest`, merging .json files that already exist and
 * renaming `_name` files to `.name` (npm drops dotfiles when publishing)
 */
export const filterCopy = (src: string, dest: string) => {
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
        const newDest = join(
          dirname(destFile),
          basename(srcFile).replace("_", "."),
        );

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
    console.error(`Error parsing: ${intoPath}\n`, error, "\n\n" + intoRaw);
  }

  const merged = JSON.stringify(deepmerge(intoFile, fromFile), null, 2);
  writeFileSync(intoPath, merged, { encoding: "utf-8" });
};

const editFile = (file: string, callback: (content: string) => string) => {
  const content = readFileSync(file, "utf-8");
  writeFileSync(file, callback(content), "utf-8");
};
