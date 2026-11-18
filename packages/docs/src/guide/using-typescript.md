---
title: Using TypeScript
lang: en-US
---

# Using TypeScript

ThyWeaver supports writing your scripts in TypeScript, and it's the recommended way to use it. Pick the TypeScript addon in `create-weaver`, or set it up yourself in an existing project:

1. Name your config file `thyweaver.config.ts`, this is what tells ThyWeaver the project uses TypeScript
2. Add a `tsconfig.json` to your project root (see below)
3. Name your entry point `index.ts`, under `src/assets/app/` when using the [default file structure](/reference/default-file-structure)
4. Install TypeScript for your editor's type checking: `pnpm add -D typescript`

With a `thyweaver.config.ts`, the default entry point is `src/assets/app/index.ts` and the bundler resolves paths with your `tsconfig.json`. You can still import `.js` files from TypeScript.

`create-weaver` provides the following `tsconfig.json` when scaffolding:

```json [tsconfig.json]
{
  // exclude compiled output from code lookup
  "exclude": ["dist"],
  "compilerOptions": {
    // Enable latest features
    "lib": ["ESNext", "DOM"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    // Bundler mode
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    // Best practices
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    // Some stricter flags (disabled by default)
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false,
    "emitDeclarationOnly": false,
    "sourceMap": false,
    "types": ["@thy-weaver/core/types"]
  }
}
```

## Using Vanilla JavaScript

To use plain JavaScript, name your config `thyweaver.config.js`: the default entry point is then `src/assets/app/index.js`, and paths are resolved with `jsconfig.json`. `create-weaver` also sets the entry point explicitly, so it's easy to change:

```js{11-14} [thyweaver.config.js]
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
```

You can still use [`JSDocs`](https://jsdoc.app/) or simple type checking by providing a `jsconfig.json` in your project root. `create-weaver` comes with one by default
