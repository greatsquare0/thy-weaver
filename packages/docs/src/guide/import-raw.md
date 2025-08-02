---
title: Importing Raw Files
lang: en-US
---

# Importing Raw Files

Since you cannot use `fetch()` when opening a HTML file directly (As is traditional way of distributing a Twine game). ThyWeaver allows to import text files directly and bundle them inline directly using `?raw` keyword

```json [file.json]
{
  "test": "lorem ipsum"
}
```

```js 
import rawJson from 'src/assets/path/to/file.json?raw'

```
This will be compiled as such in your output code:

```js
//#region src/assets/path/to/file.json?raw
var rawJson = `{
  "test": "lorem ipsum"
}
`;
//#endregion
```
This is similar to Vite's implementation, but doesn't support bundling images (Other than `.svg`) this way

By default, the bundler will assume the file is encoded as `UTF-8`, if you find a problem with a file that for some reason, is in other encoding, try using the `?enconding` keyword

```js 
import rawJson from 'src/assets/path/to/file.json?raw?enconding=latin1'

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
  | "hex"

```
