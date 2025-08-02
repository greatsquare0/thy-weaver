---
title: Why?
lang: en-US
---

# Why?
For some time now, I have been using [SugarCube Starter by nijikokun](https://github.com/nijikokun/sugarcube-starter), he did an amazing job, but coming from using Vite, the slowness of Webpack really started to bother me

Then, as a bit of a challenge to myself, I wanted to remake it without Webpack

You can consider this a "spiritual successor" (Event though, as far as I know, Nijikokun still is working on SG Starter), and it's mostly based on it

It has since evolved to more like a library/CLI, to make it easy to add new features and updates

## Features
- Quickly scaffold a new project, (Thanks to [`create-weaver`](https://github.com/greatsquare0/thy-weaver/tree/main/packages/create-weaver))
- Automatic Tweego setup (Thanks to [`tweenode`](https://github.com/greatsquare0/tweenode))
- Includes templates to quickly start a project with story formats, like:
  - SugarCube v2.37.3
  - Harlowe v3.3.9 _(Coming soon)_
  - Chapbook v2.2.0 _(Coming soon)_
- Highly customizable, easy to configure
- _Lighting fast_ automatic builds
- Local live reload server
- Directory for third-party scripts
- Overall modern workflow

## Tech Stack

This encompasses what [`@thy-weaver/core`](https://github.com/greatsquare0/thy-weaver/tree/main/packages/core) uses:

- Rolldown (In place of Webpack and Rollup)
- Optional support for TypeScript
- SWC (In place of Babel)
- PostCSS with:
  - Optional support for TailwindCSS
  - SASS
  - Modern CSS support (If you want to use vanilla CSS)

## Helpful Stuff

### Official Resources

- [SugarCube Docs](https://www.motoslave.net/sugarcube/2/docs/)

### Third-Party Resources

- [Nijikokun's SugarCube Basics](https://github.com/nijikokun/sugarcube-starter/wiki/SugarCube-Basics)
- [Chapel's Custom Macro Collection](https://github.com/ChapelR/custom-macros-for-sugarcube-2)
- [Hogart's SugarCube Macros and Goodies](https://github.com/hogart/sugar-cube-utils)
- [SjoerdHekking's Custom Macros](https://github.com/SjoerdHekking/custom-macros-sugarcube2)
- [GwenTastic's Custom Macros](https://github.com/GwenTastic/Custom-Macros-for-Sugarcube)
- [Cycy Custom Macros](https://github.com/cyrusfirheir/cycy-wrote-custom-macros)
- [HiEv SugarCube Sample Code](https://qjzhvmqlzvoo5lqnrvuhmg-on.drv.tw/UInv/Sample_Code.html#Main%20Menu)
- [Akjosch SugarCube Resources](https://github.com/Akjosch/sugarcube-modules)
- [Mike Westhad SugarCube Resources](https://github.com/mikewesthad/twine-resources)
- [HiEv Universal Inventory](https://github.com/HiEv/UInv)


## Huge Thanks To:

- [@Nijikokun](https://github.com/nijikokun), a lot of this project is based on his SugarCube Starter
- Hituro on [Twine Games Official Discord](https://discordapp.com/invite/n5dJvPp)

And to all the contributors bellow:

## Contributors:

<a href="https://github.com/greatsquare0/thy-weaver/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=greatsquare0/thy-weaver" />
</a>

Made with [contrib.rocks](https://contrib.rocks).
