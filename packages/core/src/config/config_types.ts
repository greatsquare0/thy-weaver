import type { Config as SWCOptions } from "@swc/core";

export interface AdditionalAsset {
  /**
   * Can be a file or dir
   */
  input: string;
  /**
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
   * See https://browsersl.ist/ for valid targets, doesn't affect the story format source code, only yours
   * @default 'defaults'
   */
  compilationTarget?: string;
  additionalAssets?: AdditionalAsset[];
  filesystem?: {
    projectFiles?: {
      entryPoint?: string;
      storyDir?: string;
      mediaDir?: string;
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
   * Enables Twine debug/test mode, some formats offer testing tools when enabled
   */
  twineDebug: boolean;
}

export interface ThyWevearOptions {
  devServer?: DevServerOptions;
  bundler: BundlerOptions;
}
