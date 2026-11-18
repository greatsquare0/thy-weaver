import type { ThyWevearOptions } from "./config_types.ts";
import { createBuiltinPostcssPlugins } from "./postcss_defaults.ts";

/**
 * Fills in what depends on other options, once every `config` hook has run:
 * - `bundler.compilationTarget` becomes SWC's `env.targets` (unless set
 *   explicitly in `bundler.swc`) and the browsers lightningcss compiles for
 * - The built-in PostCSS plugins go before the ones from the config
 */
export const resolveDerivedOptions = (
  config: ThyWevearOptions,
): ThyWevearOptions => {
  const { bundler } = config;
  const target = bundler.compilationTarget ?? "defaults";

  return {
    ...config,
    bundler: {
      ...bundler,
      compilationTarget: target,
      swc: {
        ...bundler.swc,
        env: {
          ...bundler.swc?.env,
          targets: bundler.swc?.env?.targets ?? target,
        },
      },
      postcss: {
        ...bundler.postcss,
        plugins: [
          ...createBuiltinPostcssPlugins(target),
          ...(bundler.postcss?.plugins ?? []),
        ],
      },
    },
  };
};
