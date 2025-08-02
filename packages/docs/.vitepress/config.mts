import { defineConfig } from "vitepress";
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from "vitepress-plugin-group-icons";
// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "ThyWeaver",
  description: "A toolkit for making Twine games",
  srcDir: "src/",
  outDir: "dist/",
  assetsDir: "static",
  base: "/thy-weaver/",
  markdown: {
    config(md) {
      md.use(groupIconMdPlugin);
    },
  },

  vite: {
    plugins: [groupIconVitePlugin()],
  },
  // https://vitepress.dev/reference/default-theme-config
  head: [["link", { rel: "icon", href: "/thy-weaver/favicon.svg" }]],
  themeConfig: {
    search: {
      provider: "local",
    },

    footer: {
      message:
        "Release under MIT license. \n This project is not affiliated or endorsed by Twine or The Interactive Fiction Technology Foundation",
    },

    logo: { dark: "/logo_dark.svg", light: "/logo.svg" },
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Reference", link: "/reference/cli" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "Why?", link: "/guide/index" },
            { text: "Getting Started", link: "/guide/getting-started" },
          ],
        },
        {
          text: "Guide",
          items: [
            { text: "Using Typescript", link: "/guide/using-typescript" },
            { text: "Manual Migration", link: "/guide/manual-migration" },
            { text: "Using TailwindCSS", link: "/guide/using-tailwind" },
            { text: "Importing Raw Files", link: "/guide/import-raw" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "Reference",
          items: [
            { text: "CLI", link: "/reference/cli" },
            { text: "Config File", link: "/reference/config-file" },
            {
              text: "File Structure",
              link: "/reference/default-file-structure",
            },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
