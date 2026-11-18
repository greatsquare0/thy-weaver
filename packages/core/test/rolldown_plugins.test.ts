import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rolldown, type Plugin } from "rolldown";
import postcss from "rollup-plugin-postcss";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { rawImportSupport } from "../src/rolldown_plugins.ts";
import { asJsModule } from "../src/rolldown_setup.ts";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "weaver-rolldown-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("rawImportSupport", () => {
  const load = (id: string) =>
    (rawImportSupport().load as (id: string) => Promise<string | null>)(id);

  it("ignores ids without ?raw", async () => {
    expect(await load(join(dir, "file.txt"))).toBeUndefined();
  });

  it("exports the file content as an escaped template string", async () => {
    const file = join(dir, "passage.html");
    await writeFile(file, "a `tick`, a \\ and ${not} interpolated");

    const code = await load(`${file}?raw`);

    expect(code).toBe(
      "export default `a \\`tick\\`, a \\\\ and \\${not} interpolated`;",
    );

    // The generated module must evaluate back to the original text
    const module = await import(
      `data:text/javascript,${encodeURIComponent(code!)}`
    );
    expect(module.default).toBe("a `tick`, a \\ and ${not} interpolated");
  });

  it.each([
    "?raw&encoding=latin1",
    "?raw?encoding=latin1",
    // Misspelled name from older docs
    "?raw&enconding=latin1",
  ])("reads the file with the requested encoding (%s)", async (query) => {
    const file = join(dir, "latin1.txt");
    await writeFile(file, Buffer.from([0x63, 0x61, 0x66, 0xe9])); // "café" in latin1

    expect(await load(`${file}${query}`)).toBe("export default `café`;");
  });

  it("defaults to utf8", async () => {
    const file = join(dir, "utf8.txt");
    await writeFile(file, "café", "utf8");

    expect(await load(`${file}?raw`)).toBe("export default `café`;");
  });

  it("reports read errors other than a missing file", async () => {
    // A folder can't be read as a file
    await expect(load(`${dir}?raw`)).rejects.toThrow(/EISDIR/);
  });

  it("returns null for missing files so other plugins can resolve them", async () => {
    expect(await load(`${join(dir, "missing.txt")}?raw`)).toBeNull();
  });
});

describe("asJsModule", () => {
  it("marks object results as JS modules", async () => {
    const plugin = asJsModule({
      name: "css-to-js",
      transform: () => ({ code: "export default 1;" }),
    });

    // oxlint-disable-next-line no-explicit-any
    const result = await (plugin.transform as any).call({}, "", "a.css");

    expect(result).toEqual({ code: "export default 1;", moduleType: "js" });
  });

  it("passes through skipped and string results", async () => {
    const skip = asJsModule({ name: "skip", transform: () => null });
    const string = asJsModule({ name: "string", transform: () => "code" });

    // oxlint-disable-next-line no-explicit-any
    expect(await (skip.transform as any).call({}, "", "a.js")).toBeNull();
    // oxlint-disable-next-line no-explicit-any
    expect(await (string.transform as any).call({}, "", "a.js")).toBe("code");
  });

  it("keeps the other hooks and the plugin context", async () => {
    const generateBundle = () => {};
    let seenThis: unknown;
    const plugin = asJsModule({
      name: "keeps",
      generateBundle,
      transform(this: unknown) {
        // oxlint-disable-next-line no-this-alias
        seenThis = this;
        return null;
      },
    } as Plugin);
    const context = { marker: true };

    // oxlint-disable-next-line no-explicit-any
    await (plugin.transform as any).call(context, "", "a.js");

    expect(plugin.name).toBe("keeps");
    expect(plugin.generateBundle).toBe(generateBundle);
    expect(seenThis).toBe(context);
  });

  it("lets rolldown bundle CSS imports through postcss", async () => {
    await writeFile(join(dir, "style.css"), "h1 { color: red; }");
    await writeFile(
      join(dir, "entry.js"),
      'import "./style.css";\nconsole.log("entry");\n',
    );

    const bundle = await rolldown({
      input: join(dir, "entry.js"),
      plugins: [
        asJsModule(
          // @ts-expect-error The plugin targets Rollup's types
          postcss({ extract: true, modules: false, plugins: [] }),
        ),
      ],
    });
    await bundle.write({ format: "esm", file: join(dir, "out", "app.js") });
    await bundle.close();

    expect(await readFile(join(dir, "out", "app.js"), "utf8")).toContain(
      'console.log("entry")',
    );
    expect(existsSync(join(dir, "out", "app.css"))).toBe(true);
    expect(await readFile(join(dir, "out", "app.css"), "utf8")).toContain(
      "color: red",
    );
  });
});
