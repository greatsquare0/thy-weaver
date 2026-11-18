import type { Plugin } from "./types.ts";

const order = { pre: 0, normal: 1, post: 2 } as const;

/**
 * Stable sort by `enforce`: "pre" plugins, then normal ones, then "post"
 */
export const sortPlugins = (plugins: Plugin[]): Plugin[] => {
  return [...plugins].sort(
    (a, b) => order[a.enforce ?? "normal"] - order[b.enforce ?? "normal"],
  );
};

/**
 * Runs a plugin hook, tagging any error with the plugin and hook names
 */
export const callHook = async <T>(
  plugin: Plugin,
  hookName: keyof Plugin,
  fn: () => T | Promise<T>,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    throw new Error(
      `Plugin "${plugin.name}" failed in the "${hookName}" hook`,
      { cause: error },
    );
  }
};
