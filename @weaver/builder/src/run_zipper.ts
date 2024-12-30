import AdmZip from 'adm-zip'
import ora from 'ora'
import { outputFile, readJsonSync } from 'fs-extra/esm'
import { resolve } from 'node:path'
import pico from 'picocolors'

import { loadConfig } from './handle_config.ts'
import { rm } from 'node:fs/promises'

const pkg = readJsonSync('../package.json')

const config = await loadConfig()
const spinner = ora({
  prefixText: pico.bgBlue(pico.bold(' PACKER ')),
})

const zip = new AdmZip()

export const runZipper = async () => {
  const duration = Date.now()
  const dist = resolve(process.cwd(), config!.builder!.dist!.output_dir)

  console.log(
    pico.bgMagenta(pico.bold(' ThyWeaver Packer ')),
    pico.green(pico.bold(' Packing to .zip ')),
    '\n'
  )

  spinner.start('Removing unnecessary files from /dist')

  try {
    await rm(`${dist}/scripts`, { recursive: true, force: true })
    await rm(`${dist}/styles`, { recursive: true, force: true })
    await rm(`${dist}/fonts`, { recursive: true, force: true })

    spinner.succeed('Unnecessary files removed')
  } catch (error) {
    spinner.fail(`Failed to cleanup /dist:\n${error}`)
  }

  spinner.start('Compacting files (This could take a while)')
  try {
    zip.addLocalFolder(dist)
    spinner.succeed('Files compacted')
  } catch (error) {
    spinner.fail(`Failed to compact files:\n${error}`)
  }

  spinner.start('Writing .zip to /dist')
  const zipName = config.builder?.package
    ? config.builder?.package.zip_custom_name
    : `${pkg.name}--v${pkg.version}`

  try {
    await outputFile(
      `${config!.builder!.dist!.output_dir}/${zipName}.zip`,
      await zip.toBufferPromise()
    )
    spinner.succeed('Zip created')
  } catch (error) {
    spinner.fail(`Failed to write .zip:\n${error}`)
  }

  console.log(
    `\n${pico.bgGreen(
      pico.bold(` Packer finished in ${Date.now() - duration}ms `)
    )}ㅤ\n`
  )
}
