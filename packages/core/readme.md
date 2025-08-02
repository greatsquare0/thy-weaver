<!-- Logo created using MaterialDesign icons available at: https://github.com/Templarian/MaterialDesign -->
<div align='center'>
  <img align='center' height='200px' alt='Logo' src='https://raw.githubusercontent.com/greatsquare0/thy-weaver/main/logo.svg'>
</div>

<h1 align='center'>@thy-weaver/core</h1>

<p align='center'>
  A cli to compile a twine story
</p>


## Stack

- [Rolldown](https://rolldown.rs/) (In place of Webpack)
- [Optional support for Typescript](https://www.typescriptlang.org/)
- [SWC](https://swc.rs/) (In place of Babel)
- [PostCSS](https://postcss.org/) with:
  - [Optional support for TailwindCSS](https://tailwindcss.com/)
  - [SASS](https://sass-lang.com)
  - [Modern CSS support](https://github.com/onigoetz/postcss-lightningcss) (If you want to use vanilla CSS)


## Getting started

The easiest way is using `create-weaver`

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

For more information check-out the [docs](https://github.com/greatsquare0/thy-weaver)
## License

MIT

## Disclaimer

This project is not affiliated or endorsed by Twine or The Interactive Fiction Technology Foundation

---

Based on [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite) and [create-vue](https://github.com/vuejs/create-vue/)
