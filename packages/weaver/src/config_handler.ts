import { lilconfig, type Options, defaultLoaders } from "lilconfig";
import swc from "@swc/core";
import { Script } from "node:vm";

const loadTsConfig = async (_filepath: string, content: string) => {
  const script = await swc.transform(content, {
    module: {
      type: "commonjs",
    },
    jsc: {
      target: "es5",
      parser: {
        syntax: "typescript",
      },
    },
  });

  const vmScript = new Script(script.code);
  const sandbox = { module: { exports: {} }, exports: {} };
  vmScript.runInNewContext(sandbox);
  return Object.keys(sandbox.module.exports).length > 0
    ? sandbox.module.exports
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sandbox.exports as any).default || sandbox.exports;
};

const options: Partial<Options> = {
  searchPlaces: ["weaver.config.ts", "weaver.config.js"],
  loaders: {
    ...defaultLoaders,
    ".ts": loadTsConfig,
  },
};

export const loadConfig = async () => {
  const result = await lilconfig("weaver", options).search();
  return result;
};
