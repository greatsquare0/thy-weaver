import type { ThyWevearOptions } from "./config_types.ts";
import swc from "./swc_defaults.ts";
import postcss from "./postcss_defaults.ts";
import { resolve } from "node:path";
import { tempFolderPath } from "../utils.ts";

export const defaultConfig: ThyWevearOptions = {
  devServer: {
    restricToLocalhost: true,
    port: 3000,
    twineDebug: false,
  },
  bundler: {
    watcherDelay: 1000,
    compilationTarget: "defaults",
    swc: swc,
    postcss: postcss,
    filesystem: {
      dist: "dist/",
      projectFiles: {
        entryPoint: "src/assets/app/index.ts",
        fontsDir: "src/assets/fonts/",
        mediaDir: "src/assets/media/",
        vendorFilesDir: "src/assets/vendor/",
        storyDir: "src/story/",
        htmlHead: "src/head_content.html",
      },
      stagingDir: resolve(tempFolderPath(), "staging/"),
    },
  },
};
