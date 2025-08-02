---
title: Getting Started
lang: en-US
next:
  text: Using Typescript
  link: /guide/using-typescript
---

# Getting Started

## Installation
::: warning Requirements 
- [Node.js](https://nodejs.org/) version 22 or higher or [Bun](https://bun.sh/)
- Familiarity with the terminal to use the CLI
- Supported text editor, currently only [VSCode](https://code.visualstudio.com/)
:::

The fastest way to get started is using the scaffolding CLI [`create-weaver`](https://github.com/greatsquare0/thy-weaver/tree/main/packages/create-weaver)
Make sure to have an up-to-date version of [Node.js](https://nodejs.org/) or [Bun](https://bun.sh/) installed and your current directory is one you intend to create a project.

In your terminal, run the following command with your favorite package manager _(Run without the `$`)_:

::: code-group

```sh [npm]
$ npm create weaver@latest
```
```sh [pnpm]
$ pnpm create weaver@latest
```
```sh [bun]
$ bun create weaver@latest
```

:::

The command will install and execute [`create-weaver`](https://github.com/greatsquare0/thy-weaver/tree/main/packages/create-weaver). You will be prompted for some options to configure your project, like so:

```sh
┌  create-weaver 
│
◇  Project name:
│  thyweaver-project
│
◇  Select a storyformat:
│  ● Sugarcube
│
◇  Select addons:
│  ◻ TailwindCSS (Requires "linting")
│  ◻ TypeScript
│  ◻ Linting (Prettier and Oxlint)
│
└  Done. Now run:

  cd thyweaver-project
  
```

Then, install dependencies:

::: code-group

```sh [npm]
$ npm install 
```
```sh [pnpm]
$ pnpm install
```
```sh [bun]
$ bun install
```

:::

The cli will be available as `weaver`, run the Tweego `setup` command next:

::: code-group

```sh [npm]
$ npm weaver setup
```
```sh [pnpm]
$ pnpm weaver setup
```
```sh [bun]
$ bun weaver setup
```

:::

And finally start in developer mode, a server will automatically make your project available in the browser reload when you make changes:

::: code-group

```sh [npm]
$ npm weaver dev
```
```sh [pnpm]
$ pnpm weaver dev
```
```sh [bun]
$ bun weaver dev
```

:::

You should now have your first ThyWeaver project running!

### Standalone

ThyWeaver can be installed standalone in existing projects that have a `package.json` for manual migration like so:

::: code-group

```sh [npm]
$ npm add -D @thy-weaver/core 
```
```sh [pnpm]
$ pnpm add -D @thy-weaver/core
```
```sh [bun]
$ bun add -D @thy-weaver/core
```

:::

::: info
`@thy-weaver/core` is an ESM-only package, don't use `require()` to import it, and make sure your nearest `package.json` contains `"type": "module"`
:::

You can check-out the manual migration guide [here (WIP)](/guide/manual-migration) 


## File Structure

Assuming you chooses to [`create-weaver`](#installation), the generated file structure will be like so:

```txt
<your-project-name>
├── .vscode/ 
├── .tweenode/ 
├── dist/ 
├── src/ 
│   ├── assets/ 
│   │   ├── app/ 
│   │   │   └── styles/ 
│   │   ├── fonts/ 
│   │   ├── media/ 
│   │   └── vendor/ 
│   └── story/ 
├── package.json 
└── thyweaver.config.js (or .ts)
```

The `src/` directory is considered the **project root**. `.tweenode` is auto-generated when you run `weaver setup` and contains the Tweego executable and story format files.

Your story source files (`.twee`) go in under `src/story/`

More details about the default file structure can be found [here (WIP)](/reference/default-file-structure)


## The Config File

The config file (`thyweaver.config.js`) allows you to configure various aspects of your project and setup plugins.


::: code-group

```js [thyweaver.config.js]
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
```ts [thyweaver.config.ts]
import { defineConfig } from "@thy-weaver/core";

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
```
:::

Consult the [Config Reference](/reference/config-file) for full details on all config options.

When your are ready to ship your game, run the following command:

::: code-group

```sh [npm]
$ npm weaver build 
```
```sh [pnpm]
$ pnpm weaver build
```
```sh [bun]
$ bun weaver build
```

:::

This will compile your story, bundle `.js` and `.css` and copy media over to `dist/`.

## What's Next

- To see what each command of the CLI do, proceed to [CLI Reference](/reference/cli)
- To discover more about the features of ThyWeaver, see the [Guide](/guide/using-typescript)
