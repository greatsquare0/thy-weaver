---
title: CLI
lang: en-US
---

# Command Line Interface

::: info
The CLI is installed in your project as `weaver`. Run it through your package manager: `pnpm weaver <command>`, `bun weaver <command>`, or `npx weaver <command>` with npm. The examples below leave the package manager out
:::

Every command accepts `-h, --help`, and `weaver --version` (or `-V`) prints the installed version.

::: tip
The CLI reads your [config file](/reference/config-file) on start, so run it from your project root
:::

## `weaver setup`

Downloads Tweego and the story formats to the `.tweenode/` folder. If `.tweenode/` already exists, nothing is downloaded

```sh
weaver setup
```

| Option | Description |
| ------ | ----------- |
| `-c, --clean-setup` | Delete `.tweenode/` first and set up from scratch, useful if the install is broken |

## `weaver dev`

Builds the game in development mode and serves it, by default at `http://localhost:3000`. The game is rebuilt and the page reloads every time a file under `src/` changes

```sh
weaver dev
```

Media, fonts and [additional assets](/reference/config-file#bundler-additionalassets) are served from your project folder at the same paths they get in `dist/`. See [`devServer`](/reference/config-file#devserver) for the port, network access and Twine test mode

## `weaver build`

Builds the game into `dist/`: compiles the story, bundles your scripts and styles into `dist/index.html`, and copies media, fonts and additional assets next to it

```sh
weaver build
```

`dist/` is emptied first. The command exits with a non-zero code if the build fails, so CI and scripts can notice

## `weaver package`

Runs `weaver build`, then zips everything in `dist/` into a `.zip` ready for release, saved as `dist/<name>-<version>.zip` (taken from your `package.json`)

```sh
weaver package
```

## Plugin Commands

Plugins can add their own commands, for example [`@thy-weaver/plugin-executable`](/guide/plugin-executable) adds:

```sh
weaver build compile
```

Run `weaver --help` in your project to see every command available, including the ones from your plugins
