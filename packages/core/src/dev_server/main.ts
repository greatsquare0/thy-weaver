import { createEventStream, H3, serve, serveStatic } from "h3";
import { loadConfig } from "../config/config_handler.ts";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { devState, resolveToProjectRoot } from "../utils.ts";
import { addStream, broadcast, removeStream } from "./streams.ts";
import { getPluginManager } from "../plugins/manager.ts";

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
const startServer = async () => {
  const config = await loadConfig();
  app.get("/", (_event) => {
    let html = devState.html ? devState.html : placeholder;

    const modifiedHtml = html.replace(
      "</head>",
      `<script async src="http://localhost:${config.devServer!.port}/dev"></script>\n</head>`,
    );

    return new Response(modifiedHtml, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  });

  app.get("/dev", async (_event) => {
    const agent = await readFile(join(import.meta.dirname, "reload_agent.js"));

    return new Response(agent.toString("utf-8"), {
      headers: {
        "Content-Type": "text/javascript",
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
          resolveToProjectRoot(
            config.bundler.filesystem!.projectFiles!.mediaDir!,
          ),
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
          resolveToProjectRoot(
            config.bundler.filesystem!.projectFiles!.mediaDir!,
          ),
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

  app.get("/events/", async (event) => {
    const eventStream = createEventStream(event);
    addStream(eventStream);

    await broadcast("Test message");

    eventStream.onClosed(() => {
      removeStream(eventStream);
    });

    return eventStream.send();
  });

  const pluginManager = await getPluginManager();
  await pluginManager.configureDevServer(app);

  return serve(app, {
    port: config.devServer!.port,
    hostname: config.devServer!.restricToLocalhost ? "localhost" : undefined,
    silent: true,
  });
};

export { app, startServer };
