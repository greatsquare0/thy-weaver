import { readdirSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const formatTargetDir = (targetDir: string) => {
  return targetDir.trim().replace(/\/+$/g, "");
};

export const isValidPackageName = (projectName: string) => {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName,
  );
};

export const toValidPackageName = (projectName: string) => {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^[._]/, "")
    .replace(/[^a-z\d\-~]+/g, "-");
};

export const isEmpty = (path: string) => {
  const files = readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === ".git");
};

export const emptyDir = (dir: string) => {
  if (!existsSync(dir)) {
    return;
  }
  for (const file of readdirSync(dir)) {
    if (file === ".git") {
      continue;
    }

    rmSync(resolve(dir, file), {
      recursive: true,
      force: true,
    });
  }
};

export const templatesDir = resolve(
  fileURLToPath(import.meta.url),
  "../..",
  "template",
);

interface PkgInfo {
  name: string;
  version: string;
}

export const pkgFromUserAgent = (
  userAgent: string | undefined,
): PkgInfo | undefined => {
  if (!userAgent) return undefined;
  const pkgSpec = userAgent.split(" ")[0];
  const pkgSpecArr = pkgSpec.split("/");
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  };
};

export const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
export const pkgManager = pkgInfo ? pkgInfo.name : "npm";
