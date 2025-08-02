import { defineConfig } from "vitepress";
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from "vitepress-plugin-group-icons";
// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Thy Weaver",
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
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: "/logo.svg",
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
            { text: "File Structure", link: "/reference/file-structure" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
