import { findUp, findUpSync } from 'find-up'
import { outputFile, type PathLike } from 'fs-extra/esm'
import { readFile, stat } from 'node:fs/promises'
import { dirname, relative } from 'node:path'
import process from 'node:process'

import type { Config } from 'tailwindcss'
export type TailwindConfig = Config

export const isFile = async (path: PathLike) => {
  return (await stat(path)).isFile()
}

/**
 * Based on the concat package by gko
 * @see https://github.com/gko/concat
 */
export const concat = async (files: PathLike[], outputFilePath?: PathLike) => {
  let code: string[] = []

  for await (const file of files) {
    if (await isFile(file)) {
      code.push(await readFile(file, { encoding: 'utf-8' }))
    } else {
      return
    }
  }

  const result = code.join('\n\n')

  if (outputFilePath) {
    outputFile(outputFilePath as string, result, { encoding: 'utf-8' })
  } else {
    return result
  }
}

export const getRuntime = () => {
  let runner: 'node' | 'bun' | 'deno' | 'unknown'
  //@ts-ignore
  if (typeof Deno !== 'undefined' && Deno.version) {
    runner = 'deno'
    //@ts-ignore
  } else if (typeof Bun !== 'undefined' && Bun.version) {
    runner = 'bun'
  } else if (
    typeof process !== 'undefined' &&
    process.versions &&
    process.versions.node
  ) {
    runner = 'node'
  } else {
    runner = 'unknown'
  }

  return runner
}

export const getWorkspaceRoot = async () => {
  const ref = await findUp('pnpm-workspace.yaml')

  if (ref) {
    const value = dirname(ref)
    return {
      value,
      relative() {
        return relative('./@weaver/builder/', value)
      },
    }
  }
}
export const getWorkspaceRootSync = () => {
  const ref = findUpSync('pnpm-workspace.yaml')

  if (ref) {
    const value = dirname(ref)
    return {
      value,
      relative() {
        return relative('./@weaver/builder/', value)
      },
    }
  }
}
