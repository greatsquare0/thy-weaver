import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, posix, relative, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { deepmergeCustom } from "deepmerge-ts";
import { ADDONS, type Addon, type StoryformatVersion } from "./constants.ts";
import { templatesDir } from "./utils.ts";

export interface ScaffoldOptions {
  /**
   * Absolute path of the project folder, created if missing
   */
  root: string;
  packageName: string;
  storyFormatVersion: StoryformatVersion;
  addons: readonly Addon[];
}

type Flavour = "default" | "typescript";

/**
 * The project, built in memory before anything touches the disk.
 * Keys are posix paths relative to the project root
 */
export interface Project {
  files: Map<string, Buffer>;
  /**
   * Folders that must exist even when empty (they hold a `.gitkeep` in the template)
   */
  dirs: Set<string>;
}

/**
 * Adds the addons other addons depend on (e.g. tailwind needs linting),
 * placing each requirement before the addon that needs it so it is applied first
 */
export const resolveAddons = (addons: readonly Addon[]): Addon[] => {
  const result: Addon[] = [];

  const visit = (addon: Addon, path: string[] = []) => {
    if (result.includes(addon)) return;
    if (path.includes(addon.id)) {
      throw new Error(
        `Circular addon requirement: ${[...path, addon.id].join(" -> ")}`,
      );
    }

    for (const id of addon.require ?? []) {
      const required = ADDONS.find((entry) => entry.id === id);
      if (!required)
        throw new Error(`Addon "${addon.id}" requires unknown addon "${id}"`);
      visit(required, [...path, addon.id]);
    }

    result.push(addon);
  };

  for (const addon of addons) visit(addon);
  return result;
};

/**
 * Template folders applied in order, later layers win (JSON files are merged).
 *
 * Every group (`base`, `formats/<id>`, `formats/<id>/<version>`, `addons/<id>`)
 * uses the same layout: a `base/` (or `common/` for the root base) folder applied
 * always, plus an optional `default/` or `typescript/` folder for the flavour
 */
export const templateLayers = (
  storyFormatVersion: StoryformatVersion,
  addons: readonly Addon[],
): string[] => {
  const flavour: Flavour = addons.some((addon) => addon.id === "typescript")
    ? "typescript"
    : "default";

  const group = (...path: string[]) => [
    join(templatesDir, ...path, "base"),
    join(templatesDir, ...path, flavour),
  ];

  return [
    join(templatesDir, "base", "common"),
    join(templatesDir, "base", flavour),
    ...group("formats", storyFormatVersion.id),
    ...group("formats", storyFormatVersion.id, storyFormatVersion.version),
    ...addons.flatMap((addon) => group("addons", addon.id)),
  ].filter((dir) => existsSync(dir));
};

/**
 * Builds the project for the chosen story format and addons, without writing it
 */
export const renderProject = ({
  packageName,
  storyFormatVersion,
  addons: selectedAddons,
}: Omit<ScaffoldOptions, "root">): Project => {
  const addons = resolveAddons(selectedAddons);
  const isTS = addons.some((addon) => addon.id === "typescript");

  if (!existsSync(join(templatesDir, "formats", storyFormatVersion.id))) {
    throw new Error(
      `No template found for story format "${storyFormatVersion.id}"`,
    );
  }

  const project: Project = { files: new Map(), dirs: new Set() };

  for (const layer of templateLayers(storyFormatVersion, addons)) {
    applyLayer(project, layer);
  }

  editJson(project, "package.json", (pkg) => ({ ...pkg, name: packageName }));

  project.files.set(
    `thyweaver.config.${isTS ? "ts" : "js"}`,
    Buffer.from(renderConfig({ isTS, addons })),
  );

  project.files.set(
    "src/story/StoryData.twee",
    Buffer.from(renderStoryData(storyFormatVersion)),
  );

  return project;
};

/**
 * Writes the project for the chosen story format and addons into `root`.
 * Files already in `root` that the template doesn't produce are left alone
 */
export const scaffold = ({ root, ...options }: ScaffoldOptions) => {
  // Render first, so a broken template never leaves a half written project
  const project = renderProject(options);

  for (const dir of project.dirs) {
    mkdirSync(join(root, dir), { recursive: true });
  }

  for (const [file, content] of project.files) {
    const dest = join(root, file);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, content);
  }

  return project;
};

/**
 * Adds a template folder on top of the project:
 * - `_name` files become `.name` (npm drops some dotfiles when publishing)
 * - `.gitkeep` files only mark their folder as needed
 * - `.json` files are deep merged into the existing ones, other files replace them
 */
export const applyLayer = (project: Project, layerDir: string) => {
  const entries = readdirSync(layerDir, {
    recursive: true,
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const srcFile = join(entry.parentPath, entry.name);
    const relDir = relative(layerDir, entry.parentPath)
      .split(sep)
      .join(posix.sep);

    if (entry.name === ".gitkeep") {
      project.dirs.add(relDir);
      continue;
    }

    const name = entry.name.startsWith("_")
      ? `.${entry.name.slice(1)}`
      : entry.name;
    const file = posix.join(relDir, name);
    const content = readFileSync(srcFile);
    const existing = project.files.get(file);

    if (existing && file.endsWith(".json")) {
      const merged = mergeJson(
        parseJson(existing, `${file} (before ${srcFile})`),
        parseJson(content, srcFile),
      );
      project.files.set(file, Buffer.from(stringifyJson(merged)));
    } else {
      project.files.set(file, content);
    }
  }
};

/**
 * Objects merge deeply, arrays are joined without repeated entries
 */
const mergeJson = deepmergeCustom({
  mergeArrays: (values) => [...new Set(values.flat())],
});

const parseJson = (content: Buffer, source: string) => {
  try {
    return JSON.parse(content.toString("utf-8"));
  } catch (error) {
    throw new Error(
      `create-weaver template error: "${source}" must be plain JSON (no comments) to be merged`,
      { cause: error },
    );
  }
};

const stringifyJson = (value: unknown) => JSON.stringify(value, null, 2) + "\n";

const editJson = (
  project: Project,
  file: string,
  edit: (value: Record<string, unknown>) => Record<string, unknown>,
) => {
  const content = project.files.get(file);
  if (!content)
    throw new Error(`create-weaver template error: missing "${file}"`);
  project.files.set(
    file,
    Buffer.from(stringifyJson(edit(parseJson(content, file)))),
  );
};

export const renderStoryData = (format: StoryformatVersion) => {
  const data = {
    ifid: randomUUID().toUpperCase(),
    format: format.name,
    "format-version": format.version,
  };

  return `:: StoryData\n${JSON.stringify(data, null, "\t")}\n`;
};

export const renderConfig = ({
  isTS,
  addons,
}: {
  isTS: boolean;
  addons: readonly Addon[];
}) => {
  const plugins = addons.flatMap((addon) => addon.postcssPlugin ?? []);

  const imports = [
    `import { defineConfig } from "@thy-weaver/core";`,
    ...plugins.map((plugin) => `import ${plugin.name} from "${plugin.from}";`),
  ];

  const bundler = [`    watcherDelay: 1000,`];

  if (!isTS) {
    bundler.push(
      `    filesystem: {`,
      `      projectFiles: {`,
      `        entryPoint: "src/assets/app/index.js",`,
      `      },`,
      `    },`,
    );
  }

  if (plugins.length > 0) {
    bundler.push(
      `    postcss: {`,
      `      plugins: [${plugins.map((plugin) => `${plugin.name}()`).join(", ")}],`,
      `    },`,
    );
  }

  return [
    ...imports,
    ``,
    `const config = defineConfig({`,
    `  devServer: {`,
    `    port: 3000,`,
    `    restricToLocalhost: false,`,
    `    twineDebug: false,`,
    `  },`,
    `  bundler: {`,
    ...bundler,
    `  },`,
    `});`,
    ``,
    `export default config;`,
    ``,
  ].join("\n");
};
