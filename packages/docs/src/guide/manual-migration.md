---
title: Manual Migration
lang: en-US
---

# Manual Migration

::: warning
Always back up your work! Be it making manual copies or, better yet, using git (if you don't use git yet, start using it, here is a [helpful guide](https://github.com/AhmedOsamaMath/git-basics))
:::

## Migrating from ThyWeaver Legacy

The easiest way is using `create-weaver` to scaffold a project in a new directory and, assuming you didn't customize the file structure, carry `src/` over to it.

If you use git and want to keep your history, do the opposite: scaffold a new "donor" project, delete everything but the `src/` folder from your project, and copy everything but `src/` from the donor into your project.

Don't forget to re-add any npm dependencies you were using before.

::: tip
Keep your own `src/story/StoryData.twee`, the donor's one has a new `ifid`, and changing it makes Twine treat your story as a different one
:::

## Migrating From Other Solutions

When coming from other project skeletons or templates, the easiest way is also scaffolding a new project with `create-weaver` and moving your files into it.

You will probably need to move things around to match the [default file structure](/reference/default-file-structure) (or change the paths in [`bundler.filesystem`](/reference/config-file#bundler-filesystem)).

For example, coming from [Chapel's tweego-setup](https://github.com/ChapelR/tweego-setup), move things like this:

::: info
Move the content of each folder, not the folder itself: files under `src/modules/`, for example, go in `src/assets/vendor/`, instead of the whole `modules/` folder going into `vendor/`

Paths not listed here can probably be discarded, like `docs/`
:::

- `project/twee/` goes in `src/story/`
- `src/head-content.html` goes to `src/head_content.html`, note the rename
- `src/modules/` goes in `src/assets/vendor/`
- `src/scripts/` goes in `src/assets/app/`, with your main script as the entry point `index.js` (or `index.ts`)
- `src/styles/` goes in `src/assets/app/styles/`, then import the `.css` files in your entry point like so:

::: code-group

```js [src/assets/app/index.js]
import "./styles/your.css";
import "./styles/yoursecond.css";
```

```ts [src/assets/app/index.ts]
import "./styles/your.css";
import "./styles/yoursecond.css";
```

:::
