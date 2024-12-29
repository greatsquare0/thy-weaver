import { pathToFileURL } from 'node:url'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { cwd } from 'node:process'

interface AdditionalAsset {
  /**
   * Can be a file or dir
   */
  input: string
  /**
   * If input is a dir, the output needs to be one too, and vice versa
   */
  output: string
}

interface BuilderOptions {
  /**
   * To not overload the builder, a delay is needed for the next rebuilding
   * @default 1000
   */
  watcherDelay: number
  /**
   * To speed up developing, instead of copying the assets to `/dist`, thy-weaver can create an FS link to the file instead
   *
   * **Experimental, highly depended on OS and runtime**
   *
   *|      | Win | Linux | MacOS |
   *|-----:|:---:|:-----:|:-----:|
   *| Node |  ✓  |   ~   |   ~   |
   *|  Bun |  ✕  |   ~   |   ~   |
   *| Deno |  ~  |   ~   |   ~   |
   *    ~ = Untested
   *
   * @default false
   */
  enableFSLinkCopyOnDevMode?: boolean
  /**
   * See https://browsersl.ist/ for valid targets, doesn't affect SugarCube pre-existing code
   * @default 'defaults'
   */
  compilation_target: string
  additionalAssets?: AdditionalAsset[]
  prebuilding?: {
    project_root: string
    /**
     * Files that contain code (JS and CSS) are pre bundled and keep on the prebuild folder temporarily
     * The builder will watch for files changes in this dir and rebuild the story
     */
    prebuilding_dir: string
    app: {
      input_file: string
      output_file: string
    }
    /**
     * Styles are automatically extracted when imported on the index.ts
     */
    styles: {
      output_file: string
    }
    vendor_files: {
      input_dir: string
      output_js_file: string
      output_css_file: string
    }
    media: {
      input_dir: string
      output_dir: string
    }
    fonts: {
      input_dir: string
      output_dir: string
    }
  }
  dist?: {
    output_dir: string
    story: {
      input_dir: string
      html_head: string
      output_file: string
    }
    scripts: {
      input_dir: string
      output_dir: string
    }
    styles: {
      input_dir: string
      output_dir: string
    }
    media: {
      input_dir: string
      output_dir: string
    }
    fonts: {
      input_dir: string
      output_dir: string
    }
  }
}

interface DevServerOptions {
  hostname: string
  port: number
  /**
   * Enables Twine debug/test mode, some formats offer testing tools when enabled
   */
  twine_debug: boolean
}

export interface ThyWeaverConfig {
  dev_server?: DevServerOptions
  builder?: BuilderOptions
}

let cache: ThyWeaverConfig

export const loadConfig = async (
  customPath?: string
): Promise<ThyWeaverConfig> => {
  if (cache) {
    return cache
  }
  let configPath = ''

  if (customPath) {
    configPath = resolve(cwd(), customPath)
    console.log(configPath)
  } else {
    const tsPath = resolve(cwd(), '..', 'thyweaver.config.js')
    const jsPath = resolve(cwd(), '..', 'thyweaver.config.ts')

    if (existsSync(jsPath)) {
      configPath = jsPath
    } else if (existsSync(tsPath)) {
      configPath = tsPath
    }
  }

  if (!existsSync(configPath)) {
    return defaultConfig as ThyWeaverConfig
  }

  if (process.platform === 'win32') {
    configPath = pathToFileURL(configPath).href
  }

  const imported = await import(configPath)
  const config = imported.default
  cache = config
  return config
}

export const defaultConfig: Partial<ThyWeaverConfig> = {
  builder: {
    watcherDelay: 1000,
    compilation_target: 'defaults',
    prebuilding: {
      project_root: '../src',
      prebuilding_dir: './.prebuilt',
      app: {
        input_file: 'assets/app/index.ts',
        output_file: 'scripts/app.bundle.js',
      },
      styles: {
        output_file: 'styles/app.bundle.css',
      },
      vendor_files: {
        input_dir: 'assets/vendor/',
        output_js_file: 'scripts/vendor.bundle.js',
        output_css_file: 'scripts/styles/vendor.bundle.css',
      },
      media: {
        input_dir: 'assets/media',
        output_dir: 'media/',
      },
      fonts: {
        input_dir: 'assets/fonts/',
        output_dir: 'fonts/',
      },
    },
    dist: {
      output_dir: '../dist',
      story: {
        input_dir: '../src/story/',
        html_head: '../src/head_content.html',
        output_file: 'index.html',
      },
      scripts: {
        input_dir: 'scripts/',
        output_dir: 'scripts/',
      },
      styles: {
        input_dir: 'scripts/styles/',
        output_dir: 'styles/',
      },
      media: {
        input_dir: 'media/',
        output_dir: 'media/',
      },
      fonts: {
        input_dir: 'fonts/',
        output_dir: 'fonts/',
      },
    },
  },
}

/**
 * Defines configs for use in ThyWeaver
 * @param config {ThyWeaverConfig}
 */
export function defineConfig<T extends ThyWeaverConfig>(config: T): T {
  return { ...defaultConfig, ...config }
}
