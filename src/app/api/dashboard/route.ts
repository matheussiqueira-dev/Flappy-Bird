import { getDashboardSnapshot } from "@/lib/dashboard-data";
import {
  createRequestContext,
  logServerEvent,
  reportServerError,
} from "@/lib/observability";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const context = createRequestContext(request, "/api/dashboard");

  logServerEvent("info", "request_started", context);

  try {
    const snapshot = getDashboardSnapshot();
    const durationMs = Date.now() - startedAt;

    logServerEvent("info", "request_completed", context, {
      durationMs,
      schemaVersion: snapshot.schemaVersion,
    });

    return Response.json(snapshot, {
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
        error: "dashboard_unavailable",
        requestId: context.requestId,
      },
      { status: 500 },
    );
  }
}
