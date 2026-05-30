export type RequestContext = {
  route: string;
  method?: string;
  requestId: string;
  vercelId?: string;
  region?: string;
};

type LogDetails = Record<string, string | number | boolean | null | undefined>;

function requestIdFallback() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `local-${Date.now()}`;
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    };
  }

  return {
    message: String(error),
    name: "UnknownError",
  };
}

export function createRequestContext(request: Request, route: string): RequestContext {
  const vercelId = request.headers.get("x-vercel-id") ?? undefined;

  return {
    route,
    method: request.method,
    requestId: vercelId ?? request.headers.get("x-request-id") ?? requestIdFallback(),
    vercelId,
    region: process.env.VERCEL_REGION,
  };
}

export function logServerEvent(
  level: "info" | "warn" | "error",
  message: string,
  context: RequestContext,
  details: LogDetails = {},
) {
  const payload = {
    level,
    message,
    service: "flappy-bird-gestos",
    timestamp: new Date().toISOString(),
    ...context,
    ...details,
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export async function reportServerError(
  error: unknown,
  context: RequestContext,
  details: LogDetails = {},
) {
  const normalized = normalizeError(error);

  logServerEvent("error", "request_failed", context, {
    ...details,
    errorName: normalized.name,
    errorMessage: normalized.message,
  });

  const webhookUrl = process.env.ERROR_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: "flappy-bird-gestos",
        context,
        error: normalized,
        details,
      }),
    });
  } catch (webhookError) {
    logServerEvent("warn", "error_webhook_failed", context, {
      errorMessage:
        webhookError instanceof Error ? webhookError.message : String(webhookError),
    });
  }
}
