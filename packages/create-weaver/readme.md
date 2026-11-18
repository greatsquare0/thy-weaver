<!-- Logo created using MaterialDesign icons available at: https://github.com/Templarian/MaterialDesign -->
<div align='center'>
  <img align='center' height='200px' alt='Logo' src='https://raw.githubusercontent.com/greatsquare0/thy-weaver/main/logo.svg'>
</div>

<h1 align='center'>create-weaver</h1>

<p align='center'>
  A starter template for a modern Twine development workflow
</p>


## Getting started

You may use npm, pnpm or bun package manager, examples uses pnpm:

```bash
pnpm create weaver@latest
```

You will be prompted with some configuration (If you want Tailwind for example), after this setup, start developing!


```bash
cd <your-project-path>

pnpm install
pnpm weaver setup
pnpm weaver dev
```

### Skipping the prompts

Every choice can also be passed as an argument, anything given this way isn't asked. When there is no terminal (CI, a devcontainer, a piped script) or with `--yes`, nothing is asked and the defaults fill in the rest:

```bash
pnpm create weaver@latest my-game --template sugarcube --addons typescript,tailwind
```

| Option                     | Description                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| `[project-dir]`            | Folder to create the project in (default: `thyweaver-project`)                              |
| `-t, --template <format>`  | Story format: `sugarcube`, `sugarcube-2` or pinned with `sugarcube-2@2.37.3`                 |
| `-a, --addons <list>`      | Comma separated: `typescript`, `tailwind`, `linting`, or `none` (default)                    |
| `--package-name <name>`    | Name for `package.json` (default: from the folder name)                                      |
| `--overwrite`              | Remove the existing files of a non empty `project-dir`                                       |
| `--ignore-existing`        | Keep the existing files of a non empty `project-dir`, template files replace same name files |
| `-y, --yes`                | Never prompt                                                                                 |
| `--interactive`            | Always prompt, even without a detected terminal                                              |
| `-h, --help`               | Show all options                                                                             |

Without a terminal, a non empty `project-dir` is an error unless `--overwrite` or `--ignore-existing` is given. For example, to scaffold into a devcontainer's workspace that already holds `.devcontainer/`:

```bash
npm create weaver@latest -- . --template sugarcube --addons none --ignore-existing --yes
```

For more information check-out the [docs](https://greatsquare0.github.io/thy-weaver/)

## License

MIT

## Disclaimer

This project is not affiliated or endorsed by Twine or The Interactive Fiction Technology Foundation

---

Based on [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite) and [create-vue](https://github.com/vuejs/create-vue/)
