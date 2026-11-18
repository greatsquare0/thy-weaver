import { existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { isAbsolute, join, posix, relative, resolve } from "node:path";
import { cwd } from "node:process";
import { copy } from "fs-extra/esm";
import type { ThyWevearOptions } from "./config/config_types.ts";

/**
 * A file or folder copied as-is into dist/ (and served by the dev server)
 */
export interface StaticMount {
  /**
   * Absolute path of the file or folder in the project
   */
  source: string;
  /**
   * Posix path relative to dist/, `""` is dist/ itself
   */
  target: string;
  /**
   * Missing optional sources are skipped instead of failing the build
   */
  optional: boolean;
}

const isInside = (parent: string, child: string) => {
  const path = relative(parent, child);
  return path === "" || (!path.startsWith("..") && !isAbsolute(path));
};

/**
 * Normalizes an `additionalAssets[].output` to a posix path inside dist/
 */
const toDistPath = (output: string) => {
  // normalize() resolves inner `..` and drops a leading `./`, so anything
  // escaping dist/ is left starting with `..`
  const normalized = posix
    .normalize(output.replaceAll("\\", "/"))
    .replace(/\/+$/, "");

  if (
    isAbsolute(output) ||
    posix.isAbsolute(normalized) ||
    /^[a-zA-Z]:/.test(normalized) ||
    normalized === ".." ||
    normalized.startsWith("../")
  ) {
    throw new Error(
      `additionalAssets output "${output}" must be a path inside dist/`,
    );
  }

  return normalized === "." ? "" : normalized;
};

/**
 * Everything besides media/ that is copied into dist/: the fonts folder and
 * `bundler.additionalAssets`, in that order (later ones win on conflicts)
 */
export const resolveStaticMounts = (
  config: ThyWevearOptions,
  root: string = cwd(),
): StaticMount[] => {
  const { filesystem, additionalAssets = [] } = config.bundler;
  const mounts: StaticMount[] = [];

  const fontsDir = filesystem?.projectFiles?.fontsDir;
  if (fontsDir) {
    mounts.push({
      source: resolve(root, fontsDir),
      target: "fonts",
      optional: true,
    });
  }

  for (const asset of additionalAssets) {
    if (!asset?.input || asset.output === undefined) {
      throw new Error(
        `Every additionalAssets entry needs an "input" and an "output", got ${JSON.stringify(asset)}`,
      );
    }

    mounts.push({
      source: resolve(root, asset.input),
      target: toDistPath(asset.output),
      optional: false,
    });
  }

  return mounts;
};

/**
 * Copies the static mounts into `dist`, failing on a missing required source
 */
export const copyStaticMounts = async (mounts: StaticMount[], dist: string) => {
  const copied: StaticMount[] = [];

  for (const mount of mounts) {
    if (!existsSync(mount.source)) {
      if (mount.optional) continue;
      throw new Error(`Additional asset not found: ${mount.source}`);
    }

    const sourceStat = await stat(mount.source);
    if (sourceStat.isFile() && mount.target === "") {
      throw new Error(
        `Additional asset "${mount.source}" is a file, its output must be a file path inside dist/`,
      );
    }

    await copy(mount.source, join(dist, ...mount.target.split("/")), {
      overwrite: true,
    });
    copied.push(mount);
  }

  return copied;
};

/**
 * Finds the project file a dev server request maps to, mirroring what
 * `copyStaticMounts` would put at that path inside dist/
 * @param urlPath request path, e.g. `/fonts/inter.woff2`
 */
export const findStaticAsset = async (
  urlPath: string,
  mounts: StaticMount[],
): Promise<string | undefined> => {
  let requested: string;
  try {
    requested = decodeURIComponent(urlPath.split("?")[0]);
  } catch {
    return undefined;
  }
  requested = posix.normalize(requested).replace(/^\/+/, "");

  // Later mounts overwrite earlier ones when copied, so they win here too
  for (const mount of mounts.toReversed()) {
    const sourceStat = await stat(mount.source).catch(() => undefined);
    if (!sourceStat) continue;

    let candidate: string | undefined;

    if (sourceStat.isFile()) {
      if (requested === mount.target) candidate = mount.source;
    } else if (mount.target === "") {
      candidate = resolve(mount.source, ...requested.split("/"));
    } else if (requested.startsWith(`${mount.target}/`)) {
      candidate = resolve(
        mount.source,
        ...requested.slice(mount.target.length + 1).split("/"),
      );
    }

    if (!candidate || !isInside(mount.source, candidate)) continue;

    const candidateStat = await stat(candidate).catch(() => undefined);
    if (candidateStat?.isFile()) return candidate;
  }

  return undefined;
};
