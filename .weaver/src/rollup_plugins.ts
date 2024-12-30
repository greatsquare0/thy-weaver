import fastGlob from 'fast-glob'
const { glob } = fastGlob

import swc from '@swc/core'
import postcss from 'postcss'
import { type Plugin } from 'rollup'
import { createLink, createSymlink, outputFile, copy } from 'fs-extra/esm'
import { statSync } from 'node:fs'

import { concat, getRuntime } from './build_helpers.ts'
import swcOptions from './swc_config.ts'
import { loadConfig } from './handle_config.ts'
import postcssConfig from './postcss_config.ts'

const config = await loadConfig()
const mode = process.env.NODE_ENV || 'development'

const projectRoot = config.builder!.prebuilding!.project_root
const prebuildDir = config.builder!.prebuilding!.prebuilding_dir

export const handleVendorFiles = async () => {
  return {
    name: 'handle-vendor-files',
    async buildStart() {
      const vendorScripts = await glob(
        `${projectRoot}/${
          config.builder!.prebuilding!.vendor_files.input_dir
        }/**/*.{js,ts}`
      )
      const rawScripts = (await concat(vendorScripts)) as string

      swc
        .transform(rawScripts, {
          sourceMaps: mode === 'development',
          ...swcOptions,
        })
        .then(async output => {
          await outputFile(
            `${prebuildDir}/${
              config.builder!.prebuilding!.vendor_files.output_js_file
            }`,
            output.code
          )

          if (output.map) {
            await outputFile(
              `${prebuildDir}/${
                config.builder!.prebuilding!.vendor_files.output_js_file
              }.map`,
              output.map
            )
          }
        })

      const vendorStyles = await glob(
        `${projectRoot}/${
          config.builder!.prebuilding!.vendor_files.input_dir
        }/**/*.css`
      )
      const rawStyles = (await concat(vendorStyles)) as string

      postcss(postcssConfig.options.postcssOptions.plugins)
        .process(rawStyles, { from: undefined })
        .then(async result => {
          await outputFile(
            `${prebuildDir}/${
              config.builder!.prebuilding!.vendor_files.output_css_file
            }`,
            result.css
          )

          if (result.map) {
            await outputFile(
              `${prebuildDir}/${
                config.builder!.prebuilding!.vendor_files.output_css_file
              }.map`,
              result.map.toString()
            )
          }
        })
    },
  } as Plugin
}

interface Target {
  src: string
  dest: string
}

export interface CopyOptions {
  targets: Target[]
}

export const smartCopy = async (copyOptions: CopyOptions) => {
  return {
    name: 'smart-copy',
    async buildStart() {
      for await (const entry of copyOptions.targets) {
        if (
          mode == 'development' &&
          config.builder?.enableFSLinkCopyOnDevMode
        ) {
          try {
            await createLink(entry.src, entry.dest)
          } catch (error) {
            try {
              createSymlink(
                entry.src,
                entry.dest,
                statSync(entry.src).isDirectory() ? 'junction' : undefined
              )
            } catch (error) {
              this.warn({
                pluginCode: 'SMART_COPY_SYSLINK_ERROR',
                message: `Failed to create fs link: ${entry.src} <-> ${entry.dest}\n${error}\nUsing copy as fallback`,
                cause: error,
              })
              await copy(entry.src, entry.dest, { overwrite: true })
            }
          }
        } else {
          await copy(entry.src, entry.dest, { overwrite: true })
        }
      }
    },
  } as Plugin
}
