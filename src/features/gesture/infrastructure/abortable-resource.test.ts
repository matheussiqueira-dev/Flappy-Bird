import { describe, expect, it, vi } from "vitest";

import { acquireAbortable } from "./abortable-resource";

describe("acquireAbortable", () => {
  it("libera um recurso tardio sem deixar o cancelamento esperando por ele", async () => {
    const controller = new AbortController();
    const close = vi.fn();
    let deliver!: (resource: { close: () => void }) => void;
    const pending = new Promise<{ close: () => void }>((resolve) => { deliver = resolve; });
    const acquisition = acquireAbortable(() => pending, (resource) => resource.close(), controller.signal);
    await Promise.resolve();
    controller.abort();
    await expect(acquisition).rejects.toMatchObject({ name: "AbortError" });
    deliver({ close });
    await pending;
    await Promise.resolve();
    expect(close).toHaveBeenCalledOnce();
  });

  it("não adquire quando já foi cancelado", async () => {
    const controller = new AbortController();
    controller.abort();
    const acquire = vi.fn();
    await expect(acquireAbortable(acquire, vi.fn(), controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    expect(acquire).not.toHaveBeenCalled();
  });

  it("propaga falhas síncronas e remove o listener ao terminar", async () => {
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, "removeEventListener");
    const error = new Error("camera failed");
    await expect(acquireAbortable(() => { throw error; }, vi.fn(), controller.signal)).rejects.toBe(error);
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
  });
});
