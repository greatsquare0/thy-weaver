import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createProject,
  startDevServer,
  waitFor,
  type DevServer,
  type TestProject,
} from "./helpers.ts";

let project: TestProject;
let server: DevServer;

beforeAll(async () => {
  project = await createProject();
  await project.write("src/assets/media/cover.txt", "media file");
  server = await startDevServer(project);
});

afterAll(async () => {
  await server?.stop();
  await project?.cleanup();
});

/**
 * Collects the server-sent events of /events/ until stopped
 */
const listen = async (url: string) => {
  const controller = new AbortController();
  const response = await fetch(url, { signal: controller.signal });
  const messages: string[] = [];

  const reading = (async () => {
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      for await (const chunk of response.body!) {
        buffer += decoder.decode(chunk, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop()!;
        for (const event of events) {
          const data = /^data: (.*)$/m.exec(event);
          if (data) messages.push(data[1]);
        }
      }
    } catch {
      // Aborted
    }
  })();

  return {
    response,
    messages,
    close: async () => {
      controller.abort();
      await reading;
    },
  };
};

describe("weaver dev", () => {
  it("serves the story with the reload agent injected", async () => {
    const response = await fetch(`${server.url}/`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain("Hello World!");
    expect(html).toContain(`<script async src="${server.url}/dev"></script>`);
  });

  it("serves the reload agent script", async () => {
    const response = await fetch(`${server.url}/dev`);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/javascript");
    expect(await response.text()).toContain("EventSource");
  });

  it("serves media files", async () => {
    const response = await fetch(`${server.url}/media/cover.txt`);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("media file");
  });

  it("rebuilds and notifies the page when a file changes", async () => {
    const events = await listen(`${server.url}/events/`);
    try {
      expect(events.response.headers.get("content-type")).toContain(
        "text/event-stream",
      );
      await waitFor(() => events.messages.includes("Test message"), 10_000);

      await project.edit("src/story/Start.twee", (content) =>
        content.replace("Hello World!", "Edited while running"),
      );

      await waitFor(
        () => events.messages.includes("update"),
        30_000,
        () =>
          `no update event, messages: ${JSON.stringify(events.messages)}\n${server.output()}`,
      );
    } finally {
      await events.close();
    }

    const html = await (await fetch(`${server.url}/`)).text();
    expect(html).toContain("Edited while running");
    expect(html).not.toContain("Hello World!");
  });
});
