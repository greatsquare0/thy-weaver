import { describe, expect, it, vi } from "vitest";
import {
  addStream,
  broadcast,
  removeStream,
  type EventStream,
} from "../src/dev_server/streams.ts";

const fakeStream = () =>
  ({ push: vi.fn().mockResolvedValue(undefined) }) as unknown as EventStream & {
    push: ReturnType<typeof vi.fn>;
  };

describe("dev server streams", () => {
  it("sends broadcasts to every connected client", async () => {
    const a = fakeStream();
    const b = fakeStream();
    addStream(a);
    addStream(b);

    await broadcast("update");

    expect(a.push).toHaveBeenCalledWith("update");
    expect(b.push).toHaveBeenCalledWith("update");

    removeStream(a);
    removeStream(b);
  });

  it("stops sending to removed clients", async () => {
    const stream = fakeStream();
    addStream(stream);
    removeStream(stream);

    await broadcast("update");

    expect(stream.push).not.toHaveBeenCalled();
  });

  it("works with no clients connected", async () => {
    await expect(broadcast("update")).resolves.toBeUndefined();
  });

  it("drops a client whose push fails, without rejecting", async () => {
    const broken = fakeStream();
    broken.push.mockRejectedValue(new Error("closed"));
    const healthy = fakeStream();
    addStream(broken);
    addStream(healthy);

    await expect(broadcast("update")).resolves.toBeUndefined();
    // Let the failed push settle
    await new Promise((resolve) => setTimeout(resolve, 0));

    await broadcast("again");
    expect(broken.push).toHaveBeenCalledTimes(1);
    expect(healthy.push).toHaveBeenLastCalledWith("again");

    removeStream(healthy);
  });
});
