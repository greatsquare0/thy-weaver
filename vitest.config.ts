import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            // Test plugins against core's sources, no build needed
            "@thy-weaver/core/plugin_helpers": fileURLToPath(
              new URL("packages/core/src/plugins/helpers.ts", import.meta.url),
            ),
          },
        },
        test: {
          name: "unit",
          include: ["packages/*/test/**/*.test.ts"],
          environment: "node",
          restoreMocks: true,
          unstubGlobals: true,
        },
      },
      {
        test: {
          name: "e2e",
          include: ["e2e/**/*.e2e.test.ts"],
          environment: "node",
          globalSetup: ["e2e/global_setup.ts"],
          // Builds spawn real processes and the first run downloads Tweego
          testTimeout: 120_000,
          hookTimeout: 300_000,
          fileParallelism: false,
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["packages/docs/**"],
    },
  },
});
