import { copy, move, remove } from 'fs-extra/esm'
import { setupTweego } from 'tweenode'
import { rollup } from 'rollup'
import pico from 'picocolors'
import ora from 'ora'

import { loadConfig } from './handle_config.ts'
import { rollupConfig } from './rollup_config.ts'

const config = await loadConfig()
const mode = process.env.NODE_ENV || 'development'

export const getSpinner = () => {
  return ora({
    prefixText: pico.bgBlue(pico.bold(' BUILDER ')),
  })
}

export const handleTweegoSetup = async () => {
  const spinner = getSpinner()
  spinner.start('Setting-up Tweego')
  try {
    await setupTweego()
    spinner.succeed('Tweego installed')
  } catch (error) {
    spinner.fail(
      ` ${pico.bgRed(pico.bold(' ERROR '))} Failed to setup Tweego:\n${error}\n`
    )
  }
}

export const runRollup = async () => {
  const spinner = getSpinner()
  spinner.start('Running Rollup...')
  await remove(config.builder!.prebuilding!.prebuilding_dir)
  const rl = await rollup(rollupConfig)

  await rl.write({
    format: 'esm',
    file: `${config.builder!.prebuilding!.prebuilding_dir}/${
      config.builder!.prebuilding!.app.output_file
    }`,
    sourcemap: mode === 'development',
  })

  const duration = Math.round(rl.getTimings!()['# BUILD'][0])
  spinner.succeed(`Rollup finished in ${pico.yellow(`${duration}ms`)}`)
  return { rollupObj: rl, duration: duration }
}

export const moveFiles = async () => {
  const spinner = getSpinner()
  const prebuildConfig = config.builder!.prebuilding!
  const distConfig = config.builder!.dist!

  try {
    spinner.start('Cleaning up ./dist...')

    await remove(distConfig.output_dir)
    spinner.succeed('./dist clean')
  } catch (error) {
    spinner.fail(
      ` ${pico.bgRed(pico.bold(' ERROR '))} Failed cleanup dist:\n${error}\n`
    )
  }

  try {
    const duration = Date.now()
    spinner.start('Moving media files...')

    await move(
      `${prebuildConfig.prebuilding_dir}/${distConfig.media.input_dir}`,
      `${distConfig.output_dir}/${distConfig.media.output_dir}`
    )
    spinner.succeed(
      `Media files moved in ${pico.yellow(`${Date.now() - duration}ms`)}`
    )
  } catch (error) {
    spinner.fail(
      ` ${pico.bgRed(
        pico.bold(' ERROR ')
      )} Failed to move media files:\n${error}\n`
    )
  }
  try {
    const duration = Date.now()
    spinner.start('Moving font files...')

    await move(
      `${prebuildConfig.prebuilding_dir}/${distConfig.fonts.input_dir}`,
      `${distConfig.output_dir}/${distConfig.fonts.output_dir}`
    )
    spinner.succeed(
      `Font files moved in ${pico.yellow(`${Date.now() - duration}ms`)}`
    )
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      spinner.fail(
        ` ${pico.bgRed(
          pico.bold(' ERROR ')
        )} Failed to move font files:\n${error}\n`
      )
    }
  }

  try {
    spinner.start('Moving stylesheets...')

    await move(
      `${prebuildConfig.prebuilding_dir}/${distConfig.styles.input_dir}`,
      `${distConfig.output_dir}/${distConfig.styles.output_dir}`
    )
    spinner.succeed('Stylesheets moved')
  } catch (error) {
    spinner.fail(
      ` ${pico.bgRed(
        pico.bold(' ERROR ')
      )} Failed to move stylesheets:\n${error}\n`
    )
  }

  try {
    spinner.start('Moving scripts...')

    await move(
      `${prebuildConfig.prebuilding_dir}/${distConfig.scripts.input_dir}`,
      `${distConfig.output_dir}/${distConfig.scripts.output_dir}`
    )
    spinner.succeed('Scripts moved')
  } catch (error) {
    spinner.fail(
      ` ${pico.bgRed(pico.bold(' ERROR '))} Failed to move scripts:\n${error}\n`
    )
  }

  if (config.builder!.additionalAssets!.length > 0) {
    const duration = Date.now()
    spinner.start('Copying additional assets...')

    for await (const asset of config.builder!.additionalAssets!) {
      try {
        spinner.text = `Copying ${asset.input}`

        await copy(asset.input, asset.output, { overwrite: true })
      } catch (error) {
        spinner.fail(
          ` ${pico.bgRed(
            pico.bold(' ERROR ')
          )} Failed to copy assets:\n${error}\n`
        )
        return
      }
    }
    spinner.succeed(
      `Additional assets copied in ${pico.yellow(`${Date.now() - duration}ms`)}`
    )
  }
}
