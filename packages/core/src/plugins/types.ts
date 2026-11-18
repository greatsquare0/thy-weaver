import type { Command } from "commander";
import type { H3 } from "h3";
import type { RolldownPluginOption } from "rolldown";
import type { ThyWevearOptions } from "../config/config_types.ts";

/**
 * Built-in pipeline modes. Plugins may run the pipeline under their own mode
 * name (e.g. `"compile"`) through `PluginContext.runPipeline`.
 */
export type PipelineMode = "build" | "dev" | (string & {});

/**
 * Absolute, already resolved paths of the current project
 */
export interface ProjectPaths {
  root: string;
  stagingDir: string;
  dist: string;
  storyDir: string;
  mediaDir: string;
}

export interface PluginLogger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string, cause?: unknown) => void;
  debug: (message: string) => void;
}

export interface PipelineOptions {
  /**
   * Prints the mode banner and the final timing message
   * @default true
   */
  banner?: boolean;
}

export interface PipelineResult {
  /**
   * The compiled story HTML, undefined if a step failed
   */
  html?: string;
  duration: number;
}

export interface PluginContext {
  config: Readonly<ThyWevearOptions>;
  paths: Readonly<ProjectPaths>;
  /**
   * Logger labeled with the plugin name
   */
  logger: PluginLogger;
  /**
   * Runs the full build pipeline (bundler -> story compiler -> file copy),
   * calling every plugin hook along the way.
   * Use a custom mode to let your own hooks know they were triggered by you.
   */
  runPipeline: (
    mode: PipelineMode,
    options?: PipelineOptions,
  ) => Promise<PipelineResult>;
}

export interface BuildContext extends PluginContext {
  mode: PipelineMode;
  isDev: boolean;
}

export interface BuildEndContext extends BuildContext {
  /**
   * Final story HTML, after every `transformStoryHtml` hook
   */
  html: string;
}

type MaybePromise<T> = T | Promise<T>;

export interface Plugin {
  name: string;
  /**
   * Hook ordering, plugins with "pre" run first and "post" run last
   */
  enforce?: "pre" | "post";

  /**
   * Modify the user config before it's resolved.
   * The returned object is deep merged into the config.
   */
  config?: (
    config: ThyWevearOptions,
  ) => MaybePromise<Partial<ThyWevearOptions> | void>;
  /**
   * Called once with the final config
   */
  configResolved?: (config: Readonly<ThyWevearOptions>) => MaybePromise<void>;

  /**
   * Add or modify CLI commands
   */
  configureCli?: (program: Command, context: PluginContext) => MaybePromise<void>;

  /**
   * Called before the bundler runs, on every pipeline run (every rebuild on dev)
   */
  buildStart?: (context: BuildContext) => MaybePromise<void>;
  /**
   * Extra Rolldown plugins, appended after the built-in ones
   */
  rolldownPlugins?: (
    context: BuildContext,
  ) => MaybePromise<RolldownPluginOption[] | void>;
  /**
   * Transform the compiled story HTML, return nothing to keep it unchanged
   */
  transformStoryHtml?: (
    html: string,
    context: BuildContext,
  ) => MaybePromise<string | void>;
  /**
   * Called after the pipeline finished successfully
   */
  buildEnd?: (context: BuildEndContext) => MaybePromise<void>;

  /**
   * Register extra routes or middleware on the dev server
   */
  configureDevServer?: (app: H3, context: PluginContext) => MaybePromise<void>;
}

export type PluginConstructor<Options = any> = (options?: Options) => Plugin;
