import type { Config as SWCOptions } from "@swc/core";
import type { Plugin } from "../plugins/types.ts";

/**
 * A file or folder copied as-is into dist/ on build, and served at the same
 * path by `weaver dev`
 * @example { input: "extra/licenses", output: "licenses" }
 */
export interface AdditionalAsset {
  /**
   * File or folder, relative to the project root. The build fails if it doesn't exist
   */
  input: string;
  /**
   * Where it goes, relative to dist/ (`"."` is dist/ itself, for folders).
   * If input is a dir, the output needs to be one too, and vice versa
   */
  output: string;
}

export interface BundlerOptions {
  /**
   * To not overload the builder, a delay is needed for the next rebuilding
   * @default 1000
   */
  watcherDelay: number;
  /**
   * Browserslist query your scripts (SWC) and styles (lightningcss) are compiled for,
   * see https://browsersl.ist/. Doesn't affect the story format source code, only yours.
   * `swc.env.targets`, if set, wins for scripts
   * @default 'defaults'
   */
  compilationTarget?: string;
  /**
   * Extra files or folders copied into dist/, e.g. licenses or a readme
   */
  additionalAssets?: AdditionalAsset[];
  filesystem?: {
    projectFiles?: {
      entryPoint?: string;
      storyDir?: string;
      mediaDir?: string;
      /**
       * Copied to dist/fonts/ (and served at /fonts/ on dev), skipped if missing
       * @default "src/assets/fonts/"
       */
      fontsDir?: string;
      vendorFilesDir?: string;
      htmlHead?: string;
    };
    stagingDir?: string;
    dist?: string;
  };

  swc?: SWCOptions;
  postcss?: {
    plugins: any[];
  };
}

export interface DevServerOptions {
  restricToLocalhost: boolean;
  port: number;
  /**
   * Compiles the story in Twine debug/test mode on `weaver dev`, some formats
   * offer testing tools when enabled. Never applies to `weaver build`
   * @default false
   */
  twineDebug: boolean;
}

export interface ThyWevearOptions {
  plugins?: Plugin[];
  devServer?: DevServerOptions;
  bundler: BundlerOptions;
}
