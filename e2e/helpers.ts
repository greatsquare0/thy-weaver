import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, symlinkSync } from "node:fs";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ADDONS,
  STORYFORMATS,
  type Addon,
} from "../packages/create-weaver/src/constants.ts";
import { scaffold } from "../packages/create-weaver/src/scaffold.ts";

export const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export const workspacePackages = {
  core: join(repoRoot, "packages", "core"),
  "plugin-executable": join(repoRoot, "packages", "plugin-executable"),
} as const;

export const coreCli = join(workspacePackages.core, "dist", "cli.js");

/**
 * Downloads (Tweego, Neutralino) survive between runs here
 */
export const cacheDir = join(
  repoRoot,
  "node_modules",
  ".cache",
  "thyweaver-e2e",
);
export const tweegoCache = join(cacheDir, ".tweenode");

const sugarcube = STORYFORMATS.find((format) => format.id === "sugarcube")!
  .version![0];

export interface ProjectOptions {
  addons?: Addon["id"][];
  /**
   * Workspace packages to link into node_modules, core is always linked
   */
  link?: (keyof typeof workspacePackages)[];
  /**
   * Copy the cached Tweego install, needed to compile the story
   */
  withTweego?: boolean;
}

export interface TestProject {
  root: string;
  path: (file: string) => string;
  read: (file: string) => Promise<string>;
  write: (file: string, content: string) => Promise<void>;
  edit: (file: string, fn: (content: string) => string) => Promise<void>;
  exists: (file: string) => boolean;
  cleanup: () => Promise<void>;
}

/**
 * Scaffolds a project the same way `create-weaver` does, in a temp folder,
 * with the local workspace packages linked instead of installed from npm
 */
export const createProject = async ({
  addons = [],
  link = [],
  withTweego = true,
}: ProjectOptions = {}): Promise<TestProject> => {
  const tempDir = await mkdtemp(join(tmpdir(), "weaver-e2e-"));
  const root = join(tempDir, "e2e-game");

  scaffold({
    root,
    packageName: "e2e-game",
    storyFormatVersion: sugarcube,
    addons: ADDONS.filter((addon) => addons.includes(addon.id)),
  });

  const links: string[] = [];
  for (const name of new Set(["core", ...link] as const)) {
    const target = join(root, "node_modules", "@thy-weaver", name);
    await mkdir(dirname(target), { recursive: true });
    // Junctions don't need admin rights on Windows
    symlinkSync(workspacePackages[name], target, "junction");
    links.push(target);
  }

  if (withTweego) {
    await cp(tweegoCache, join(root, ".tweenode"), { recursive: true });
  }

  const path = (file: string) => join(root, file);

  return {
    root,
    path,
    read: (file) => readFile(path(file), "utf8"),
    write: async (file, content) => {
      await mkdir(dirname(path(file)), { recursive: true });
      await writeFile(path(file), content);
    },
    edit: async (file, fn) => {
      await writeFile(path(file), fn(await readFile(path(file), "utf8")));
    },
    exists: (file) => existsSync(path(file)),
    cleanup: async () => {
      // Remove the links first so rm never walks into the workspace
      for (const target of links) await unlink(target).catch(() => {});
      await rm(tempDir, { recursive: true, force: true, maxRetries: 5 });
    },
  };
};

const childEnv = () => ({
  ...process.env,
  NO_COLOR: "1",
  FORCE_COLOR: "0",
  NODE_ENV: "production",
});

export interface RunResult {
  code: number | null;
  output: string;
}

/**
 * Runs the `weaver` CLI inside the project and waits for it to exit
 */
export const runWeaver = (
  cwd: string,
  args: string[],
  timeout = 120_000,
): Promise<RunResult> => {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [coreCli, ...args], {
      cwd,
      env: childEnv(),
    });

    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`weaver ${args.join(" ")} timed out:\n${output}`));
    }, timeout);

    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, output });
    });
  });
};

export const freePort = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
  });
};

export interface DevServer {
  url: string;
  output: () => string;
  stop: () => Promise<void>;
}

/**
 * Starts `weaver dev` on a free port and waits until it serves requests
 */
export const startDevServer = async (
  project: TestProject,
  configFile = "thyweaver.config.js",
): Promise<DevServer> => {
  const port = await freePort();
  await project.edit(configFile, (content) =>
    content.replace(/port:\s*\d+/, `port: ${port}`),
  );

  const child: ChildProcess = spawn(process.execPath, [coreCli, "dev"], {
    cwd: project.root,
    env: { ...childEnv(), NODE_ENV: "development" },
  });

  let output = "";
  child.stdout!.on("data", (chunk) => (output += chunk));
  child.stderr!.on("data", (chunk) => (output += chunk));

  const exited = new Promise<void>((resolve) =>
    child.on("close", () => resolve()),
  );

  const stop = async () => {
    if (child.exitCode === null) child.kill();
    await exited;
  };

  try {
    await waitFor(
      () => output.includes("Dev Server available"),
      60_000,
      () => `dev server did not start:\n${output}`,
    );
  } catch (error) {
    await stop();
    throw error;
  }

  return {
    url: `http://localhost:${port}`,
    output: () => output,
    stop,
  };
};

export const waitFor = async (
  check: () => boolean | Promise<boolean>,
  timeout: number,
  message: () => string = () => "timed out",
) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(message());
};
