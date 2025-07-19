//@ts-expect-error
import postcssLightningcss from "postcss-lightningcss";
//@ts-expect-error
import postcssImport from "postcss-import";
const mode = process.env.NODE_ENV || "development";

const postcssConfig = {
  plugins: [
    postcssImport(),
    postcssLightningcss({
      browsers: "defaults",
      lightningcssOptions: {
        minify: mode === "production",
        cssModules: false,
      },
    }),
  ],
};

export default postcssConfig;
