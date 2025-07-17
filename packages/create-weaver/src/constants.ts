import picocolors from "picocolors";
import type { Formatter } from "picocolors/types.js";

interface StoryformatVersion {
  id: string;
  version: string;
  display: string;
  color: Formatter;
}

interface Storyformat {
  id: string;
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
        version: "2.37.3",
        color: picocolors.magenta,
      },
    ],
  },
  {
    id: "chapbook",
    display: "Chapbook",
    color: picocolors.yellow,
    version: [
      {
        id: "chapbook-2",
        display: "Chapbook 2",
        version: "2.2.0",
        color: picocolors.yellow,
      },
    ],
  },
  {
    id: "harlowe",
    display: "Harlowe",
    color: picocolors.red,
    version: [
      {
        id: "harlowe-3",
        display: "Harlowe 3",
        version: "3.3.9",
        color: picocolors.red,
      },
      {
        id: "harlowe-4-unstable",
        display: "Harlowe 4 Unstable",
        version: "4.0.0",
        color: picocolors.redBright,
      },
    ],
  },
  {
    id: "custom",
    color: picocolors.gray,
    display: "Custom/define later",
  },
]);

interface ADDON {
  id: string;
  display: string;
  color: Formatter;
  tooltip?: string;
  require?: string[];
}

export const ADDONS: Readonly<ADDON[]> = Object.freeze([
  {
    id: "tailwind",
    display: "TailwindCSS",
    color: picocolors.blueBright,
    tooltip: `Requires "linting"`,
    require: ["linting"],
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
