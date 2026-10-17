import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { startHandTracker } from "./hand-tracker";

const { createModel } = vi.hoisted(() => ({ createModel: vi.fn() }));
vi.mock("@mediapipe/tasks-vision", () => ({
  FilesetResolver: { forVisionTasks: async () => ({}) },
  HandLandmarker: { createFromOptions: createModel },
}));

describe("hand tracker resource lifecycle", () => {
  let stop: ReturnType<typeof vi.fn<() => void>>;
  let close: ReturnType<typeof vi.fn<() => void>>;
  let getUserMedia: ReturnType<typeof vi.fn>;
  let video: HTMLVideoElement;

  beforeEach(() => {
    stop = vi.fn();
    close = vi.fn();
    const track = { stop, addEventListener: vi.fn() };
    getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [track], getVideoTracks: () => [track] });
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    vi.stubGlobal("document", { createElement: () => ({ getContext: () => null }) });
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    createModel.mockReset().mockResolvedValue({ close });
    video = { srcObject: null, play: vi.fn().mockResolvedValue(undefined) } as unknown as HTMLVideoElement;
  });

  afterEach(() => vi.unstubAllGlobals());

  it("responde à permissão negada sem iniciar o download do modelo", async () => {
    getUserMedia.mockRejectedValue(new DOMException("denied", "NotAllowedError"));
    await expect(startHandTracker({ video, onFrame: vi.fn() })).rejects.toMatchObject({ code: "permission-denied" });
    expect(createModel).not.toHaveBeenCalled();
  });

  it("cancela durante o carregamento e fecha um modelo que chegar tarde", async () => {
    let deliver!: (model: { close: () => void }) => void;
    createModel.mockImplementation(() => new Promise((resolve) => { deliver = resolve; }));
    const controller = new AbortController();
    const loading = startHandTracker({ video, onFrame: vi.fn(), signal: controller.signal });
    await vi.waitFor(() => expect(createModel).toHaveBeenCalledOnce());
    controller.abort();
    await expect(loading).rejects.toMatchObject({ name: "AbortError" });
    expect(stop).toHaveBeenCalled();
    deliver({ close });
    await vi.waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(video.srcObject).toBeNull();
  });

  it("libera câmera e modelo quando o vídeo falha", async () => {
    vi.mocked(video.play).mockRejectedValue(new DOMException("unreadable", "NotReadableError"));
    await expect(startHandTracker({ video, onFrame: vi.fn() })).rejects.toMatchObject({ code: "camera-busy" });
    expect(stop).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
    expect(video.srcObject).toBeNull();
  });

  it("stop é idempotente e retira a câmera do vídeo", async () => {
    const controller = new AbortController();
    const session = await startHandTracker({ video, onFrame: vi.fn(), signal: controller.signal });
    session.stop();
    session.stop();
    controller.abort();
    expect(close).toHaveBeenCalledOnce();
    expect(stop).toHaveBeenCalledOnce();
    expect(video.srcObject).toBeNull();
  });
});
