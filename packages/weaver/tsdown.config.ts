import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    main: "./src/main.ts",
    cli: "./src/cli.ts",
  },
  sourcemap: true,
  dts: true,
});
