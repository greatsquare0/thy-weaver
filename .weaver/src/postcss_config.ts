//@ts-ignore
import postcssLightningcss from 'postcss-lightningcss'
import tailwindcss from 'tailwindcss'
//@ts-ignore
import postcssImport from 'postcss-import'
import { resolve } from 'node:path'

import { loadConfig } from './handle_config.js'
const config = await loadConfig()

const mode = process.env.NODE_ENV || 'development'

const postcssConfig = {
  options: {
    postcssOptions: {
      plugins: [
        postcssImport(),
        tailwindcss('../tailwind.config.ts'),
        postcssLightningcss({
          //@ts-ignore
          browsers: config.builder!.compilation_target,
          lightningcssOptions: {
            minify: mode === 'production',
            cssModules: false,
          },
        }),
      ],
    },
  },
}

export default postcssConfig