import {
  createRequestContext,
  logServerEvent,
  reportServerError,
} from "@/lib/observability";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const context = createRequestContext(request, "/api/health");

  logServerEvent("info", "request_started", context);

  try {
    const payload = {
      status: "ok",
      service: "flappy-bird-gestos",
      runtime: "nextjs",
      version: process.env.npm_package_version ?? "local",
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local",
      region: process.env.VERCEL_REGION ?? "local",
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
      timestamp: new Date().toISOString(),
      checks: {
        web: "ok",
        pwa: "ok",
        analytics: "configured",
        pythonEngine: "local-only",
      },
    };

    logServerEvent("info", "request_completed", context, {
      durationMs: Date.now() - startedAt,
      status: payload.status,
    });

    return Response.json(payload, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    await reportServerError(error, context, {
      durationMs: Date.now() - startedAt,
    });

    return Response.json(
      {
        status: "error",
        service: "flappy-bird-gestos",
        requestId: context.requestId,
      },
      { status: 500 },
    );
  }
}
