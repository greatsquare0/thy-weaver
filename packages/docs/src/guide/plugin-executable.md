---
title: Desktop Executables
lang: en-US
---

# Desktop Executables

::: warning Beta
`@thy-weaver/plugin-executable` is in beta, its options may still change between releases
:::

`@thy-weaver/plugin-executable` packages your game as a desktop app using [Neutralinojs](https://neutralino.js.org/): a small (~3 MB) native program that opens your game in the system's webview (WebView2 on Windows, WebKit on macOS and Linux).

- No extra tools to install, the Neutralino release is downloaded once and cached in `node_modules`
- Package for every platform from any platform
- **Save sync:** the game's `localStorage`, where SugarCube, Harlowe and Chapbook keep their saves, is mirrored to a `saves.json` file in the player's user data folder, so saves survive game updates and can be backed up or synced (e.g. by Steam Cloud)

## Setup

It needs `@thy-weaver/core` 1.1 or newer. Install the beta with your package manager:

::: code-group

```sh [npm]
$ npm add -D @thy-weaver/plugin-executable@beta
```
```sh [pnpm]
$ pnpm add -D @thy-weaver/plugin-executable@beta
```
```sh [bun]
$ bun add -D @thy-weaver/plugin-executable@beta
```

:::

Then add the plugin to your [config file](/reference/config-file#plugins):

```ts [thyweaver.config.ts]
import { defineConfig } from "@thy-weaver/core";
import executable from "@thy-weaver/plugin-executable";

export default defineConfig({
  plugins: [
    executable({
      windowTitle: "My Game",
      // Or "all", defaults to the platform you are on
      targets: ["win_x64", "linux_x64", "mac_universal"],
      window: { width: 1280, height: 800, icon: "src/assets/media/icon.png" },
    }),
  ],
  bundler: {
    watcherDelay: 1000,
  },
});
```

Then build the game and package it:

```sh
weaver build compile
```

Each platform goes to `dist-app/<name>-<target>/`. Ship the **whole folder**, the executable needs the `resources.neu` file next to it.

## Options

| Option | Default | Description |
| ------ | ------- | ----------- |
| `applicationId` | `dev.thyweaver.<package name>` | Unique id of your game, also names the saves folder |
| `windowTitle` | `package.json` name | |
| `window` | 1100 × 750 | `width`, `height`, `minWidth`, `minHeight`, `resizable`, `fullScreen` and `icon` (a `.png`, relative to the project root) |
| `targets` | The current platform | Any of `win_x64`, `linux_x64`, `linux_arm64`, `linux_armhf`, `mac_x64`, `mac_arm64`, `mac_universal`, or `"all"` |
| `outDir` | `"dist-app"` | |
| `port` | `0` (random) | Use a fixed port if you disable save sync, otherwise saves are lost between launches |
| `saves.sync` | `true` | Mirror `localStorage` to disk |
| `saves.fileName` | `"saves.json"` | |
| `enableInspector` | `false` | Opens the webview's developer tools, for debugging |
| `neutralinoVersion` | `"6.10.0"` | |

::: tip
Changing `applicationId` after release moves the saves folder, players would lose their saves
:::

## What Players Need

The system webview: it's built into Windows 11 and macOS, Windows 10 usually already has WebView2, and Linux needs `libwebkit2gtk`.

On macOS the output is a plain executable, not a `.app` bundle yet.
