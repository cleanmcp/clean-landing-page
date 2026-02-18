import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { engineFetch } from "@/lib/engine";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTierLimits } from "@/lib/tier-limits";

// GET /api/repos - List all indexed repositories
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await engineFetch(ctx.orgId, "/repos");

    if (!res.ok) {
      const text = await res.text();
      console.error("Clean server error:", text);
      return NextResponse.json(
        { error: "Indexing server returned an error", repos: [] },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch repos:", error);
    return NextResponse.json(
      { error: "Cannot connect to indexing server", repos: [] },
      { status: 502 }
    );
  }
}

// POST /api/repos - Start indexing a repository or cancel a job
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await request.text();
    if (rawBody.length > 10000) {
      return NextResponse.json(
        { error: "Request too large" },
        { status: 413 }
      );
    }
    const body = JSON.parse(rawBody);
    const { repo, action } = body;

    if (!repo || typeof repo !== "string") {
      return NextResponse.json(
        { error: "Repository name is required" },
        { status: 400 }
      );
    }

    // Validate format
    const parts = repo.split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return NextResponse.json(
        {
          error:
            "Invalid format. Use owner/repo (e.g., facebook/react)",
        },
        { status: 400 }
      );
    }

    // Handle cancel action
    if (action === "cancel") {
      const res = await engineFetch(
        ctx.orgId,
        `/repos/${parts[0]}/${parts[1]}/cancel`,
        { method: "POST" }
      );

      const data = await res.json();

      if (!res.ok) {
        return NextResponse.json(
          {
            error: data.detail || "Failed to cancel indexing",
          },
          { status: res.status }
        );
      }

      return NextResponse.json({
        status: data.status,
        message:
          data.status === "cancel_requested"
            ? "Cancellation requested. Job will stop shortly."
            : data.status === "not_running"
              ? "No indexing job is currently running."
              : "No active job found.",
      });
    }

    // Enforce tier limit on repos
    const reposRes = await engineFetch(ctx.orgId, "/repos");
    if (reposRes.ok) {
      const reposData = await reposRes.json();
      const repoList = reposData.repos ?? reposData;
      const repoCount = Array.isArray(repoList) ? repoList.length : 0;

      const [org] = await db
        .select({ tier: organizations.tier })
        .from(organizations)
        .where(eq(organizations.id, ctx.orgId))
        .limit(1);

      const limits = getTierLimits(org?.tier ?? "free");
      if (repoCount >= limits.repos) {
        return NextResponse.json(
          {
            error: `Repository limit reached for your plan (${repoCount}/${limits.repos}). Upgrade to index more repositories.`,
          },
          { status: 403 }
        );
      }
    }

    // Default: start indexing
    const res = await engineFetch(
      ctx.orgId,
      `/repos/index?repo=${encodeURIComponent(repo)}`,
      { method: "POST" }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: data.detail || "Failed to start indexing",
        },
        { status: res.status }
      );
    }

    // Audit log
    if (data.status === "queued") {
      audit({
        orgId: ctx.orgId,
        userId: ctx.userId,
        action: "repo.indexed",
        resourceType: "repository",
        resourceId: repo,
        metadata: { repo },
      });
    }

    return NextResponse.json({
      status: data.status,
      message:
        data.status === "queued"
          ? "Repository queued for indexing. This may take a few minutes."
          : data.status === "already_indexed"
            ? "Repository is already indexed."
            : data.status === "in_progress"
              ? "Repository is already being indexed."
              : data.message,
    });
  } catch (error) {
    console.error("Failed to process request:", error);
    return NextResponse.json(
      { error: "Failed to connect to indexing server" },
      { status: 500 }
    );
  }
}

// DELETE /api/repos - Delete a repository from the index
export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repo = searchParams.get("repo");

    if (!repo || typeof repo !== "string") {
      return NextResponse.json(
        { error: "Repository name is required" },
        { status: 400 }
      );
    }

    // Validate format
    const parts = repo.split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return NextResponse.json(
        {
          error:
            "Invalid format. Use owner/repo (e.g., facebook/react)",
        },
        { status: 400 }
      );
    }

    const res = await engineFetch(
      ctx.orgId,
      `/repos/${parts[0]}/${parts[1]}`,
      { method: "DELETE" }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: data.detail || "Failed to delete repository",
        },
        { status: res.status }
      );
    }

    // Audit log
    audit({
      orgId: ctx.orgId,
      userId: ctx.userId,
      action: "repo.deleted",
      resourceType: "repository",
      resourceId: repo,
      metadata: { repo },
    });

    return NextResponse.json({
      status: "deleted",
      message: "Repository has been removed from the index.",
    });
  } catch (error) {
    console.error("Failed to delete repository:", error);
    return NextResponse.json(
      { error: "Failed to connect to indexing server" },
      { status: 500 }
    );
  }
}
