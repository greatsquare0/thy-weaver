import type { TailwindConfig } from '@thy-weaver/builder/helpers'

//@ts-ignore
const path = process!.env.WORKSPACE_ROOT_RELATIVE as string

export default {
  content: [
    `${path}/src/story/**/*.{twee, tw}`,
    `${path}/src/assets/app/**/*.ts`,
    `${path}/src/assets/app/styles/**/*.{scss, sass}`,
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies TailwindConfig
