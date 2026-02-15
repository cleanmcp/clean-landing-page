import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { getEngineStatus } from "@/lib/engine";

// GET /api/engine-status - Check engine connection status
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await getEngineStatus(ctx.orgId);
    return NextResponse.json(status);
  } catch (error) {
    console.error("Failed to fetch engine status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
