import type { Command } from "commander";
import type { H3 } from "h3";
import type { RolldownPluginOption } from "rolldown";
import type {
  BuildContext,
  PipelineMode,
  Plugin,
  PluginContext,
  PluginLogger,
  ProjectPaths,
} from "./types.ts";
import type { ThyWevearOptions } from "../config/config_types.ts";
import { loadConfig } from "../config/config_handler.ts";
import { fancyLogFormater, resolveToProjectRoot } from "../utils.ts";
import { runPipeline } from "../pipeline.ts";
import { callHook, sortPlugins } from "./sort.ts";

export const resolveProjectPaths = (config: ThyWevearOptions): ProjectPaths => {
  const { filesystem } = config.bundler;

  return {
    root: resolveToProjectRoot("."),
    stagingDir: resolveToProjectRoot(filesystem!.stagingDir!),
    dist: resolveToProjectRoot(filesystem!.dist!),
    storyDir: resolveToProjectRoot(filesystem!.projectFiles!.storyDir!),
    mediaDir: resolveToProjectRoot(filesystem!.projectFiles!.mediaDir!),
  };
};

export const createPluginLogger = (name: string): PluginLogger => {
  const format = (message: string) => `[${name}] ${message}`;

  return {
    info: (message) =>
      console.log(fancyLogFormater("PLUGIN", "INFO", { message: format(message) })),
    warn: (message) =>
      console.warn(fancyLogFormater("PLUGIN", "WARN", { message: format(message) })),
    error: (message, cause) =>
      console.error(
        fancyLogFormater("PLUGIN", "ERROR", {
          message: format(message),
          cause,
        }),
      ),
    debug: (message) =>
      console.debug(
        fancyLogFormater("PLUGIN", "DEBUG", { message: format(message) }),
      ),
  };
};

export const createPluginManager = (
  rawPlugins: Plugin[],
  config: ThyWevearOptions,
) => {
  const plugins = sortPlugins(rawPlugins);
  const paths = resolveProjectPaths(config);

  const contexts = new Map<Plugin, PluginContext>(
    plugins.map((plugin) => [
      plugin,
      {
        config,
        paths,
        logger: createPluginLogger(plugin.name),
        runPipeline,
      },
    ]),
  );

  const buildContext = (plugin: Plugin, mode: PipelineMode): BuildContext => ({
    ...contexts.get(plugin)!,
    mode,
    isDev: mode === "dev",
  });

  const configureCli = async (program: Command) => {
    for (const plugin of plugins) {
      const hook = plugin.configureCli;
      if (hook) {
        await callHook(plugin, "configureCli", () =>
          hook(program, contexts.get(plugin)!),
        );
      }
    }
  };

  const buildStart = async (mode: PipelineMode) => {
    for (const plugin of plugins) {
      const hook = plugin.buildStart;
      if (hook) {
        await callHook(plugin, "buildStart", () =>
          hook(buildContext(plugin, mode)),
        );
      }
    }
  };

  const rolldownPlugins = async (
    mode: PipelineMode,
  ): Promise<RolldownPluginOption[]> => {
    const result: RolldownPluginOption[] = [];

    for (const plugin of plugins) {
      const hook = plugin.rolldownPlugins;
      if (hook) {
        const added = await callHook(plugin, "rolldownPlugins", () =>
          hook(buildContext(plugin, mode)),
        );
        if (added) result.push(...added);
      }
    }

    return result;
  };

  const transformStoryHtml = async (html: string, mode: PipelineMode) => {
    let value = html;

    for (const plugin of plugins) {
      const hook = plugin.transformStoryHtml;
      if (hook) {
        const result = await callHook(plugin, "transformStoryHtml", () =>
          hook(value, buildContext(plugin, mode)),
        );
        if (typeof result === "string") value = result;
      }
    }

    return value;
  };

  const buildEnd = async (mode: PipelineMode, html: string) => {
    for (const plugin of plugins) {
      const hook = plugin.buildEnd;
      if (hook) {
        await callHook(plugin, "buildEnd", () =>
          hook({ ...buildContext(plugin, mode), html }),
        );
      }
    }
  };

  const configureDevServer = async (app: H3) => {
    for (const plugin of plugins) {
      const hook = plugin.configureDevServer;
      if (hook) {
        await callHook(plugin, "configureDevServer", () =>
          hook(app, contexts.get(plugin)!),
        );
      }
    }
  };

  return {
    plugins,
    paths,
    configureCli,
    buildStart,
    rolldownPlugins,
    transformStoryHtml,
    buildEnd,
    configureDevServer,
  };
};

export type PluginManager = ReturnType<typeof createPluginManager>;

let managerPromise: Promise<PluginManager> | null = null;

/**
 * Shared plugin manager, created from the resolved config on first use
 */
export const getPluginManager = (): Promise<PluginManager> => {
  managerPromise ??= loadConfig().then((config) =>
    createPluginManager(config.plugins ?? [], config),
  );

  return managerPromise;
};
