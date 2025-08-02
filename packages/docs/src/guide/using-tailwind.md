---
title: Using TailwindCSS
lang: en-US
---

# Using TailwindCSS

ThyWeaver allow you to use [TailwindCSS](https://tailwindcss.com/) to help style your story, by using it as a [PostCSS](https://postcss.org/) plugin

You can scaffold a new project with Tailwind pre-configured using `create-weaver` or install manually like this:

::: code-group

```sh [npm]
$ npm add -D tailwindcss @tailwindcss/postcss
```
```sh [pnpm]
$ pnpm add -D tailwindcss @tailwindcss/postcss
```
```sh [bun]
$ bun add -D tailwindcss @tailwindcss/postcss
```

:::

In your configuration file, import Tailwind and use it as a PostCSS plugin:

::: code-group

```js{2,12-14} [thyweaver.config.js]
import { defineConfig } from "@thy-weaver/core";
import tailwindcss from "@tailwindcss/postcss";

const config = defineConfig({
  devServer: {
    port: 3000,
    restricToLocalhost: false,
    twineDebug: false,
  },
  bundler: {
    watcherDelay: 1000,
    postcss: {
      plugins: [tailwindcss()]
    }
    filesystem: {
      projectFiles: {
        entryPoint: "src/assets/app/index.js",
      },
    },
  },
});

export default config;

```
```ts{2,12-14} [thyweaver.config.ts]
import { defineConfig } from "@thy-weaver/core";
import tailwindcss from "@tailwindcss/postcss";

const config = defineConfig({
  devServer: {
    port: 3000,
    restricToLocalhost: false,
    twineDebug: false,
  },
  bundler: {
    watcherDelay: 1000,
    postcss: {
      plugins: [tailwindcss()]
    }
  },
});

export default config;
```
:::

And assuming you are using the [default file structure](/reference/default-file-structure), import Tailwind in your `main.css` file:

```css [src/assets/app/styles/main.css]
@import 'tailwindcss'
```

## Additional configuration

You may want to use the official [Tailwind VSCode extension](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) to provide syntax highlighting and auto-completions

To provide the completions on `.twee` files, you will need to configure the extension. If don't already have `.vscode/settings.json` in your workspace, create one
```json [.vscode/settings.json]
{
  "tailwindCSS.includeLanguages": {
    "twee3-sugarcube-2": "html",
    "twee3-chapbook-2": "html",
    "twee3-harlowe-3": "html",
    "twee3-harlowe-4": "html"
  }
}
```

More advanced user may want to use [Prettier with Tailwind Sort](https://github.com/tailwindlabs/prettier-plugin-tailwindcss), this comes pre-configured when using `create-weaver`

## Next Steps

Check-out [Tailwind documentation](https://tailwindcss.com/docs/styling-with-utility-classes) to learn how to use it 
