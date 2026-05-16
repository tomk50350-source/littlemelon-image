import { NextResponse } from "next/server";
import { closeGallerySync, syncGitHubGallery } from "@/../scripts/gallery-sync-core.mjs";

export async function POST(request: Request) {
  const token = request.headers.get("x-sync-token");

  if (!process.env.GITHUB_SYNC_TOKEN || token !== process.env.GITHUB_SYNC_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncGitHubGallery();
    return NextResponse.json(result);
  } finally {
    await closeGallerySync();
  }
}
