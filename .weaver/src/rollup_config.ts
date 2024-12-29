import postcss from 'rollup-plugin-postcss'
import type { RollupOptions, WarningHandlerWithDefault } from 'rollup'
import swc from '@rollup/plugin-swc'
import resolve from '@rollup/plugin-node-resolve'
import pico from 'picocolors'

import postcssConfig from './postcss_config.js'
import swcOptions from './swc_config.js'
import {
  handleVendorFiles,
  smartCopy,
  type CopyOptions,
} from './rollup_plugins.js'
import { loadConfig } from './handle_config.js'

const mode = process.env.NODE_ENV || 'development'

const config = await loadConfig()

const projectRoot = config.builder!.prebuilding!.project_root
const prebuildDir = config.builder!.prebuilding!.prebuilding_dir

const copyOptions: CopyOptions = {
  targets: [
    {
      src: `${projectRoot}/${config.builder!.prebuilding!.media.input_dir}/`,
      dest: `${prebuildDir}/${config.builder!.prebuilding!.media.output_dir}`,
    },
    {
      src: `${projectRoot}/${config.builder!.prebuilding!.fonts.input_dir}/`,
      dest: `${prebuildDir}/${config.builder!.prebuilding!.fonts.output_dir!}`,
    },
  ],
}

const onwarn: WarningHandlerWithDefault = (warning, log) => {
  //Silence circular dependency warning
  if (warning.code === 'CIRCULAR_DEPENDENCY') {
    return undefined
  }
  log(
    `\n\n${pico.inverse(pico.bold(' ROLLUP '))} ${pico.bgYellow(
      pico.bold(' WARN ')
    )} ${warning.message} \n`
  )
}

export const rollupConfig: RollupOptions = {
  onwarn,
  input: `${projectRoot}/${config.builder!.prebuilding!.app.input_file}`,
  output: {
    format: 'esm',
    file: `${prebuildDir}/${config.builder!.prebuilding!.app.output_file}`,
    sourcemap: mode === 'development',
  },
  perf: true,
  plugins: [
    resolve({
      extensions: ['.ts', '.js'],
      browser: true,
    }),
    handleVendorFiles(),
    // Extract CSS and apply PostCSS transformations
    postcss({
      plugins: postcssConfig.options.postcssOptions.plugins,
      extract: config.builder!.prebuilding!.styles.output_file,
      sourceMap: mode === 'development',
      modules: false,
      autoModules: false,
      //@ts-expect-error
      use: {
        sass: {
          silenceDeprecations: ['legacy-js-api'],
        },
      },
    }),
    smartCopy(copyOptions),

    // Use SWC for transpiling TypeScript
    swc({
      swc: swcOptions,
    }),
  ],
}
