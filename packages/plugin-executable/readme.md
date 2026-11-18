<!-- Logo created using MaterialDesign icons available at: https://github.com/Templarian/MaterialDesign -->
<div align='center'>
  <img align='center' height='200px' alt='Logo' src='https://raw.githubusercontent.com/greatsquare0/thy-weaver/main/logo.svg'>
</div>

<h1 align='center'>plugin-executable</h1>

<p align='center'>
  Plugin for compiling games to desktop executables (beta)
</p>

---

> [!WARNING]
> This plugin is in beta, its options may still change between releases

For more information check-out the [docs](https://greatsquare0.github.io/thy-weaver/guide/plugin-executable)

## Install

Requires `@thy-weaver/core` 1.1 or newer:

```bash
pnpm add -D @thy-weaver/plugin-executable@beta
```

## What it does

Adds `weaver build compile`, which runs the normal build and then packages the game as a
desktop app using [Neutralinojs](https://neutralino.js.org/): a ~3 MB native binary that
opens the game in the system webview (WebView2 on Windows, WebKit on macOS/Linux).

- No extra tooling: the Neutralino release is downloaded once and cached in `node_modules`
- Package for any platform from any platform
- **Save sync**: the game's localStorage (where SugarCube, Harlowe and Chapbook keep saves)
  is mirrored to `<user data dir>/<applicationId>/saves.json`, so saves survive updates
  and port changes, and can be backed up or synced (e.g. Steam Cloud)

## Usage

```ts
// thyweaver.config.ts
import { defineConfig } from "@thy-weaver/core";
import executable from "@thy-weaver/plugin-executable";

export default defineConfig({
  plugins: [
    executable({
      windowTitle: "My Game",
      targets: ["win_x64", "linux_x64", "mac_universal"], // or "all", defaults to the current platform
      window: { width: 1280, height: 800, icon: "src/assets/media/icon.png" },
    }),
  ],
});
```

```sh
weaver build compile
```

Output goes to `dist-app/<name>-<target>/`. Ship the whole folder (executable + `resources.neu`).

## Options

| Option | Default | |
|---|---|---|
| `applicationId` | `dev.thyweaver.<package name>` | Also names the saves folder |
| `windowTitle` | package name | |
| `window` | 1100x750 | `width`, `height`, `minWidth`, `minHeight`, `resizable`, `fullScreen`, `icon` (.png) |
| `targets` | current platform | `win_x64`, `linux_x64`, `linux_arm64`, `linux_armhf`, `mac_x64`, `mac_arm64`, `mac_universal` or `"all"` |
| `outDir` | `dist-app` | |
| `port` | `0` (random) | Use a fixed port if you disable save sync |
| `saves.sync` | `true` | |
| `saves.fileName` | `saves.json` | |
| `enableInspector` | `false` | |
| `neutralinoVersion` | `6.10.0` | |

## Requirements

Players need the system webview: built into Windows 11 and macOS, WebView2 on Windows 10
(usually already installed), `libwebkit2gtk` on Linux. macOS output is a plain binary, not a `.app` bundle yet.

## License

MIT

## Disclaimer

This project is not affiliated or endorsed by Twine or The Interactive Fiction Technology Foundation
