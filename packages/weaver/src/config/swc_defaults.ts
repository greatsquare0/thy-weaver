import type { Config } from "@swc/core";
const mode = process.env.NODE_ENV || "development";

const swc: Config = {
  jsc: {
    parser: {
      syntax: "typescript",
    },
    target: undefined,
    minify:
      mode == "production"
        ? {
            mangle: false,
            format: {
              comments: "all",
            },
            compress: {
              defaults: true,
              evaluate: true,
              inline: 3,
            },
          }
        : undefined,
  },
  env: {
    targets: "defaults",
  },
};

export default swc;
