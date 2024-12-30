import { spawn } from 'node:child_process'
import { Command } from 'commander'
import { readJsonSync } from 'fs-extra/esm'

//const pkg = readJsonSync('./.weaver/package.json')

const program = new Command()

program.name('weaver').description('A CLI for ThyWeaver projects')
//.version(pkg.version)

program
  .command('dev')
  .description('Build, watch files for changes and starts a dev server')
  .option('-p, --useProduction', 'Run the server in production mode', false)
  .option('-b, --useBun', 'Use Bun instead of Node', false)
  .action(async options => {
    spawnBuilder('dev', options)

    process.on('close', code => {
      if (code === 0) {
        console.log('Process ended')
      } else {
        console.error(`Process failed with code ${code}`)
      }
    })
  })

program
  .command('build')
  .description('Build and output to dist')
  .option('-d, --useDevelopment', 'Build in development mode', false)
  .option('-b, --useBun', 'Use Bun instead of Node', false)
  .option(
    '-z, --zip',
    'Pack the game in to a .zip (By default the name of the zip will be the package name and version on package.json)',
    false
  )
  .action(async options => {
    spawnBuilder('build', options)

    process.on('close', code => {
      if (code === 0) {
        console.log('Process ended')
      } else {
        console.error(`Process failed with code ${code}`)
      }
    })
  })

interface CliOptions {
  useBun?: boolean
  useProduction?: boolean
  useDevelopment?: boolean
  zip?: boolean
}

const spawnBuilder = (mode: 'dev' | 'build', cliOptions: CliOptions) => {
  const env = () => {
    if (mode === 'build') {
      return cliOptions.useDevelopment ? 'development' : 'production'
    } else {
      cliOptions.useProduction ? 'production' : 'development'
    }
  }

  const child = spawn('pnpm', [`${!cliOptions.useBun ? 'node:' : ''}${mode}`], {
    stdio: 'inherit',
    cwd: './@weaver/builder',
    env: {
      PATH: process.env.PATH,
      NODE_ENV: env(),
      BUILD_TYPE: cliOptions.zip ? 'zip' : undefined,
    },
  })

  return new Promise(resolve => {
    process.on('exit', () => {
      if (!child.killed) {
        child.kill()
      }

      resolve
    })
  })
}

program.parse()
