import {
  createRequestContext,
  logServerEvent,
  reportServerError,
  type RequestContext,
} from "@/lib/observability";

/**
 * Erro de domínio com status HTTP explícito. A mensagem é exposta ao cliente;
 * qualquer outro erro vira 500 com mensagem genérica, sem vazar detalhes.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Envelope de erro único para toda a API. */
export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
};

type RouteHandler = (request: Request, context: RequestContext) => Response | Promise<Response>;

/**
 * Envolve um Route Handler com request ID, logs estruturados de início e fim,
 * medição de latência e tratamento de erro padronizado.
 */
export function createRouteHandler(route: string, handler: RouteHandler) {
  return async (request: Request): Promise<Response> => {
    const startedAt = Date.now();
    const context = createRequestContext(request, route);

    logServerEvent("info", "request_started", context);

    try {
      const response = await handler(request, context);
      response.headers.set("X-Request-Id", context.requestId);

      logServerEvent("info", "request_completed", context, {
        status: response.status,
        durationMs: Date.now() - startedAt,
      });

      return response;
    } catch (error) {
      const durationMs = Date.now() - startedAt;

      if (error instanceof ApiError && error.status < 500) {
        logServerEvent("warn", "request_rejected", context, {
          status: error.status,
          code: error.code,
          durationMs,
        });
        return errorResponse(error.status, error.code, error.message, context.requestId);
      }

      await reportServerError(error, context, { durationMs });

      const code = error instanceof ApiError ? error.code : "internal_error";
      return errorResponse(
        error instanceof ApiError ? error.status : 500,
        code,
        "Não foi possível processar a requisição.",
        context.requestId,
      );
    }
  };
}

export function jsonNoStore<T>(body: T, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  return Response.json(body, { ...init, headers });
}

function errorResponse(status: number, code: string, message: string, requestId: string) {
  const body: ApiErrorBody = { error: { code, message, requestId } };
  return jsonNoStore(body, { status, headers: { "X-Request-Id": requestId } });
}
