import picocolors from "picocolors";
import type { Formatter } from "picocolors/types.js";

export interface StoryformatVersion {
  /**
   * Also the folder name in `template/formats/`
   */
  id: string;
  version: string;
  display: string;
  /**
   * Name Twine knows the format by, written to StoryData
   */
  name: string;
  color: Formatter;
}

export type STORYFORMATS_ID = "sugarcube" | "chapbook" | "harlowe" | "custom";

export interface Storyformat {
  id: STORYFORMATS_ID;
  display: string;
  color: Formatter;
  version?: StoryformatVersion[];
}

export const STORYFORMATS: Readonly<Storyformat[]> = Object.freeze([
  {
    id: "sugarcube",
    display: "Sugarcube",
    color: picocolors.magenta,
    version: [
      {
        id: "sugarcube-2",
        display: "Sugarcube 2",
        name: "SugarCube",
        version: "2.37.3",
        color: picocolors.magenta,
      },
    ],
  },
  // {
  //   id: "chapbook",
  //   display: "Chapbook",
  //   color: picocolors.yellow,
  //   version: [
  //     {
  //       id: "chapbook-2",
  //       display: "Chapbook 2",
  //       name: "Chapbook",
  //       version: "2.2.0",
  //       color: picocolors.yellow,
  //     },
  //   ],
  // },
  // {
  //   id: "harlowe",
  //   display: "Harlowe",
  //   color: picocolors.red,
  //   version: [
  //     {
  //       id: "harlowe-3",
  //       display: "Harlowe 3",
  //       name: "Harlowe",
  //       version: "3.3.9",
  //       color: picocolors.red,
  //     },
  //     {
  //       id: "harlowe-4-unstable",
  //       display: "Harlowe 4 Unstable",
  //       name: "Harlowe",
  //       version: "4.0.0",
  //       color: picocolors.redBright,
  //     },
  //   ],
  // },
  // {
  //   id: "custom",
  //   color: picocolors.gray,
  //   display: "Custom/define later",
  // },
]);

export type ADDON_ID = "tailwind" | "typescript" | "linting";

export interface Addon {
  id: ADDON_ID;
  display: string;
  color: Formatter;
  tooltip?: string;
  /**
   * Addons that get added (and applied first) when this one is selected
   */
  require?: ADDON_ID[];
  /**
   * PostCSS plugin registered in the generated `thyweaver.config`
   */
  postcssPlugin?: { name: string; from: string };
}

export const ADDONS: Readonly<Addon[]> = Object.freeze([
  {
    id: "tailwind",
    display: "TailwindCSS",
    color: picocolors.blueBright,
    tooltip: `Requires "linting"`,
    require: ["linting"],
    postcssPlugin: { name: "tailwind", from: "@tailwindcss/postcss" },
  },
  {
    id: "typescript",
    color: picocolors.cyan,
    display: "TypeScript",
  },
  {
    id: "linting",
    color: picocolors.magenta,
    display: "Linting (Prettier and Oxlint)",
  },
]);
