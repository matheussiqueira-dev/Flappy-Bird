export const runtime = "nodejs";

export function GET() {
  return Response.json({
    status: "ok",
    service: "flappy-bird-gestos",
    runtime: "nextjs",
    timestamp: new Date().toISOString(),
  });
}
