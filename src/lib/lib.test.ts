import { afterEach, describe, expect, it, vi } from "vitest";

import { parseGaId, parseSiteUrl, parseWebhookUrl } from "./env";
import { ApiError, createRouteHandler, jsonNoStore } from "./http/route-handler";

describe("env", () => {
  it("aceita apenas URLs de site seguras", () => {
    expect(parseSiteUrl("https://exemplo.dev/qualquer/caminho")).toBe("https://exemplo.dev");
    expect(parseSiteUrl("http://localhost:3000")).toBe("http://localhost:3000");
    expect(parseSiteUrl("http://exemplo.dev")).toBe("https://flappy-bird-gestos.vercel.app");
    expect(parseSiteUrl("javascript:alert(1)")).toBe("https://flappy-bird-gestos.vercel.app");
    expect(parseSiteUrl(undefined)).toBe("https://flappy-bird-gestos.vercel.app");
  });

  it("bloqueia GA IDs que poderiam injetar script", () => {
    expect(parseGaId(" G-ABC123XYZ ")).toBe("G-ABC123XYZ");
    expect(parseGaId("G-1'); alert(1); //")).toBeNull();
    expect(parseGaId("UA-123")).toBeNull();
    expect(parseGaId("")).toBeNull();
  });

  it("exige HTTPS no webhook de erros", () => {
    expect(parseWebhookUrl("https://hooks.exemplo.dev/x")).toBe("https://hooks.exemplo.dev/x");
    expect(parseWebhookUrl("http://hooks.exemplo.dev/x")).toBeNull();
    expect(parseWebhookUrl("não é url")).toBeNull();
  });
});

describe("createRouteHandler", () => {
  const request = () => new Request("https://exemplo.dev/api/teste", { headers: { "x-request-id": "req-1" } });

  afterEach(() => vi.restoreAllMocks());

  it("propaga o request ID e preserva a resposta", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const handler = createRouteHandler("/api/teste", () => jsonNoStore({ ok: true }));

    const response = await handler(request());

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toBe("req-1");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("expõe a mensagem de ApiError 4xx no envelope padrão", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const handler = createRouteHandler("/api/teste", () => {
      throw new ApiError(422, "invalid_score", "Pontuação inválida.");
    });

    const response = await handler(request());

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      error: { code: "invalid_score", message: "Pontuação inválida.", requestId: "req-1" },
    });
  });

  it("esconde detalhes de erros inesperados", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = createRouteHandler("/api/teste", () => {
      throw new Error("senha do banco: hunter2");
    });

    const response = await handler(request());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("internal_error");
    expect(JSON.stringify(body)).not.toContain("hunter2");
    expect(errorLog).toHaveBeenCalled();
  });
});
