---
title: Default File Structure
lang: en-US
---

# Default File Structure

This is the default file structure shipped with `create-weaver`

```txt
<your-project-name>
├── .vscode/
├── .tweenode/              (created by weaver setup)
├── dist/                   (created by weaver build)
├── src/
│   ├── assets/
│   │   ├── app/
│   │   │   ├── styles/
│   │   │   │   └── main.css
│   │   │   └── index.js    (or index.ts)
│   │   ├── fonts/
│   │   ├── media/
│   │   └── vendor/
│   ├── story/
│   │   ├── Start.twee
│   │   └── StoryData.twee
│   └── head_content.html
├── .editorconfig
├── .gitignore
├── jsconfig.json           (or tsconfig.json)
├── package.json
└── thyweaver.config.js     (or .ts)
```

Picking the linting or Tailwind addons also adds a `.prettierrc.json`.

All the `src/` paths below are defaults, they can be changed in [`bundler.filesystem`](/reference/config-file#bundler-filesystem).

Each one is explained below:

## `.vscode/`

The recommended IDE/Text editor for ThyWeaver is [VSCode](https://code.visualstudio.com/), this directory has:

- `settings.json` For configuring extensions and other settings for just this workspace
- `extensions.json` For recommended extensions, VSCode offers to install them when you open the project

## `.tweenode/`

Created by `weaver setup`, holds the Tweego executable and story format files. It's not meant to be edited manually and is git ignored

## `dist/`

Created when building the game, it has the main game file `index.html` and the `media/` and `fonts/` folders. It's emptied on every build, so don't keep anything in it

## `src/`

Where all your source files go

### `src/assets/`

Where files related to code and media go

| Sub-directory | Description |
| ------------- | ----------- |
| `src/assets/app/` | Where your entry point (`index.js` or `index.ts`) goes. Other scripts can be placed here and imported into the entry point, or, for better organization, in a subfolder like `scripts/` |
| `src/assets/app/styles/` | Your `.css` (or `.scss`) files, imported into your entry point or into `main.css` |
| `src/assets/fonts/` | Font files, copied to `dist/fonts/`. Reference them in your CSS with a path relative to the game, like `url("fonts/my-font.woff2")` |
| `src/assets/media/` | Images, videos and audio, copied to `dist/media/`. Converting images to `.webp` and videos to `.webm` saves a lot of space |
| `src/assets/vendor/` | Third-party scripts and styles, like [Chapel's Custom Macros for SugarCube 2](https://github.com/ChapelR/custom-macros-for-sugarcube-2). They are bundled separately from your code, and loaded before it |

::: tip
`media/` and `fonts/` keep the same paths on `weaver dev` and in `dist/`, so `media/cover.webp` works in both
:::

### `src/story/`

Your `.twee` files. The story needs a `:: StoryData` passage with your story's `ifid` and story format, and a `:: Start` passage. `create-weaver` generates both, with a new `ifid` for your game

### `src/head_content.html`

HTML added to the `<head>` of the game, for things like the favicon, meta tags or web fonts

## `.editorconfig` and `.gitignore`

Keep the editor settings (indentation, line endings) consistent, and keep `node_modules/`, `dist/` and `.tweenode/` out of git

## `jsconfig.json` or `tsconfig.json`

Configures your editor's type checking and how imports are resolved. See [Using TypeScript](/guide/using-typescript)

## `package.json`

Your package configuration, with ThyWeaver and any other npm packages you use

## `thyweaver.config.js` or `.ts`

Your configuration file for ThyWeaver, see the [Config File reference](/reference/config-file)
