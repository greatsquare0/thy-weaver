import { resolve, normalize, sep, posix } from "node:path";
import { cwd } from "node:process";
import { outputFile, type PathLike } from "fs-extra/esm";
import { readFile, stat } from "node:fs/promises";
import type { RollupLog } from "rolldown";
import pico from "picocolors";

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

type Emiters = "ROLLDOWN" | "TWEENODE" | "DEV SERVER";
type LogLevel = "INFO" | "WARN" | "DEBUG" | "ERROR" | "PROGRESS";

const colorizeEmiter = (str: Emiters) => {
  let output = " " + str + " ";

  switch (str) {
    case "DEV SERVER":
      output = pico.bgMagenta(pico.white(pico.bold(output)));
      break;

    case "ROLLDOWN":
      output = pico.bgWhite(pico.black(pico.bold(output)));
      break;

    case "TWEENODE":
      output = pico.bgCyan(pico.white(pico.bold(output)));
      break;
  }

  return output;
};

export const fancyLogFormater = (
  emiter: Emiters,
  logLevel: LogLevel,
  log: RollupLog,
) => {
  const emiterLabel = colorizeEmiter(emiter);

  let levelLabel: string | null = " " + logLevel + " ";
  switch (logLevel) {
    case "INFO":
      levelLabel = pico.bgWhite(pico.dim(pico.bold(levelLabel)));
      break;

    case "WARN":
      levelLabel = pico.bgYellow(pico.black(pico.bold(levelLabel)));
      break;

    case "DEBUG":
      levelLabel = pico.bgWhite(pico.dim(pico.bold(levelLabel)));
      break;

    case "ERROR":
      levelLabel = pico.bgRed(pico.white(pico.bold(levelLabel)));
      break;
    case "PROGRESS":
      levelLabel = null;
      break;
  }

  const result: string[] = [
    `${emiterLabel} ${levelLabel == null ? null : levelLabel} ${log.message}`,
  ];

  log.cause ? result.push(`\n${log.cause}\n`) : null;
  log.meta ? result.push(`\n${log.meta}\n`) : null;
  log.stack ? result.push(`\n${log.stack}\n`) : null;

  return result.join("");
};

export const fancyOraPrefixer = (emiter: Emiters) => {
  return colorizeEmiter(emiter);
};
