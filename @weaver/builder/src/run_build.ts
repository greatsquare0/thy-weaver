import { Tweenode } from 'tweenode'
import pico from 'picocolors'

import { loadConfig } from './handle_config.ts'
import {
  getSpinner,
  handleTweegoSetup,
  moveFiles,
  runRollup,
} from './build_commands.ts'
import { runZipper } from './run_zipper.ts'

const mode = process.env.NODE_ENV || 'development'
const config = await loadConfig()

console.log(
  pico.bgMagenta(pico.bold(' ThyWeaver Builder ')),
  pico.green(pico.bold(' Running in build to dist mode ')),
  pico.gray(`[env: ${mode}]`),
  '\n'
)

await handleTweegoSetup()
const tweego = new Tweenode({
  writeToLog: true,
})

const runTweego = async () => {
  const distPath = config.builder!.dist!.output_dir

  const spinner = getSpinner()
  const duration = Date.now()

  spinner.start('Compiling story')

  try {
    await tweego.process({
      input: {
        storyDir: config.builder!.dist!.story.input_dir,
        htmlHead: config.builder!.dist!.story.html_head,
        styles: `${distPath}/${config.builder!.dist!.styles.output_dir}`,
        scripts: `${distPath}/${config.builder!.dist!.scripts.output_dir}`,
        modules: ['../../dist/fonts/'],
      },
      output: {
        mode: 'file',
        fileName: `${distPath}/${config.builder!.dist!.story.output_file}`,
      },
    })
    spinner.succeed(
      `Story compiled in ${pico.yellow(`${Date.now() - duration}ms`)}`
    )
  } catch (error) {
    spinner.fail(
      ` ${pico.bgRed(pico.bold(' ERROR '))} Failed build story:\n${error}\n`
    )
  }
}

const build = async (): Promise<null> => {
  const duration = Date.now()
  await runRollup()
  await moveFiles()
  await runTweego()

  return new Promise(resolve => {
    console.log(
      `\n${pico.bgGreen(
        pico.bold(` Build finished in ${Date.now() - duration}ms `)
      )}ㅤ\n`
    )
    resolve(null)
  })
}

await build()

if (process.env.BUILD_TYPE === 'zip') {
  await runZipper()
}
