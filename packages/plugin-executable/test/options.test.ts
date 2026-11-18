import { afterEach, describe, expect, it } from "vitest";
import {
  currentPlatformTarget,
  NEUTRALINO_TARGETS,
  resolveTargets,
  type NeutralinoTarget,
} from "../src/options.ts";

const realPlatform = process.platform;
const realArch = process.arch;

const fakeHost = (platform: NodeJS.Platform, arch: NodeJS.Architecture) => {
  Object.defineProperty(process, "platform", { value: platform });
  Object.defineProperty(process, "arch", { value: arch });
};

afterEach(() => {
  fakeHost(realPlatform, realArch);
});

describe("currentPlatformTarget", () => {
  it.each([
    ["win32", "x64", "win_x64"],
    ["darwin", "arm64", "mac_universal"],
    ["linux", "x64", "linux_x64"],
    ["linux", "arm64", "linux_arm64"],
    ["linux", "arm", "linux_armhf"],
  ] as const)("maps %s/%s to %s", (platform, arch, target) => {
    fakeHost(platform, arch);
    expect(currentPlatformTarget()).toBe(target);
  });
});

describe("resolveTargets", () => {
  it("defaults to the current platform", () => {
    expect(resolveTargets(undefined)).toEqual([currentPlatformTarget()]);
    expect(resolveTargets([])).toEqual([currentPlatformTarget()]);
  });

  it("expands all", () => {
    expect(resolveTargets("all")).toEqual([...NEUTRALINO_TARGETS]);
  });

  it("removes duplicates", () => {
    expect(resolveTargets(["linux_x64", "win_x64", "linux_x64"])).toEqual([
      "linux_x64",
      "win_x64",
    ]);
  });

  it("rejects unknown targets", () => {
    expect(() =>
      resolveTargets(["win_x64", "amiga" as NeutralinoTarget]),
    ).toThrow('Unknown target "amiga"');
  });
});
