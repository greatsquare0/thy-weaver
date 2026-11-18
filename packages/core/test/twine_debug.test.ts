import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ThyWevearOptions } from "../src/config/config_types.ts";

const tweenode = vi.hoisted(() => vi.fn(async (options: unknown) => options));

vi.mock("tweenode", () => ({ tweenode, setupTweego: vi.fn() }));

vi.mock("../src/config/config_handler.ts", async () => {
  const { defaultConfig } = await import("../src/config/defaults.ts");
  return { loadConfig: async () => defaultConfig };
});

const { getTweego } = await import("../src/build_commands.ts");
const { useTwineTestMode } = await import("../src/pipeline.ts");

const config = (twineDebug: boolean) =>
  ({ devServer: { twineDebug } }) as Pick<ThyWevearOptions, "devServer">;

describe("useTwineTestMode", () => {
  it("is on for dev when twineDebug is enabled", () => {
    expect(useTwineTestMode(config(true), "dev")).toBe(true);
  });

  it("is off when twineDebug is disabled", () => {
    expect(useTwineTestMode(config(false), "dev")).toBe(false);
    expect(useTwineTestMode({}, "dev")).toBe(false);
  });

  it.each(["build", "compile"])("is never on for %s", (mode) => {
    expect(useTwineTestMode(config(true), mode)).toBe(false);
  });
});

describe("getTweego", () => {
  beforeEach(() => tweenode.mockClear());

  const lastInput = () =>
    (
      tweenode.mock.calls.at(-1)![0] as {
        build: { input: Record<string, unknown> };
      }
    ).build.input;

  it("compiles without test mode by default", async () => {
    await getTweego("string");
    expect(lastInput().useTwineTestMode).toBe(false);
  });

  it("passes test mode to Tweego", async () => {
    await getTweego("string", { testMode: true });
    expect(lastInput().useTwineTestMode).toBe(true);
  });
});
