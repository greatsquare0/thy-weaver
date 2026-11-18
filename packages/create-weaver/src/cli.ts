import { parseArgs as nodeParseArgs } from "node:util";
import {
  ADDONS,
  STORYFORMATS,
  type Addon,
  type StoryformatVersion,
} from "./constants.ts";
import { formatTargetDir, isValidPackageName } from "./utils.ts";

export class CliError extends Error {}

export type ExistingDirAction = "remove" | "ignore";

export interface CliOptions {
  help: boolean;
  version: boolean;
  /**
   * `undefined` means "decide from the terminal" (prompt only on a TTY)
   */
  interactive?: boolean;
  targetDir?: string;
  packageName?: string;
  storyFormatVersion?: StoryformatVersion;
  addons?: Addon[];
  existing?: ExistingDirAction;
}

export const helpMessage = `\
Usage: create-weaver [project-dir] [options]

Scaffolds a new ThyWeaver project. Anything not given as an option is asked
interactively, or falls back to its default when there is no terminal (CI,
containers) or when --yes is passed.

Options:
  -t, --template <format>   Story format: ${listFormats()}
                            (default: ${defaultFormat().id})
  -a, --addons <list>       Comma separated addons, or "none": ${ADDONS.map((a) => a.id).join(", ")}
                            (default: none)
      --package-name <name> Name for package.json (default: from the folder name)
      --overwrite           Remove existing files in a non empty project-dir
      --ignore-existing     Keep existing files in a non empty project-dir,
                            template files replace the ones with the same name
  -y, --yes                 Never prompt, use defaults for anything not given
      --interactive         Always prompt for anything not given
  -h, --help                Show this message
  -v, --version             Show the version

Examples:
  create-weaver
  create-weaver my-game --template sugarcube --addons typescript,tailwind
  create-weaver . -t sugarcube-2@2.37.3 -a none --ignore-existing --yes
`;

function defaultFormat() {
  return STORYFORMATS[0].version![0];
}

function listFormats() {
  return STORYFORMATS.flatMap((format) => [
    format.id,
    ...(format.version ?? []).map((entry) => `${entry.id}@${entry.version}`),
  ]).join(", ");
}

export const defaults = {
  targetDir: "thyweaver-project",
  get storyFormatVersion() {
    return defaultFormat();
  },
  addons: [] as Addon[],
};

/**
 * Accepts a format (`sugarcube`), a format version id (`sugarcube-2`),
 * optionally pinned to a version with `@` (`sugarcube@2.37.3`, `sugarcube-2@2.37.3`)
 */
export const resolveTemplate = (value: string): StoryformatVersion => {
  const [id, version] = value.trim().toLowerCase().split("@");

  const candidates = STORYFORMATS.flatMap((format) =>
    (format.version ?? []).filter(
      (entry) => format.id === id || entry.id === id,
    ),
  ).filter((entry) => !version || entry.version === version);

  if (candidates.length === 0) {
    throw new CliError(
      `Unknown template "${value}". Available: ${listFormats()}`,
    );
  }

  // Without a pinned version the first listed (newest) one wins
  return candidates[0];
};

export const resolveAddonList = (values: string[]): Addon[] => {
  const ids = values
    .flatMap((value) => value.split(","))
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);

  if (ids.length === 1 && ids[0] === "none") return [];

  const unknown = ids.filter((id) => !ADDONS.some((addon) => addon.id === id));
  if (unknown.length > 0) {
    throw new CliError(
      `Unknown addon${unknown.length > 1 ? "s" : ""} "${unknown.join('", "')}". ` +
        `Available: ${ADDONS.map((addon) => addon.id).join(", ")}, none`,
    );
  }

  // Keep the declaration order so the result doesn't depend on how it was typed
  return ADDONS.filter((addon) => ids.includes(addon.id));
};

const parseArgv = (args: string[]) => {
  try {
    return nodeParseArgs({
      args,
      strict: true,
      allowPositionals: true,
      allowNegative: true,
      options: {
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "v", default: false },
        template: { type: "string", short: "t", multiple: true },
        addons: { type: "string", short: "a", multiple: true },
        "package-name": { type: "string", multiple: true },
        overwrite: { type: "boolean", default: false },
        "ignore-existing": { type: "boolean", default: false },
        yes: { type: "boolean", short: "y", default: false },
        interactive: { type: "boolean" },
      },
    });
  } catch (error) {
    throw new CliError((error as Error).message, { cause: error });
  }
};

/**
 * Repeated single value options: the last one wins, like most CLIs
 */
const last = (values: string[] | undefined, flag: string) => {
  const value = values?.at(-1)?.trim();
  if (value === "") throw new CliError(`Option --${flag} needs a value`);
  return value;
};

export const parseArgs = (args: string[]): CliOptions => {
  const { values, positionals } = parseArgv(args);

  if (positionals.length > 1) {
    throw new CliError(
      `Expected a single project-dir, got: ${positionals.join(" ")}`,
    );
  }

  if (values.overwrite && values["ignore-existing"]) {
    throw new CliError("Use either --overwrite or --ignore-existing, not both");
  }

  if (values.yes && values.interactive === true) {
    throw new CliError("Use either --yes or --interactive, not both");
  }

  const options: CliOptions = {
    help: values.help,
    version: values.version,
    interactive: values.yes ? false : values.interactive,
  };

  if (positionals[0] !== undefined) {
    const targetDir = formatTargetDir(positionals[0]);
    if (!targetDir) throw new CliError("Invalid project-dir");
    options.targetDir = targetDir;
  }

  const packageName = last(values["package-name"], "package-name");
  if (packageName !== undefined) {
    if (!isValidPackageName(packageName)) {
      throw new CliError(`Invalid package.json name "${packageName}"`);
    }
    options.packageName = packageName;
  }

  const template = last(values.template, "template");
  if (template !== undefined) {
    options.storyFormatVersion = resolveTemplate(template);
  }

  if (values.addons !== undefined) {
    if (values.addons.some((value) => value.trim() === "")) {
      throw new CliError(
        `Option --addons needs a value (use "none" for no addons)`,
      );
    }
    options.addons = resolveAddonList(values.addons);
  }

  if (values.overwrite) options.existing = "remove";
  if (values["ignore-existing"]) options.existing = "ignore";

  return options;
};
