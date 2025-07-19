import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    main: "./src/main.ts",
    cli: "./src/cli.ts",
    reload_agent: "./src/dev_server/reload_agent.ts",
  },
  sourcemap: true,
  dts: true,
});
