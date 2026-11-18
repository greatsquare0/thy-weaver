---
title: Writing Plugins
lang: en-US
---

# Writing Plugins

Plugins let you hook into every step of ThyWeaver: changing the config, adding Rolldown plugins, editing the compiled story, running code after a build, adding CLI commands or dev server routes.

A plugin is an object with a `name` and the hooks it needs. By convention, it's made by a function so it can take options:

```js [my_plugin.js]
/**
 * @param {{ text?: string }} options
 * @returns {import("@thy-weaver/core/plugin_helpers").Plugin}
 */
export default function credits(options = {}) {
  return {
    name: "credits",
    transformStoryHtml(html) {
      return html.replace("</body>", `<!-- ${options.text ?? "Made with ThyWeaver"} -->\n</body>`);
    },
  };
}
```

Then add it to your [config file](/reference/config-file#plugins):

```js [thyweaver.config.js]
import { defineConfig } from "@thy-weaver/core";
import credits from "./my_plugin.js";

export default defineConfig({
  plugins: [credits({ text: "Thanks for playing!" })],
  // ...
});
```

The types (`Plugin`, `PluginContext`, ...) and helpers like `runBuild` are exported from `@thy-weaver/core/plugin_helpers`.

## How a Build Runs

`weaver build`, `weaver dev` (on every rebuild) and plugin commands all go through the same pipeline:

1. `buildStart` hooks
2. Rolldown bundles your scripts and styles, with the Rolldown plugins from `rolldownPlugins` hooks
3. Tweego compiles the story, then the HTML goes through every `transformStoryHtml` hook
4. *(not on dev)* `dist/` is cleaned, media, fonts and additional assets are copied, and `dist/index.html` is written
5. `buildEnd` hooks

Plugins run in the order they are listed, except that plugins with `enforce: "pre"` always run first and `enforce: "post"` always run last.

If a hook throws, the build fails and the error says which plugin and hook it came from.

## Hooks

| Hook | Runs | Use it to |
| ---- | ---- | --------- |
| `config(config)` | Once, while loading the config | Return options to deep merge into the config |
| `configResolved(config)` | Once, with the final config | Read the final config |
| `configureCli(program, context)` | Once, before the CLI parses arguments | Add commands with [Commander](https://github.com/tj/commander.js) |
| `buildStart(context)` | Start of every pipeline run | Prepare files, start timers |
| `rolldownPlugins(context)` | Every pipeline run | Return extra [Rolldown plugins](https://rolldown.rs/guide/plugin-development) |
| `transformStoryHtml(html, context)` | After Tweego, every run | Return modified HTML, or nothing to keep it |
| `buildEnd(context)` | After a successful run | Use the final HTML (`context.html`) and `dist/` |
| `configureDevServer(app, context)` | Once, when `weaver dev` starts | Add routes or middleware to the [h3](https://h3.dev/) app |

Every hook can be `async`.

::: info
The `config` hook can't add or remove plugins, the list from your config file is the final one
:::

## The Context

Hooks receive a context with:

- `config`: the final, resolved config
- `paths`: absolute paths of the project: `root`, `dist`, `stagingDir`, `storyDir` and `mediaDir`
- `logger`: `info`, `warn`, `error` and `debug` functions that prefix messages with your plugin's name
- `runPipeline(mode, options?)`: runs the whole pipeline again, see [Adding a Command](#adding-a-command)

Build hooks (`buildStart`, `rolldownPlugins`, `transformStoryHtml`, `buildEnd`) also get:

- `mode`: `"build"`, `"dev"`, or the mode a plugin command passed to `runPipeline`
- `isDev`: `true` on `weaver dev`

```js
transformStoryHtml(html, { isDev }) {
  // Only on release builds
  if (!isDev) return html.replace("<title>", "<title>[v1.0] ");
},
```

## Adding a Command

`configureCli` receives the [Commander](https://github.com/tj/commander.js) program, so you can add commands or sub-commands. Use `context.runPipeline` with your own mode to build the game from it, your other hooks can then tell they were triggered by your command:

```js
export default function report() {
  return {
    name: "report",
    configureCli(program, context) {
      program
        .command("report")
        .description("Build the game and print its size")
        .action(async () => {
          const { html } = await context.runPipeline("report");
          if (html === undefined) process.exitCode = 1;
        });
    },
    buildEnd({ mode, html, logger }) {
      if (mode === "report") {
        logger.info(`Story HTML is ${(html.length / 1024).toFixed(1)} KB`);
      }
    },
  };
}
```

```sh
weaver report
```

::: tip
On custom modes the pipeline behaves like `build`: `dist/` is cleaned and written
:::

## Adding Dev Server Routes

`configureDevServer` gets the [h3](https://h3.dev/) app before the server starts:

```js
configureDevServer(app) {
  app.get("/api/time", () => ({ now: Date.now() }));
},
```

## Example

[`@thy-weaver/plugin-executable`](https://github.com/greatsquare0/thy-weaver/tree/main/packages/plugin-executable) is a complete plugin: it adds a `weaver build compile` command that runs the pipeline and packages the game as a desktop app. See [Desktop Executables](/guide/plugin-executable) for how to use it.
