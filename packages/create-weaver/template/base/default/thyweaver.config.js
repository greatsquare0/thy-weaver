import { defineConfig } from "@thy-weaver/weaver";

const config = defineConfig({
  devServer: {
    port: 3000,
    restricToLocalhost: false,
    twineDebug: false,
  },
  bundler: {
    watcherDelay: 1000,
  },
});

export default config;
