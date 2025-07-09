import { H3, serve, serveStatic } from "h3";
import { loadConfig } from "../config/config_handler.ts";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { resolveToProjectRoot } from "../utils.ts";
import { htmlData } from "../run_dev.ts";

const config = await loadConfig();

const app = new H3();

const placeholder = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Document</title>
</head>
<body>
  
</body>
</html>
`;

app.get("/", (_event) => {
  const html = htmlData() !== undefined ? htmlData() : placeholder;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
});

app.use("/media/**", (event) => {
  return serveStatic(event, {
    indexNames: undefined,
    getContents: async (id) => {
      const parsedId = id
        .split("/")
        .filter((n) => n !== "")
        .toSpliced(0, 1)
        .join("/");

      const path = join(
        resolveToProjectRoot(config.bundler.filesystem!.projectFiles.mediaDir),
        parsedId,
      );

      const file = await readFile(path);
      return file;
    },
    getMeta: async (id) => {
      const parsedId = id
        .split("/")
        .filter((n) => n !== "")
        .toSpliced(0, 1)
        .join("/");

      const path = join(
        resolveToProjectRoot(config.bundler.filesystem!.projectFiles.mediaDir),
        parsedId,
      );

      const stats = await stat(path).catch(() => {});
      if (stats?.isFile()) {
        return {
          size: stats.size,
          mtime: stats.mtimeMs,
        };
      }
    },
  });
});
const _server = serve(app, {
  port: config.devServer!.port,
  hostname: config.devServer!.restricToLocalhost ? "localhost" : undefined,
});
