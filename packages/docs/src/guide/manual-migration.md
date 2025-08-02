---
title: Manual Migration
lang: en-US
---
::: warning
Always backup your work! Be it making manual copies or, better yer, using git (If don't use git, start using it, here is a [helpfull guide](https://github.com/AhmedOsamaMath/git-basics))
:::

# Migrating from ThyWeaver Legacy


The easiest way is using `create-weaver` to scaffold the project in a new directory, and assuming your didn't customize the file structure, carry over `src/` to new directory

Or, if you use git and want to maintain the history for obvious reasons, you can do the opposite.

Scaffold a new "donor" project, delete everything but `src/` folder from your main and copy over everything but `src/` from the "donor" to your main

Don't forget to re-add any dependencies downloaded from NPM that you were using before

## Migrating From Other Solutions

When using other project skeletons or templates, the easiest way is scaffolding a new project with `create-weaver` and move files over like it is migrating from ThyWeaver legacy

But, you probably need to move things around further to adder to the [default file structure](/reference/default-file-structure)

For example, if you come from using [Chapel's tweego-setup](https://github.com/ChapelR/tweego-setup), you need to move stuff like this:

::: info
The content of the folder should be moved, not the folder itself, so any files under `src/modules/` for example, would go in `src/assets/vendor/` instead of the entire `modules/` folder going into `vendor/` 

Any path not especified can probrably be dicarted, like `docs/`
:::

- `project/twee/` would go under `src/story/`
- `src/head-content.html` would go under `src/head_content.html`, don't forget to rename it 

- `src/modules/` would go under `src/assets/vendor/`
- `src/scripts/` would go under `src/assets/app/`, don't forget to have the entry point as `index.js` or `.ts`
- `src/scripts/` would go under `src/assets/app/styles`, don't forget to import the `.css` in your JS like so:

::: code-group

```js [src/assets/app/index.js]
import "./styles/your.css"
import "./styles/yoursecond.css"

```
```ts [src/assets/app/index.ts]
import "./styles/your.css"
import "./styles/yoursecond.css"

```
:::


