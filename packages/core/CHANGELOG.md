# @thy-weaver/core

## 1.1.0

### Minor Changes

- Implement config options that were declared but ignored: ([#40](https://github.com/greatsquare0/thy-weaver/pull/40))

  - `devServer.twineDebug` compiles the story in Twine test mode on `weaver dev` (never on `weaver build`)
  - `bundler.compilationTarget` now sets the browsers SWC and lightningcss compile for (`swc.env.targets`, if set, still wins for scripts)
  - `bundler.additionalAssets` files and folders are copied into `dist/` and served by the dev server, a missing one fails the build
  - The fonts folder (`projectFiles.fontsDir`) is copied to `dist/fonts/` and served at `/fonts/` on dev

  The built-in PostCSS plugins also no longer run twice per build.

- Add `weaver package`, which builds the game and zips `dist/` into `dist/<name>-<version>.zip` for releasing ([#40](https://github.com/greatsquare0/thy-weaver/pull/40))

### Patch Changes

- Fix `weaver setup --clean-setup` (only `-c` was recognized), and `?raw` imports ignoring the encoding: both `?raw&encoding=latin1` and `?raw?encoding=latin1` now work (the old misspelled `enconding` is still accepted). Read errors other than a missing file are now reported instead of crashing the plugin ([#40](https://github.com/greatsquare0/thy-weaver/pull/40))

- Fix `weaver dev` crashing with `TypeError: Cannot read properties of undefined (reading 'push')` when a file changed before any browser tab was open. Every open tab now reloads (before, only the last one connected did), and an error during a rebuild is logged instead of stopping the dev server ([#40](https://github.com/greatsquare0/thy-weaver/pull/40))

## 1.0.3

### Patch Changes

- Bug fixes ([`65851de`](https://github.com/greatsquare0/thy-weaver/commit/65851de881ac2e0129030a55444b4a12c9efe0c1))

## 1.0.1

### Patch Changes

- Small fixes ([`435dce1`](https://github.com/greatsquare0/thy-weaver/commit/435dce1e4d2458615fcbd4aacb58851f5c9c64be))

- Some template fixes ([`918cc83`](https://github.com/greatsquare0/thy-weaver/commit/918cc831d7b63a28cfda40c489556ba37241ea94))

## 1.0.0

### Major Changes

- First release ([`4b2afa7`](https://github.com/greatsquare0/thy-weaver/commit/4b2afa798a11d921e8501111e5d88a272f0eaa20))
