import { afterEach, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";
import { createProject, runWeaver, type TestProject } from "./helpers.ts";

let project: TestProject | undefined;

afterEach(async () => {
  await project?.cleanup();
  project = undefined;
});

const build = async (current: TestProject) => {
  const result = await runWeaver(current.root, ["build"]);
  expect(result.code, result.output).toBe(0);
  return current.read("dist/index.html");
};

describe("weaver build", () => {
  it("builds the JavaScript template", async () => {
    project = await createProject();

    const html = await build(project);

    // Story compiled by Tweego with the SugarCube format
    expect(html).toContain("Hello World!");
    expect(html).toContain("SugarCube");
    // App script bundled by Rolldown + SWC
    expect(html).toContain('console.log("Hello world")');
    // App styles extracted and processed by lightningcss
    expect(html).toMatch(/color:\s*#f0f/);
    // Head content and media
    expect(html).toContain('<link rel="icon" href="media/favicon.svg"');
    expect(project.exists("dist/media/favicon.svg")).toBe(true);

    const storyData = await project.read("src/story/StoryData.twee");
    const ifid = /"ifid":\s*"([^"]+)"/.exec(storyData)![1];
    expect(html).toContain(ifid);
  });

  it("builds the TypeScript template with a TS config file", async () => {
    project = await createProject({ addons: ["typescript"] });
    await project.write(
      "src/assets/app/index.ts",
      [
        'import "./styles/main.css";',
        "interface Greeting { text: string }",
        'const greeting: Greeting = { text: "typed hello" };',
        "console.log(greeting.text);",
      ].join("\n"),
    );

    const html = await build(project);

    expect(html).toContain("typed hello");
    expect(html).not.toContain("interface Greeting");
    expect(html).toMatch(/color:\s*#f0f/);
  });

  it("copies fonts and additional assets, and compiles for the target", async () => {
    project = await createProject();
    await project.write("src/assets/fonts/game.woff2", "font data");
    await project.write("extra/licenses/font.txt", "font license");
    await project.write("extra/readme.txt", "read me");
    await project.write(
      "src/assets/app/styles/main.css",
      ".a { user-select: none; }",
    );
    await project.edit("thyweaver.config.js", (content) =>
      content
        .replace("twineDebug: false", "twineDebug: true")
        .replace(
          "watcherDelay: 1000,",
          [
            "watcherDelay: 1000,",
            '    compilationTarget: "safari 10",',
            "    additionalAssets: [",
            '      { input: "extra/licenses", output: "licenses" },',
            '      { input: "extra/readme.txt", output: "readme.txt" },',
            "    ],",
          ].join("\n"),
        ),
    );

    const html = await build(project);

    expect(await project.read("dist/fonts/game.woff2")).toBe("font data");
    expect(await project.read("dist/licenses/font.txt")).toBe("font license");
    expect(await project.read("dist/readme.txt")).toBe("read me");
    // Old Safari needs the prefix
    expect(html).toContain("-webkit-user-select");
    // twineDebug never applies to builds
    expect(html).not.toMatch(/<tw-storydata[^>]*options="debug"/);
  });

  it("fails the build on a missing additional asset", async () => {
    project = await createProject();
    await project.edit("thyweaver.config.js", (content) =>
      content.replace(
        "watcherDelay: 1000,",
        'watcherDelay: 1000,\n    additionalAssets: [{ input: "missing", output: "missing" }],',
      ),
    );

    const result = await runWeaver(project.root, ["build"]);

    expect(result.code).not.toBe(0);
    expect(result.output).toContain("Additional asset not found");
  });

  it("bundles imports, raw imports and vendor files", async () => {
    project = await createProject();
    await project.write(
      "src/assets/app/greet.js",
      'export const who = "module import";',
    );
    await project.write("src/assets/app/note.txt", "raw `text` import");
    await project.write(
      "src/assets/app/index.js",
      [
        'import "./styles/main.css";',
        'import { who } from "./greet.js";',
        'import note from "./note.txt?raw";',
        "console.log(who, note);",
      ].join("\n"),
    );
    await project.write(
      "src/assets/vendor/lib.js",
      "window.vendorLib = 'vendor script';",
    );
    await project.write(
      "src/assets/vendor/lib.css",
      ".vendor { color: blue; }",
    );

    const html = await build(project);

    expect(html).toContain('console.log("module import", "raw `text` import")');
    expect(html).toContain("vendor script");
    expect(html).toMatch(/\.vendor\s*\{\s*color:\s*(blue|#00f)/);
  });

  it("compiles Sass partials through postcss", async () => {
    project = await createProject();
    await project.write(
      "src/assets/app/styles/theme.scss",
      "$accent: #123456;\n.themed { color: $accent; }",
    );
    await project.edit("src/assets/app/index.js", (content) =>
      content.replace(
        'import "./styles/main.css";',
        'import "./styles/main.css";\nimport "./styles/theme.scss";',
      ),
    );

    const html = await build(project);

    expect(html).toMatch(/\.themed\s*\{\s*color:\s*#123456/);
  });

  it("runs plugins from the config file", async () => {
    project = await createProject();
    await project.write(
      "thyweaver.config.js",
      `import { defineConfig } from "@thy-weaver/core";
import { writeFileSync } from "node:fs";

const e2ePlugin = {
  name: "e2e",
  config: () => ({ bundler: { filesystem: { dist: "out/" } } }),
  transformStoryHtml: (html) =>
    html.replace("</head>", '<meta name="e2e-plugin" content="ran"></head>'),
  buildEnd: ({ mode, html }) => {
    writeFileSync("build-end.json", JSON.stringify({ mode, length: html.length }));
  },
};

export default defineConfig({
  bundler: { filesystem: { projectFiles: { entryPoint: "src/assets/app/index.js" } } },
  plugins: [e2ePlugin],
});
`,
    );

    const result = await runWeaver(project.root, ["build"]);
    expect(result.code, result.output).toBe(0);

    // The config hook moved the output folder
    expect(project.exists("dist/index.html")).toBe(false);
    const html = await project.read("out/index.html");
    expect(html).toContain('<meta name="e2e-plugin" content="ran">');

    const buildEnd = JSON.parse(await project.read("build-end.json"));
    expect(buildEnd).toEqual({ mode: "build", length: html.length });
  });

  it("fails with a non-zero exit code on broken code", async () => {
    project = await createProject();
    await project.write("src/assets/app/index.js", "const = ;");

    const result = await runWeaver(project.root, ["build"]);

    expect(result.code).not.toBe(0);
    expect(result.output).toMatch(/Build failed/);
    expect(project.exists("dist/index.html")).toBe(false);
  });

  it("packages dist/ into a zip", async () => {
    project = await createProject();
    const { name, version } = JSON.parse(await project.read("package.json"));
    const archive = `dist/${name}-${version}.zip`;

    const result = await runWeaver(project.root, ["package"]);
    expect(result.code, result.output).toBe(0);
    expect(project.exists(archive)).toBe(true);

    const files = unzipSync(
      new Uint8Array(await readFile(`${project.root}/${archive}`)),
    );
    expect(Object.keys(files).sort()).toEqual([
      "index.html",
      "media/favicon.svg",
    ]);
    expect(strFromU8(files["index.html"]!)).toBe(
      await project.read("dist/index.html"),
    );
  });

  it("prints the version and the commands", async () => {
    project = await createProject({ withTweego: false });

    const result = await runWeaver(project.root, ["--help"]);

    expect(result.code).toBe(0);
    for (const command of ["build", "dev", "setup", "package"]) {
      expect(result.output).toContain(command);
    }
  });
});
