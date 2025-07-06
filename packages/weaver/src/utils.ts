import { resolve, normalize, sep, posix } from "node:path";
import { cwd } from "node:process";
import { outputFile, type PathLike } from "fs-extra/esm";
import { readFile, stat } from "node:fs/promises";

export const tempFolderPath = () => {
  return resolve(cwd(), "node_modules", ".lib-weaver-temp");
};

export const isFile = async (path: PathLike) => {
  return (await stat(path)).isFile();
};

/**
 * spellcheck:ignore
 * Based on the concat package by gko
 * @see https://github.com/gko/concat
 */
export const concat = async (files: PathLike[], outputFilePath?: PathLike) => {
  let code: string[] = [];

  for await (const file of files) {
    if (await isFile(file)) {
      code.push(await readFile(file, { encoding: "utf-8" }));
    } else {
      return;
    }
  }

  const result = code.join("\n\n");

  if (outputFilePath) {
    outputFile(outputFilePath as string, result, { encoding: "utf-8" });
  } else {
    return result;
  }
};

export const win2posixPath = (path: string): string => {
  return normalize(path).replaceAll(sep, posix.sep);
};
