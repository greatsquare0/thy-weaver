import type { createEventStream } from "h3";

export type EventStream = ReturnType<typeof createEventStream>;
const clients = new Set<EventStream>();

export const addStream = (stream: EventStream) => {
  clients.add(stream);
};

export const removeStream = (stream: EventStream) => {
  clients.delete(stream);
};

/**
 * Sends `data` to every connected page, doing nothing when none is connected.
 * Pushes aren't awaited so a slow or paused tab can't hold up rebuilds, and a
 * failed one drops that tab instead of becoming an unhandled rejection
 */
export const broadcast = async (data: string) => {
  for (const stream of clients) {
    stream.push(data).catch(() => removeStream(stream));
  }
};
