import { getServerEnv, publicEnv } from "@/lib/env";
import { createRouteHandler, jsonNoStore } from "@/lib/http/route-handler";

export const runtime = "nodejs";

export const GET = createRouteHandler("/api/health", () => {
  const env = getServerEnv();

  return jsonNoStore({
    status: "ok",
    service: "flappy-bird-gestos",
    runtime: "nextjs",
    version: process.env.npm_package_version ?? "local",
    environment: env.vercelEnv ?? process.env.NODE_ENV ?? "local",
    region: env.vercelRegion ?? "local",
    commit: env.commitSha?.slice(0, 7) ?? "local",
    timestamp: new Date().toISOString(),
    checks: {
      web: "ok",
      pwa: "ok",
      analytics: env.isVercel || publicEnv.gaId ? "configured" : "local-disabled",
      gestureControl: "browser",
      pythonEngine: "local-only",
    },
  });
});
