import { existsSync } from "node:fs";
import { cp, mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  cacheDir,
  coreCli,
  createProject,
  runWeaver,
  tweegoCache,
  workspacePackages,
} from "./helpers.ts";

/**
 * Checks the packages are built and downloads Tweego once into the cache
 */
export default async function setup() {
  const missing = [
    coreCli,
    join(workspacePackages["plugin-executable"], "dist", "index.js"),
  ].filter((file) => !existsSync(file));

  if (missing.length > 0) {
    throw new Error(
      `E2E tests run against the built packages, run "pnpm build" first. Missing:\n${missing.join("\n")}`,
    );
  }

  if (existsSync(tweegoCache)) return;

  const project = await createProject({ withTweego: false });
  try {
    const result = await runWeaver(project.root, ["setup"], 300_000);
    if (!project.exists(".tweenode")) {
      throw new Error(`weaver setup failed:\n${result.output}`);
    }

    await mkdir(cacheDir, { recursive: true });
    await cp(project.path(".tweenode"), tweegoCache, { recursive: true });
  } finally {
    await project.cleanup();
  }
}
