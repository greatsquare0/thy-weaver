import { defineConfig } from "@thy-weaver/core";

const config = defineConfig({
  devServer: {
    port: 3000,
    restricToLocalhost: false,
    twineDebug: false,
  },
  bundler: {
    watcherDelay: 1000,
    filesystem: {
      projectFiles: {
        entryPoint: "src/assets/app/index.js",
      },
    },
  },
});

export default config;
