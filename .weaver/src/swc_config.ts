import { type Options } from '@swc/core'

import { loadConfig } from './handle_config.ts'
const mode = process.env.NODE_ENV || 'development'

const config = await loadConfig()

const swcOptions: Options = {
  jsc: {
    parser: {
      syntax: 'typescript',
    },
    minify:
      mode === 'production'
        ? {
            mangle: false,
            format: {
              comments: 'all',
            },
            compress: {
              defaults: true,
              evaluate: true,
              inline: 3,
            },
          }
        : undefined,
  },
  env: {
    targets: config.builder!.compilation_target,
  },
}

export default swcOptions
