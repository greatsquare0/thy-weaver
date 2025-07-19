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
  <img alt="Dynamic JSON Badge" src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fgreatsquare0%2Fthy-weaver%2Fmain%2Fpackage.json&query=%24.version&label=%20Version&color=magenta">
  <a href='https://github.com/greatsquare0/thy-weaver/blob/main/LICENCE'> 
    <img alt="License: MIT" src="https://img.shields.io/badge/Licence-MIT-blue">
  </a> 
  </div> 
<br>

<p align='center''>Runtime Support</p>
<div align='center'>
  <img alt="Static Badge" src="https://img.shields.io/badge/any_text-Supported-green?label=Bun">
  <img alt="Static Badge" src="https://img.shields.io/badge/any_text-Supported-green?label=Node%2022%20">
  <img alt="Static Badge" src="https://img.shields.io/badge/any_text-Unsupported-red?label=Deno">
</div> 

> This new version is now in open alpha, bugs are expected
> The old version of thy-weaver is available [here](https://github.com/greatsquare0/thy-weaver/releases/tag/legacy)

---
## Why?

For some time now, I have been using [SugarCube Starter by nijikokun](https://github.com/nijikokun/sugarcube-starter), he did a amazing job, but coming from using Vite, the slowness of Webpack really started to bother me

Then, as a bit of a challenge to myself, I wanted to remake it without Webpack

You can consider this a "spiritual successor" (Event though, as far as I know, Nijikokun still is working on SG Starter), and it's mostly based on it

## Features

- Quickly scaffold a new project, (Thanks to [create-weaver](/packages/create-weaver/readme.md))
- Automatic Tweego setup (Thanks to [Tweenode](https://github.com/greatsquare0/tweenode))
- Includes updated story formats, like:
  - SugarCube v2.37.3
  - Harlowe v3.3.9 
  - Chapbook v2.2.0
- Highly customizable, easy to configure
- *Lighting fast* automatic builds
- Local live reload server
- Directory for third-party scripts
- Modern workflow

## Tech Stack

To see more how it works, check out [@thy-weaver/core](/packages/core/readme.md)

> The old version of thy-weaver is available [here](https://github.com/greatsquare0/thy-weaver/releases/tag/legacy)

## Requirements

- [Node 22](https://nodejs.org) or [Bun](https://bun.sh)

> For using with Node, highly recommend using [Fast Node Manager (fnm)](https://github.com/Schniz/fnm)

## Getting started

You may use npm, pnpm or bun package manager, examples uses pnpm:

```bash
pnpm create weaver@latest
```

You be prompted with some configuration (If you want Tailwind for example), after this setup, start developing!


```bash
cd <your-project-path>

pnpm intall 
pnpm weaver setup
pnpm weaver dev
```

This toolkit is more SugarCube oriented.
If you are new to it, check out [Nijikokun SugarCube Basics](https://github.com/nijikokun/sugarcube-starter/wiki/SugarCube-Basics)

### Commands

A help command is available in the cli:
```bash
pnpm weaver --help
```

### Directory Structure

```toml
thy-weaver
├── .vscode/ # Some recommended VSCode configs
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
└── thyweaver.config.ts # Builder and dev server configuration
```

## Documentation

Check out the docs, [available here](https://github.com/greatsquare0/thy-weaver/wiki) (WIP)

---

## Planned features

- [ ] Add support for packaging `dist` directory.
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
