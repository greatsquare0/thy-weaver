<!-- Logo created using MaterialDesign icons available at: https://github.com/Templarian/MaterialDesign -->
<div align='center'>
  <img align='center' height='200px' alt='Logo' src='./logo.svg'>
</div>

<h1 align='center'>ThyWeaver</h1>

<p align='center'>
  A starter template for a modern Twine development workflow
</p>

<!-- Use this to create badges: -->

<div align='center'>
  <img alt="Dynamic JSON Badge" src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fgreatsquare0%2Fthy-weaver%2Fmain%2Fpackage.json&query=%24.template-version&label=Template%20Version&color=magenta">
  <a href='https://github.com/greatsquare0/thy-weaver/blob/main/TEMPLATE_LICENSE'> 
    <img alt="template license: MIT" src="https://img.shields.io/badge/Template_Licence-MIT-blue">
  </a> 
  </div> 
<br>

<p align='center''>Runtime Support</p>
<div align='center'>
  <img alt="Static Badge" src="https://img.shields.io/badge/any_text-Supported-green?label=Bun">
  <img alt="Static Badge" src="https://img.shields.io/badge/any_text-Supported-green?label=Node%2022%20">
  <img alt="Static Badge" src="https://img.shields.io/badge/any_text-Unsupported-red?label=Deno">
</div> 

---
## Why?

For some time now, I have been using [SugarCube Starter by nijikokun](https://github.com/nijikokun/sugarcube-starter), he did a amazing job, but coming from using Vite, the slowness of Webpack really started to bother me

Then, as a bit of a challenge to myself, I wanted to remake it without Webpack

You can consider this a "spiritual successor" (Event though, as far as I know, Nijikokun still is working on SG Starter), and it's mostly based on it

## Features

- Automatic Tweego setup (Thanks to [Tweenode](https://github.com/greatsquare0/tweenode))
- Includes updated story formats, like:
  - SugarCube v2.37.3
  - Harlowe v3.3.9 
  - Chapbook v2.2.0
- Highly customizable, easy to configure
- *Lighting fast* automatic builds
- Local live reload server
- Directory for custom fonts
- Directory for third-party scripts
- Modern workflow
- Easily pack your game in to a .zip with `pnpm weaver build --zip`

## Tech Stack

- [Rollup](https://rollupjs.org/) (In place of Webpack)
- [Typescript](https://www.typescriptlang.org/)
- [SWC](https://swc.rs/) (In place of Babel)
- [PostCSS](https://postcss.org/) with:
  - [Tailwindcss](https://tailwindcss.com/)
  - [SASS](https://sass-lang.com)
  - [Modern CSS support](https://github.com/onigoetz/postcss-lightningcss) (If you want to use vanilla CSS)

## Requirements

- [Bun](https://bun.sh) or [Node 22](https://nodejs.org)
- [pnpm](https://pnpm.io) (Is now obligatory, as pnpm workspaces are used)

> For using with Node, highly recommend using [Fast Node Manager (fnm)](https://github.com/Schniz/fnm)

## Getting started

It's recommended to use [degit](https://github.com/Rich-Harris/degit) to clone and detach from this repo or use the Github template

1. Clone this repo
```bash
pnpm dlx degit greatsquare0/thy-weaver <project-name>
```

2. Install its dependencies
```bash
pnpm install
```
3. Generate your story IFID, you can use [TADS IFID Generator](https://www.tads.org/ifidgen/ifidgen)
Then place your new IFID on `:: StoryData` passage under [`./src/story/StoryData.twee`](src/story/StoryData.twee), in the ifid field

```js
:: StoryData
{
  "ifid": "<your-new-ifid>",
  "format": "SugarCube",
  "format-version": "2.37.3"
}
```

4. Start developing

```bash
pnpm weaver dev 
```
> For node, prefix the command with `node:` (example: `pnpm run node:dev`)

By default, this template comes setup for SugarCube
If you are new to it, check out [Nijikokun SugarCube Basics](https://github.com/nijikokun/sugarcube-starter/wiki/SugarCube-Basics)

### Commands

Use the included CLI

```
Usage: weaver [options] [command]

A CLI for ThyWeaver projects

Options:
  -V, --version    output the version number
  -h, --help       display help for command

Commands:
  dev [options]    Build, watch files for changes and starts a dev server
  build [options]  Build and output to dist
  help [command]   display help for command

```

> Now, by default, node is used to run all commands, bun can be used passing `-b` or `-useBun`

### Directory Structure
> This file structure has changed, will update this later

```toml
thy-weaver
├── .build/ # Where all build scripts are located
├── .vscode/ # Some recommended VSCode configs
├── .prebuilt/ # Staging directory, files are processed and moved to dist/ (Auto-generated)
├── .tweenode/ # Tweego setup folder, handled by Tweenode (Auto-generated)
├── dist/ # Compiled output directory (Auto-generated)
├── src/ # Story and Story Assets directory
│   ├── assets/ # Story Assets (Scripts, Styles, Media, Fonts)
│   │   ├── app/ # Story JavaScript and Stylesheets
│   │   │   └── styles/ # Story Stylesheets
│   │   ├── fonts/ # Static Fonts to be hosted / distributed
│   │   ├── media/ # Images and Videos
│   │   └── vendor/ # Third-Party Scripts and Modules that aren't available on NPM
│   └── story/ # Twine .twee files
├── tailwind.config.ts # Tailwind configuration
└── thyweaver.config.ts # Builder and dev server configuration
```

## Documentation

Check out the docs, [available here](https://github.com/greatsquare0/thy-weaver/wiki) (WIP)

---

## Planned features

- [x] ~~Add Node 22 support~~
- [ ] Add Deno support 
- [x] ~~Add support for packaging `dist` directory.~~
- [ ] Add support for compiling to Electron or Tauri application.

Want to suggest a feature? [Create a Github issue with your suggestion](https://github.com/greatsquare0/thy-weaver/issues/new/choose)

## Helpful Resources

Starter Kit Resources

- [Nijikokun's SugarCube Basics](https://github.com/nijikokun/sugarcube-starter/wiki/SugarCube-Basics)

Official Resources

- [SugarCube Docs](https://www.motoslave.net/sugarcube/2/docs/)

Third-Party Resources

- [Chapel's Custom Macro Collection](https://github.com/ChapelR/custom-macros-for-sugarcube-2)
- [Hogart's SugarCube Macros and Goodies](https://github.com/hogart/sugar-cube-utils)
- [SjoerdHekking's Custom Macros](https://github.com/SjoerdHekking/custom-macros-sugarcube2)
- [GwenTastic's Custom Macros](https://github.com/GwenTastic/Custom-Macros-for-Sugarcube)
- [Cycy Custom Macros](https://github.com/cyrusfirheir/cycy-wrote-custom-macros)
- [HiEv SugarCube Sample Code](https://qjzhvmqlzvoo5lqnrvuhmg-on.drv.tw/UInv/Sample_Code.html#Main%20Menu)
- [Akjosch SugarCube Resources](https://github.com/Akjosch/sugarcube-modules)
- [Mike Westhad SugarCube Resources](https://github.com/mikewesthad/twine-resources)
- [HiEv Universal Inventory](https://github.com/HiEv/UInv)


## Huge thanks to:

- [@Nijikokun](https://github.com/nijikokun), a lot of this project is based on his SugarCube Starter
