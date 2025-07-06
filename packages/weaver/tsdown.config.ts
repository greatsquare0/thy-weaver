import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    main: "./src/main.ts",
    config: "./src/config/config_handler.ts",
  },
  sourcemap: true,
  dts: true,
});
