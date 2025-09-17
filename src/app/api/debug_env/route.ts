import { NextResponse } from "next/server";

const EXPOSE_ENV_PREFIXES = ["NEXT_PUBLIC_", "VERCEL_", "NODE_"];

function pickSafeEnvVars() {
  const entries = Object.entries(process.env)
    .filter(([key]) => EXPOSE_ENV_PREFIXES.some((prefix) => key.startsWith(prefix)))
    .map(([key, value]) => [key, value ?? ""] as const)
    .sort(([a], [b]) => (a > b ? 1 : -1));

  return Object.fromEntries(entries);
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const debugPayload = {
    timestamp,
    nodeVersion: process.version,
    runtime: process.env.NEXT_RUNTIME ?? "nodejs",
    deploymentEnv: process.env.VERCEL_ENV ?? "unknown",
    routes: ["/", "/roadmap", "/stats", "/links", "/log/quick", "/api/recommendations"],
    env: pickSafeEnvVars(),
  } as const;

  console.log("[debug] /api/debug_env invoked", debugPayload);

  return NextResponse.json(debugPayload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
