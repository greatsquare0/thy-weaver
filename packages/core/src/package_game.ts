import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { zip, type Zippable } from "fflate";
import ora from "ora";
import pico from "picocolors";
import { runPipeline } from "./pipeline.ts";
import { getPluginManager } from "./plugins/manager.ts";
import { colorizeEmiter, colorizeLabel } from "./utils.ts";

interface PackageData {
  name?: string;
  version?: string;
}

/**
 * Turns a package.json name and version into a safe archive name,
 * `@scope/My Game` + `1.2.0` → `My-Game-1.2.0.zip`
 */
export const toArchiveName = ({ name, version }: PackageData) => {
  const base =
    (name ?? "")
      .replace(/^@[^/]+\//, "")
      .replace(/[^\w.-]+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "") || "game";

  return version ? `${base}-${version}.zip` : `${base}.zip`;
};

/**
 * Zips every file inside `dir` (paths relative to it) into `outFile`,
 * skipping `outFile` itself when it lives inside `dir`
 */
export const zipDirectory = async (dir: string, outFile: string) => {
  const target = resolve(outFile);
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  const files: Zippable = {};

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const absolute = resolve(entry.parentPath, entry.name);
    if (absolute === target) continue;

    // Zip entries always use forward slashes
    const name = relative(dir, absolute).split(sep).join("/");
    files[name] = await readFile(absolute);
  }

  const data = await new Promise<Uint8Array>((done, fail) =>
    zip(files, { level: 9 }, (error, result) =>
      error ? fail(error) : done(result),
    ),
  );

  await writeFile(target, data);

  return { file: target, entries: Object.keys(files).length };
};

/**
 * Builds the game, then zips dist/ into `dist/<name>-<version>.zip`
 */
export const runPackage = async () => {
  const result = await runPipeline("build");

  if (result.html === undefined) {
    process.exitCode = 1;
    return;
  }

  const { paths } = await getPluginManager();
  const spinner = ora({ prefixText: colorizeEmiter("BUNDLER") });
  const startStamp = Date.now();

  let packageData: PackageData = {};
  try {
    packageData = JSON.parse(
      await readFile(join(paths.root, "package.json"), "utf8"),
    );
  } catch {
    // No package.json, fall back to a generic name
  }

  const archive = resolve(paths.dist, toArchiveName(packageData));

  spinner.start("Packaging dist/...");
  try {
    await rm(archive, { force: true });
    const { file, entries } = await zipDirectory(paths.dist, archive);

    spinner.succeed(
      `Packaged ${entries} files in ${pico.yellow(`${Date.now() - startStamp}ms`)}`,
    );
    console.log(`  ${pico.dim("→")} ${pico.cyan(file)}\n`);

    return file;
  } catch (error) {
    spinner.fail(` ${colorizeLabel("ERROR")} Failed to package dist:\n${error}\n`);
    process.exitCode = 1;
  }
};
