import { getDashboardSnapshot } from "@/lib/dashboard-data";
import { createRouteHandler, jsonNoStore } from "@/lib/http/route-handler";

export const runtime = "nodejs";

export const GET = createRouteHandler("/api/dashboard", () =>
  jsonNoStore(getDashboardSnapshot()),
);
