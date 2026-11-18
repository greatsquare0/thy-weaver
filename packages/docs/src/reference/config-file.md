---
title: Config File
lang: en-US
---

# Configuration File

ThyWeaver reads `thyweaver.config.js` or `thyweaver.config.ts` from your project root. Wrap the config in `defineConfig` to get autocompletion and type checking:

::: code-group

```js [thyweaver.config.js]
import { defineConfig } from "@thy-weaver/core";

export default defineConfig({
  devServer: {
    port: 3000,
  },
  bundler: {
    watcherDelay: 1000,
  },
});
```

```ts [thyweaver.config.ts]
import { defineConfig } from "@thy-weaver/core";

export default defineConfig({
  devServer: {
    port: 3000,
  },
  bundler: {
    watcherDelay: 1000,
  },
});
```

:::

::: tip TypeScript or JavaScript
Having a `thyweaver.config.ts` is what makes ThyWeaver treat the project as TypeScript: the default entry point becomes `index.ts` and `tsconfig.json` is used instead of `jsconfig.json`
:::

You only need to write the options you want to change, your config is **deep merged** over the defaults below: objects are merged key by key, and arrays (like `postcss.plugins`) are added to the default ones instead of replacing them.

## `plugins`

- **Type:** `Plugin[]`
- **Default:** `[]`

Plugins that extend the build, the dev server or the CLI, like [`@thy-weaver/plugin-executable`](/guide/plugin-executable). See [Writing Plugins](/guide/writing-plugins) to make your own.

```js
import executable from "@thy-weaver/plugin-executable";

export default defineConfig({
  plugins: [executable({ windowTitle: "My Game" })],
  // ...
});
```

## `devServer`

Options for `weaver dev`.

### `devServer.port`

- **Type:** `number`
- **Default:** `3000`

Port the dev server listens on, your game is served at `http://localhost:<port>/`

### `devServer.restricToLocalhost`

- **Type:** `boolean`
- **Default:** `true`

When `true` the dev server only accepts connections from your own computer. Set it to `false` to open the game from other devices on your network, like your phone. Projects made with `create-weaver` set it to `false`

### `devServer.twineDebug`

- **Type:** `boolean`
- **Default:** `false`

Compiles the story in Twine's test mode while running `weaver dev`, some story formats then offer debug tools (like SugarCube's debug bar). It never applies to `weaver build`, so test mode can't end up in a release by accident

## `bundler`

Options for how your code, styles and assets are processed.

### `bundler.watcherDelay`

- **Type:** `number`
- **Default:** `1000`

Interval in milliseconds the file watcher uses on `weaver dev` when it has to poll for changes (for example on network drives)

### `bundler.compilationTarget`

- **Type:** `string`
- **Default:** `"defaults"`

The browsers your scripts and styles are compiled for, as a [browserslist query](https://browsersl.ist/). Modern syntax is lowered and CSS prefixes are added only as needed for these browsers. It doesn't affect the story format's own code, only yours

```js
bundler: {
  // Support older webviews, like the ones some desktop wrappers use
  compilationTarget: "> 0.5%, last 2 versions, safari >= 12",
}
```

If you set [`bundler.swc`](#bundler-swc) `env.targets` yourself, that one wins for scripts

### `bundler.additionalAssets`

- **Type:** `{ input: string; output: string }[]`
- **Default:** `[]`

Extra files or folders copied as they are into `dist/` when building, and served at the same path by `weaver dev`. Useful for things like licenses, a readme, or files a plugin needs.

- `input` is relative to the project root
- `output` is relative to `dist/`, use `"."` to copy a folder's content into `dist/` itself
- A folder must go to a folder, and a file to a file path

```js
bundler: {
  additionalAssets: [
    { input: "extra/licenses", output: "licenses" },
    { input: "extra/readme.txt", output: "readme.txt" },
  ],
}
```

The build fails if an `input` doesn't exist, or if an `output` points outside `dist/`

### `bundler.swc`

- **Type:** [SWC options](https://swc.rs/docs/configuration/swcrc)
- **Default:** TypeScript parser enabled, minification on production builds

Options passed to [SWC](https://swc.rs/), which compiles your scripts and the ones in `vendor/`. Merged over the defaults, so you only need what you change

### `bundler.postcss`

- **Type:** `{ plugins: PostCSSPlugin[] }`
- **Default:** `{ plugins: [] }`

Your [PostCSS](https://postcss.org/) plugins, like [TailwindCSS](/guide/using-tailwind). ThyWeaver always runs [`postcss-import`](https://github.com/postcss/postcss-import) and [lightningcss](https://lightningcss.dev/) (which adds prefixes for [`compilationTarget`](#bundler-compilationtarget) and minifies on production builds) together with yours, you don't need to add them

```js
import tailwind from "@tailwindcss/postcss";

bundler: {
  postcss: {
    plugins: [tailwind()],
  },
}
```

### `bundler.filesystem`

Where ThyWeaver looks for your files and where it writes the game. All paths are relative to the project root.

| Option | Default | Description |
| ------ | ------- | ----------- |
| `dist` | `"dist/"` | Where the built game goes, **emptied on every build** |
| `stagingDir` | `"node_modules/.lib-weaver-temp/staging/"` | Temporary files between the bundler and Tweego |
| `projectFiles.entryPoint` | `"src/assets/app/index.ts"` with a `thyweaver.config.ts`, `"src/assets/app/index.js"` otherwise | Your main script, everything it imports is bundled |
| `projectFiles.storyDir` | `"src/story/"` | Your `.twee` files |
| `projectFiles.mediaDir` | `"src/assets/media/"` | Images, audio and video, copied to `dist/media/` |
| `projectFiles.fontsDir` | `"src/assets/fonts/"` | Font files, copied to `dist/fonts/` (skipped if the folder doesn't exist) |
| `projectFiles.vendorFilesDir` | `"src/assets/vendor/"` | Third-party `.js` and `.css`, bundled separately from your code |
| `projectFiles.htmlHead` | `"src/head_content.html"` | HTML added to the game's `<head>` |

On `weaver dev`, the media, fonts and additional assets are served at the same paths they get in `dist/`, so `media/cover.webp` or `fonts/game.woff2` work the same in both.

```js
bundler: {
  filesystem: {
    dist: "build/",
    projectFiles: {
      storyDir: "story/",
    },
  },
}
```

## Full Defaults

For reference, this is the config ThyWeaver starts from:

```js
{
  plugins: [],
  devServer: {
    port: 3000,
    restricToLocalhost: true,
    twineDebug: false,
  },
  bundler: {
    watcherDelay: 1000,
    compilationTarget: "defaults",
    additionalAssets: [],
    swc: { /* TypeScript parser, minify on production */ },
    postcss: { plugins: [] },
    filesystem: {
      dist: "dist/",
      stagingDir: "node_modules/.lib-weaver-temp/staging/",
      projectFiles: {
        entryPoint: "src/assets/app/index.ts", // or index.js
        storyDir: "src/story/",
        mediaDir: "src/assets/media/",
        fontsDir: "src/assets/fonts/",
        vendorFilesDir: "src/assets/vendor/",
        htmlHead: "src/head_content.html",
      },
    },
  },
}
```
