---
title: CLI
lang: en-US
---

# Command Line Interface

::: info
In this references, the package manager will be ommited, remember to pre append your command with your package manager (ex.: `npm weaver <command>`)
:::

All commands have `-h, -help` option

## `weaver setup` 

Downloads Tweego and story formats to `.tweenode/` directory

### Usage

```sh
weaver setup
```

### Options

| Option | Description |
| ------ | ----------- |
|`-c, --clean-setup` | Run a clean setup by deleting `.tweego/`dir |

## `weaver dev`

Starts ThyWeaver in development mode and, by default serves the game at `http://localhost:3000`

```sh
weaver dev
```

## `weaver build`

Builds the game and copies `media/` to `dist/`

```sh
weaver build
```

## `weaver build`

::: info
Not implemented yet
:::

Builds the game, copies `media/` and then packages everything into a `.zip`

```sh
weaver package
```
