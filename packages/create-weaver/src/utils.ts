import { readdirSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

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
