---
title: Using TypeScript
lang: en-US
---

# Using TypeScript

ThyWeaver supports writing your JS with TypeScript, and is the recommended way using it, you just need a `tsconfig.json` in your project root and, assuming you are using the [default file structure](/reference/default-file-structure), an entry point file named `index.ts` under `src/assets/app/`

`create-weaver` provide the following `tsconfig.json` when scaffolding:

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

By default, the bundler will look for an `index.ts`, but, if you wish to use vanilla, you can, by telling it to look for `.js` file instead

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
