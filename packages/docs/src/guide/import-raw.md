---
title: Importing Raw Files
lang: en-US
---

# Importing Raw Files

Twine games are usually played by opening the HTML file directly, where `fetch()` can't load local files. Instead, ThyWeaver lets you import text files with the `?raw` suffix, and bundles their content inline as a string:

```json [src/assets/app/data/items.json]
{
  "test": "lorem ipsum"
}
```

```js [src/assets/app/index.js]
import rawJson from "./data/items.json?raw";

const items = JSON.parse(rawJson);
```

This is compiled to:

```js
//#region src/assets/app/data/items.json?raw
var rawJson = `{
  "test": "lorem ipsum"
}
`;
//#endregion
```

This is similar to Vite's `?raw`, but binary files like images can't be bundled this way (text based ones like `.svg` work). Put them in [`media/`](/reference/default-file-structure#src-assets) instead.

## Encoding

Files are read as `UTF-8` by default. If a file uses another encoding, add `&encoding=` with the one to use:

```js
import legacyText from "./data/old_save.txt?raw&encoding=latin1";
```

The supported encodings are the same as [Node.js `fs.readFile()`](https://nodejs.org/api/fs.html#fspromisesreadfilepath-options):

```ts
type BufferEncoding =
  | "ascii"
  | "utf8"
  | "utf-8"
  | "utf16le"
  | "ucs2"
  | "ucs-2"
  | "base64"
  | "latin1"
  | "binary"
  | "hex";
```
