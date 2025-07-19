import { defineConfig } from "@thy-weaver/core";
import tailwind from "@tailwindcss/postcss";

const config = defineConfig({
  devServer: {
    port: 3000,
    restricToLocalhost: false,
    twineDebug: false,
  },
  bundler: {
    watcherDelay: 1000,
    postcss: {
      plugins: [tailwind()],
    },
  },
});

export default config;
