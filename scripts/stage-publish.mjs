#!/usr/bin/env node
// Stages every public workspace package whose version isn't on npm yet, using
// npm staged publishing: nothing goes live until a maintainer approves it with
// 2FA (`npm stage approve <id>` or the "Staged Packages" tab on npmjs.com).
// https://docs.npmjs.com/staged-publishing
//
// `npm stage publish` packs the current folder and doesn't understand pnpm's
// `workspace:`/`catalog:` versions, so each package is packed with pnpm first
// (which rewrites them) and staged from the unpacked tarball.
//
// Used as the changesets/action publish script: it prints `New tag: name@version`
// for every staged package, so the action pushes the tags and creates releases.
//
// Usage: node scripts/stage-publish.mjs [--dry-run] [--package <name>] [--allow-new]
//   --dry-run      Pack and run `npm stage publish --dry-run`, no tags, nothing sent
//   --package      Only this package (repeatable)
//   --allow-new    Also stage packages that don't exist on npm yet. CI can't (trusted
//                  publishing needs the package to exist), run this locally once
//                  while logged in to npm, then set up trusted publishing for it

import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    "allow-new": { type: "boolean", default: false },
    package: { type: "string", multiple: true },
  },
});

const MIN_NPM = [11, 15, 0];
const inCI = process.env.GITHUB_ACTIONS === "true";

const run = (command, commandArgs, options = {}) => {
  const result = spawnSync(command, commandArgs, {
    encoding: "utf8",
    // npm and pnpm are .cmd shims on Windows
    shell: process.platform === "win32",
    ...options,
  });
  return {
    ok: result.status === 0,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
};

const fail = (message) => {
  console.error(`::error::${message}`);
  process.exitCode = 1;
};

const npmVersion = run("npm", ["--version"]).stdout.trim();
const compare = (a, b) => {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};
if (compare(npmVersion.split(".").map(Number), MIN_NPM) < 0) {
  console.error(
    `::error::npm ${MIN_NPM.join(".")} or newer is needed for \`npm stage\`, found ${npmVersion}`,
  );
  process.exit(1);
}

const listing = run("pnpm", ["-r", "ls", "--json", "--depth", "-1"]);
if (!listing.ok) {
  console.error(listing.output);
  process.exit(1);
}

const workspaceRoot = run("pnpm", ["root", "-w"])
  .stdout.trim()
  .replace(/[\\/]node_modules$/, "");

const packages = JSON.parse(listing.stdout)
  .filter((pkg) => pkg.path !== workspaceRoot)
  .map((pkg) => ({
    ...pkg,
    manifest: JSON.parse(readFileSync(join(pkg.path, "package.json"), "utf8")),
  }))
  // `private` is sometimes the string "true"
  .filter((pkg) => pkg.name && !pkg.manifest.private)
  .filter((pkg) => !args.package || args.package.includes(pkg.name));

if (args.package) {
  for (const name of args.package) {
    if (!packages.some((pkg) => pkg.name === name))
      fail(`No public workspace package named ${name}`);
  }
}

/**
 * "published", "missing-version" or "missing-package"
 */
const registryState = (name, version) => {
  const pkg = run("npm", ["view", name, "name", "--json"]);
  if (!pkg.ok) {
    if (/E404|404 Not Found/.test(pkg.output)) return "missing-package";
    throw new Error(`npm view ${name} failed:\n${pkg.output}`);
  }
  const ver = run("npm", ["view", `${name}@${version}`, "version", "--json"]);
  return ver.ok && ver.stdout.trim() !== "" ? "published" : "missing-version";
};

const workDir = mkdtempSync(join(tmpdir(), "stage-publish-"));
const staged = [];

try {
  for (const pkg of packages) {
    const { name, version, path } = pkg;
    const id = `${name}@${version}`;

    let state;
    try {
      state = registryState(name, version);
    } catch (error) {
      fail(error.message);
      continue;
    }

    if (state === "published") {
      console.log(`${id} is already on npm, skipping`);
      continue;
    }

    if (state === "missing-package" && !args["allow-new"]) {
      console.log(
        `::warning::${name} isn't on npm yet. Trusted publishing only works for existing packages: ` +
          `stage its first version locally with \`node scripts/stage-publish.mjs --package ${name} --allow-new\`, ` +
          `approve it, then set up trusted publishing for it`,
      );
      continue;
    }

    const packed = run("pnpm", ["pack", "--pack-destination", workDir], {
      cwd: path,
    });
    if (!packed.ok) {
      fail(`pnpm pack failed for ${id}:\n${packed.output}`);
      continue;
    }

    const tarball = readdirSync(workDir).find((file) => file.endsWith(".tgz"));
    const unpackName = name.replace("/", "__");
    const unpackDir = join(workDir, unpackName);
    mkdirSync(unpackDir, { recursive: true });
    // Relative paths: GNU tar reads "C:\..." as a remote host
    const untar = run("tar", ["-xzf", tarball, "-C", unpackName], {
      cwd: workDir,
    });
    rmSync(join(workDir, tarball));
    if (!untar.ok) {
      fail(`Couldn't unpack ${tarball}:\n${untar.output}`);
      continue;
    }

    const manifest = JSON.parse(
      readFileSync(join(unpackDir, "package", "package.json"), "utf8"),
    );
    const leftover = JSON.stringify(manifest).match(
      /"(workspace|catalog):[^"]*"/,
    );
    if (leftover) {
      fail(
        `${id} still has ${leftover[0]} after packing, refusing to stage it`,
      );
      continue;
    }

    const isPrerelease = version.includes("-");
    const tag =
      manifest.publishConfig?.tag ?? (isPrerelease ? undefined : "latest");
    if (!tag) {
      fail(
        `${id} is a pre-release, set publishConfig.tag (e.g. "beta") so it doesn't become latest`,
      );
      continue;
    }

    const stageArgs = ["stage", "publish", "--tag", tag, "--access", "public"];
    // Provenance needs the CI's OIDC identity, it can't be generated locally
    if (inCI) stageArgs.push("--provenance");
    if (args["dry-run"]) stageArgs.push("--dry-run");

    console.log(
      `Staging ${id} (tag: ${tag})${args["dry-run"] ? " [dry run]" : ""}`,
    );
    const result = run("npm", stageArgs, { cwd: join(unpackDir, "package") });
    console.log(result.output);
    if (!result.ok) {
      fail(`npm stage publish failed for ${id}`);
      continue;
    }

    staged.push(id);
    if (!args["dry-run"]) {
      const tagged = run("git", ["tag", id]);
      if (!tagged.ok && !/already exists/.test(tagged.output)) {
        fail(`Couldn't create the git tag ${id}:\n${tagged.output}`);
      }
      // Read by changesets/action to push the tag and create the GitHub release
      console.log(`New tag: ${id}`);
    }
  }
} finally {
  rmSync(workDir, { recursive: true, force: true });
}

if (staged.length > 0 && !args["dry-run"]) {
  console.log(
    `\nStaged ${staged.length} package(s), approve them with 2FA on npmjs.com ("Staged Packages" tab) ` +
      `or with \`npm stage list\` and \`npm stage approve <id>\``,
  );
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Staged on npm, waiting for approval\n\n${staged.map((id) => `- \`${id}\``).join("\n")}\n\n` +
        `Approve with 2FA on npmjs.com (Staged Packages tab) or \`npm stage approve <id>\`.\n`,
    );
  }
} else if (staged.length === 0) {
  console.log("Nothing to stage");
}
