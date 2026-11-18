import postcssLightningcss from "postcss-lightningcss";
//@ts-expect-error
import postcssImport from "postcss-import";

/**
 * PostCSS plugins ThyWeaver always runs, before the ones from the config.
 * @param browsers browserslist query, from `bundler.compilationTarget`
 */
export const createBuiltinPostcssPlugins = (browsers: string) => {
  const mode = process.env.NODE_ENV || "development";

  return [
    postcssImport(),
    postcssLightningcss({
      browsers,
      lightningcssOptions: {
        minify: mode === "production",
        cssModules: false,
      },
    }),
  ];
};
