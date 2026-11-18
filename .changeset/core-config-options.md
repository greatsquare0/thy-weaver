---
"@thy-weaver/core": minor
---

Implement config options that were declared but ignored:

- `devServer.twineDebug` compiles the story in Twine test mode on `weaver dev` (never on `weaver build`)
- `bundler.compilationTarget` now sets the browsers SWC and lightningcss compile for (`swc.env.targets`, if set, still wins for scripts)
- `bundler.additionalAssets` files and folders are copied into `dist/` and served by the dev server, a missing one fails the build
- The fonts folder (`projectFiles.fontsDir`) is copied to `dist/fonts/` and served at `/fonts/` on dev

The built-in PostCSS plugins also no longer run twice per build.
