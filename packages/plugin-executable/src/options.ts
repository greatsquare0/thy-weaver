export const NEUTRALINO_TARGETS = [
  "win_x64",
  "linux_x64",
  "linux_arm64",
  "linux_armhf",
  "mac_x64",
  "mac_arm64",
  "mac_universal",
] as const;

export type NeutralinoTarget = (typeof NEUTRALINO_TARGETS)[number];

export const DEFAULT_NEUTRALINO_VERSION = "6.10.0";

export interface PluginExecutableOptions {
  /**
   * Unique app id, also names the save folder inside the user data directory
   * @default `dev.thyweaver.<package name>`
   */
  applicationId?: string;
  /**
   * @default package.json name
   */
  windowTitle?: string;
  window?: {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    resizable?: boolean;
    fullScreen?: boolean;
    /**
     * Path to a .png icon, relative to the project root
     */
    icon?: string;
  };
  /**
   * Platforms to package, "all" for every platform Neutralino supports
   * @default the current platform
   */
  targets?: NeutralinoTarget[] | "all";
  /**
   * Output directory, relative to the project root
   * @default "dist-app"
   */
  outDir?: string;
  /**
   * Port of the internal server, 0 picks a random free port on each launch.
   * With save sync disabled, a random port loses saves between launches.
   * @default 0
   */
  port?: number;
  saves?: {
    /**
     * Mirror the game's localStorage to a file in the user data directory
     * @default true
     */
    sync?: boolean;
    /**
     * @default "saves.json"
     */
    fileName?: string;
  };
  /**
   * Allow opening the dev tools inside the app
   * @default false
   */
  enableInspector?: boolean;
  /**
   * Neutralinojs release used for the binaries and client library
   * @default "6.10.0"
   */
  neutralinoVersion?: string;
}

export const currentPlatformTarget = (): NeutralinoTarget => {
  switch (process.platform) {
    case "win32":
      return "win_x64";
    case "darwin":
      return "mac_universal";
    default:
      if (process.arch === "arm64") return "linux_arm64";
      if (process.arch === "arm") return "linux_armhf";
      return "linux_x64";
  }
};

export const resolveTargets = (
  targets: PluginExecutableOptions["targets"],
): NeutralinoTarget[] => {
  if (targets === "all") return [...NEUTRALINO_TARGETS];
  if (!targets || targets.length === 0) return [currentPlatformTarget()];

  for (const target of targets) {
    if (!NEUTRALINO_TARGETS.includes(target)) {
      throw new Error(
        `Unknown target "${target}", expected one of: ${NEUTRALINO_TARGETS.join(", ")}`,
      );
    }
  }

  return [...new Set(targets)];
};
