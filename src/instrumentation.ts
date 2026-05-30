export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { logServerEvent } = await import("./lib/observability");

  logServerEvent("info", "instrumentation_registered", {
    route: "instrumentation",
    method: "BOOT",
    requestId: "system",
    region: process.env.VERCEL_REGION,
  });
}
