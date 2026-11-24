import { NextResponse } from "next/server";

export async function GET() {
  const startTime = Date.now();
  
  return NextResponse.json({
    status: "ok",
    service: "vahancheck-web-portal",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    response_time_ms: Date.now() - startTime,
    features: {
      dark_navy_sidebar: true,
      auth_sanctum_client: true,
      mock_watermarking_enabled: true,
      offline_sync_supported: true,
    }
  }, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    }
  });
}
