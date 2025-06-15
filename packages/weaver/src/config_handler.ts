import { lilconfig, type Options, defaultLoaders } from "lilconfig";
import swc, { type Options as SWCOptions } from "@swc/core";
import { Script } from "node:vm";

interface AdditionalAsset {
  /**
   * Can be a file or dir
   */
  input: string;
  /**
   * If input is a dir, the output needs to be one too, and vice versa
   */
  output: string;
}

interface BundlerOptions {
  /**
   * To not overload the builder, a delay is needed for the next rebuilding
   * @default 1000
   */
  watcherDelay: number;
  compilationTarget: string;
  additionalAssets?: AdditionalAsset[];
  filesystem?: {
    prebuilding?: {
      project_root: string;
      /**
       * Files that contain code (JS and CSS) are pre bundled and keep on the prebuild folder temporarily
       * The builder will watch for files changes in this dir and rebuild the story
       */
      prebuilding_dir: string;
      app: {
        input_file: string;
        output_file: string;
      };
      /**
       * Styles are automatically extracted when imported on the index.ts
       */
      styles: {
        output_file: string;
      };
      vendor_files: {
        input_dir: string;
        output_js_file: string;
        output_css_file: string;
      };
      media: {
        input_dir: string;
        output_dir: string;
      };
      fonts: {
        input_dir: string;
        output_dir: string;
      };
    };
    dist?: {
      output_dir: string;
      story: {
        input_dir: string;
        html_head: string;
        output_file: string;
      };
      scripts: {
        input_dir: string;
        output_dir: string;
      };
      styles: {
        input_dir: string;
        output_dir: string;
      };
      media: {
        input_dir: string;
        output_dir: string;
      };
      fonts: {
        input_dir: string;
        output_dir: string;
      };
    };
  };

  swc: SWCOptions;
}

interface DevServerOptions {
  hostname: string;
  port: number;
  twineDebug: boolean;
}

interface ThyWevearOptions {
  Developing: {
    devServer: DevServerOptions;
    bundler: BundlerOptions;
  };
}

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
  return result as ThyWevearOptions;
};
