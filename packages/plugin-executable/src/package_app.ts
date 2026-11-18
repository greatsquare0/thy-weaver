import { chmod, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import asar from "@electron/asar";
import ora from "ora";
import pico from "picocolors";
import {
  colorizeEmiter,
  tempFolderPath,
  type BuildEndContext,
} from "@thy-weaver/core/plugin_helpers";
import {
  DEFAULT_NEUTRALINO_VERSION,
  resolveTargets,
  type NeutralinoTarget,
  type PluginExecutableOptions,
} from "./options.ts";
import { ensureNeutralinoRuntime } from "./neutralino.ts";

const saveSyncScriptPath = fileURLToPath(
  new URL("../runtime/save-sync.js", import.meta.url),
);

interface PackageData {
  name?: string;
  version?: string;
}

/**
 * "@scope/My Game" -> "My-Game"
 */
const toBinaryName = (name: string) =>
  name
    .replace(/^@[^/]+\//, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "game";

const injectIntoHead = (html: string, snippet: string) => {
  const headTag = /<head(\s[^>]*)?>/i;
  if (!headTag.test(html)) {
    throw new Error("Could not find <head> in the story HTML");
  }
  return html.replace(headTag, (tag) => `${tag}\n${snippet}\n`);
};

const createNeutralinoConfig = (
  options: PluginExecutableOptions,
  meta: {
    applicationId: string;
    version: string;
    title: string;
    binaryName: string;
    icon?: string;
    saveSync: boolean;
  },
) => {
  const nativeAllowList = meta.saveSync
    ? ["app.exit", "os.getPath", "filesystem.*", "events.*"]
    : [];

  return {
    applicationId: meta.applicationId,
    version: meta.version,
    defaultMode: "window",
    port: options.port ?? 0,
    documentRoot: "/resources/",
    url: "/",
    enableServer: true,
    enableNativeAPI: meta.saveSync,
    tokenSecurity: "one-time",
    injectGlobals: meta.saveSync,
    injectClientLibrary: false,
    dataLocation: "system",
    logging: {
      enabled: true,
      writeToLogFile: false,
    },
    nativeAllowList,
    modes: {
      window: {
        title: meta.title,
        width: options.window?.width ?? 1100,
        height: options.window?.height ?? 750,
        minWidth: options.window?.minWidth ?? 400,
        minHeight: options.window?.minHeight ?? 300,
        resizable: options.window?.resizable ?? true,
        fullScreen: options.window?.fullScreen ?? false,
        center: true,
        enableInspector: options.enableInspector ?? false,
        // With save sync, the app exits itself after flushing the saves
        exitProcessOnClose: !meta.saveSync,
        ...(meta.icon ? { icon: meta.icon } : {}),
      },
    },
    cli: {
      binaryName: meta.binaryName,
      resourcesPath: "/resources/",
      clientLibrary: "/resources/js/neutralino.js",
      binaryVersion: options.neutralinoVersion ?? DEFAULT_NEUTRALINO_VERSION,
      clientVersion: options.neutralinoVersion ?? DEFAULT_NEUTRALINO_VERSION,
    },
  };
};

/**
 * Packages the built game (dist/ + final HTML) as a Neutralino app,
 * one folder per target inside `outDir`
 */
export const packageApp = async (
  options: PluginExecutableOptions,
  { paths, html, logger }: BuildEndContext,
) => {
  const startStamp = Date.now();
  const spinner = ora({ prefixText: colorizeEmiter("PLUGIN") });

  const targets = resolveTargets(options.targets);
  const version = options.neutralinoVersion ?? DEFAULT_NEUTRALINO_VERSION;
  const saveSync = options.saves?.sync ?? true;

  if (!saveSync && !options.port) {
    logger.warn(
      "Save sync is disabled and the port is random, saves won't persist between launches. Set a fixed `port` to keep them.",
    );
  }

  const packageData: PackageData = JSON.parse(
    await readFile(resolve(paths.root, "package.json"), "utf8"),
  );
  const binaryName = toBinaryName(packageData.name ?? "game");
  const applicationId =
    options.applicationId ?? `dev.thyweaver.${binaryName.toLowerCase()}`;
  const outDir = resolve(paths.root, options.outDir ?? "dist-app");

  // 1. Runtime
  spinner.start(`Preparing Neutralino v${version}`);
  const runtime = await ensureNeutralinoRuntime(
    version,
    targets,
    tempFolderPath(),
  );
  spinner.succeed(
    runtime.downloaded
      ? `Neutralino v${version} downloaded`
      : `Neutralino v${version} found in cache`,
  );

  // 2. Stage: neutralino.config.json + resources/
  spinner.start("Staging app resources");
  const stage = resolve(paths.stagingDir, "neutralino");
  const resources = resolve(stage, "resources");
  await rm(stage, { recursive: true, force: true });
  await cp(paths.dist, resources, { recursive: true });

  let icon: string | undefined;
  if (options.window?.icon) {
    const iconSource = resolve(paths.root, options.window.icon);
    if (!existsSync(iconSource)) {
      throw new Error(`Window icon not found: ${iconSource}`);
    }
    const iconName = `app-icon${extname(iconSource)}`;
    await cp(iconSource, resolve(resources, iconName));
    icon = `/resources/${iconName}`;
  }

  let finalHtml = html;
  if (saveSync) {
    await mkdir(resolve(resources, "js"), { recursive: true });
    await cp(runtime.client, resolve(resources, "js/neutralino.js"));

    const saveSyncScript = await readFile(saveSyncScriptPath, "utf8");
    const syncOptions = JSON.stringify({
      fileName: options.saves?.fileName ?? "saves.json",
    });
    finalHtml = injectIntoHead(
      html,
      [
        `<script src="/js/neutralino.js"></script>`,
        `<script>window.__THYWEAVER_SAVE_SYNC__ = ${syncOptions};</script>`,
        `<script>${saveSyncScript}</script>`,
      ].join("\n"),
    );
  }
  await writeFile(resolve(resources, "index.html"), finalHtml);

  const config = createNeutralinoConfig(options, {
    applicationId,
    version: packageData.version ?? "1.0.0",
    title: options.windowTitle ?? packageData.name ?? binaryName,
    binaryName,
    icon,
    saveSync,
  });
  await writeFile(
    resolve(stage, "neutralino.config.json"),
    JSON.stringify(config, null, 2),
  );
  spinner.succeed("App resources staged");

  // 3. Pack resources.neu and copy one binary per target
  spinner.start(`Packaging ${targets.join(", ")}`);
  const resourcesNeu = resolve(paths.stagingDir, "resources.neu");
  await asar.createPackage(stage, resourcesNeu);

  const outputs: string[] = [];
  for (const target of targets as NeutralinoTarget[]) {
    const targetDir = resolve(outDir, `${binaryName}-${target}`);
    const executable = resolve(
      targetDir,
      `${binaryName}${target.startsWith("win") ? ".exe" : ""}`,
    );

    // Only remove the folders this plugin creates, never the whole outDir
    await rm(targetDir, { recursive: true, force: true });
    await mkdir(targetDir, { recursive: true });
    await cp(runtime.binaries[target], executable);
    await chmod(executable, 0o755);
    await cp(resourcesNeu, resolve(targetDir, "resources.neu"));
    outputs.push(targetDir);
  }
  await rm(resourcesNeu, { force: true });

  spinner.succeed(
    `App packaged in ${pico.yellow(`${Date.now() - startStamp}ms`)}`,
  );
  for (const output of outputs) {
    console.log(`  ${pico.dim("→")} ${pico.cyan(output)}`);
  }
};
