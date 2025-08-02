---
title: Default File Structure
lang: en-US
---

# Default File Structure

This is the default file structure shipped with `create-weaver`

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

Each one will be explained in order bellow:

## `.vscode`

The recommended IDE/Text editor for ThyWeaver is [VSCode](https://code.visualstudio.com/), this directory will have:

- `settings.json` For configuring extension and other settings related to just this workspace
- `extensions.json` For recommended extensions

## `.tweenode/`

Auto generated during your setup and holds the Tweego executable and story format files, it's not meant to be edited manually and can be git ignored

## `dist/`

Auto generated when building the story, will contain the main game file `index.html` and a media folder 

## `src/`

Where all your source files will actually go

### `src/assets`

Where files related to code and media go

| Sub-directory | Description |
| ------------- | ----------- |
| `src/assets/app` | Where your entry point JS file goes, other JS files can be let here and imported into entry point, or, for better organization, be placed into a subfolder like `scripts/` |
| `src/assets/app/styles` | Where all `.css` files will go and then be imported into a main CSS file or into your JS entry point (At least the main one) |
| `src/assets/fonts/` | Where fonts files go (WIP, working on a better way to use fonts, for now, better to use [Google Fonts](https://fonts.google.com)) | 
| `src/assets/media/` | Where all media files will go, like images, videos and audio. Highly recommend converting all images to `.webp`, all videos to `.webm`, this saves up a lot of space |
| `src/assets/vendor/` | Any third-party script like a [Chapel Custom Macro for SugarCube 2](https://github.com/ChapelR/custom-macros-for-sugarcube-2) can be placed here |


### `src/story`

Where your `.twee` files will, it's required to have a file with at least a `:: StoryData` passage with your `ifid` and chosen story format, and a `:: Start` passage

## `package.json`

Your package configuration, relevant to use NPM packages

## `thyweaver.config.js` or `.ts`

Your configuration file for ThyWeaver, check-out the documentation [here](/reference/config-file)
