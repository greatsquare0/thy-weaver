import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { unzipSync } from "fflate";
import type { NeutralinoTarget } from "./options.ts";

const runtimeUrl = (version: string) =>
  `https://github.com/neutralinojs/neutralinojs/releases/download/v${version}/neutralinojs-v${version}.zip`;

const clientUrl = (version: string) =>
  `https://github.com/neutralinojs/neutralino.js/releases/download/v${version}/neutralino.js`;

export const binaryFileName = (target: NeutralinoTarget) =>
  `neutralino-${target}${target.startsWith("win") ? ".exe" : ""}`;

const download = async (url: string): Promise<Uint8Array> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  return new Uint8Array(await response.arrayBuffer());
};

export interface NeutralinoRuntime {
  binaries: Record<NeutralinoTarget, string>;
  client: string;
  downloaded: boolean;
}

/**
 * Makes sure the Neutralino binaries and client library are in the cache,
 * downloading the official release only once per version
 */
export const ensureNeutralinoRuntime = async (
  version: string,
  targets: NeutralinoTarget[],
  cacheRoot: string,
): Promise<NeutralinoRuntime> => {
  const cacheDir = resolve(cacheRoot, "neutralino", version);
  const binaryPath = (target: NeutralinoTarget) =>
    resolve(cacheDir, binaryFileName(target));
  const client = resolve(cacheDir, "neutralino.js");

  const missingBinaries = targets.some((target) => !existsSync(binaryPath(target)));
  const missingClient = !existsSync(client);

  await mkdir(cacheDir, { recursive: true });

  if (missingBinaries) {
    const zip = await download(runtimeUrl(version));
    const wanted = new Set(targets.map(binaryFileName));
    const files = unzipSync(zip, {
      filter: (file) => wanted.has(file.name),
    });

    for (const target of targets) {
      const data = files[binaryFileName(target)];
      if (!data) {
        throw new Error(
          `Neutralino v${version} has no binary for "${target}"`,
        );
      }
      await writeFile(binaryPath(target), data);
    }
  }

  if (missingClient) {
    await writeFile(client, await download(clientUrl(version)));
  }

  return {
    binaries: Object.fromEntries(
      targets.map((target) => [target, binaryPath(target)]),
    ) as Record<NeutralinoTarget, string>,
    client,
    downloaded: missingBinaries || missingClient,
  };
};
