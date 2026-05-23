import type { PromptGallery } from "@prisma/client";
import { prisma } from "./prisma";

export const GALLERY_PAGE_SIZE = 60;

export const galleryBaseWhere = {
  id: { startsWith: "github-" },
  NOT: [
    { prompt: { contains: "围绕这个画面方向" } },
    { title: { contains: "Claude Code" } },
    { title: { contains: "插件" } },
    { title: { contains: "广告" } }
  ]
} as const;

export async function getRotatingGalleryItems({
  where,
  take = GALLERY_PAGE_SIZE,
  seed = Date.now(),
  order = "rotating"
}: {
  where: Record<string, unknown>;
  take?: number;
  seed?: number;
  order?: "rotating" | "latest" | "popular";
}) {
  const total = await prisma.promptGallery.count({ where });
  if (total === 0) return { items: [], total };

  if (order === "latest") {
    const items = await prisma.promptGallery.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: getDedupeTake(take, total)
    });
    return { items: dedupeGalleryItems(items).slice(0, take), total };
  }

  if (order === "popular") {
    const items = await prisma.promptGallery.findMany({
      where,
      orderBy: [{ popularity: "desc" }, { repoStars: "desc" }, { updatedAt: "desc" }],
      take: getDedupeTake(take, total)
    });
    return { items: dedupeGalleryItems(items).slice(0, take), total };
  }

  const offset = Math.abs(Math.floor(seed)) % total;
  const requestedTake = getDedupeTake(take, total);
  const firstTake = Math.min(requestedTake, total - offset);
  const [firstBatch, secondBatch] = await Promise.all([
    prisma.promptGallery.findMany({
      where,
      orderBy: [{ id: "asc" }],
      skip: offset,
      take: firstTake
    }),
    firstTake < requestedTake
      ? prisma.promptGallery.findMany({
          where,
          orderBy: [{ id: "asc" }],
          skip: 0,
          take: Math.min(requestedTake - firstTake, offset)
        })
      : Promise.resolve([])
  ]);

  return { items: dedupeGalleryItems([...firstBatch, ...secondBatch]).slice(0, take), total };
}

export function gallerySeedFromRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSeed = searchParams.get("seed");
  if (rawSeed) return Number(rawSeed);
  return Date.now();
}

function getDedupeTake(take: number, total: number) {
  return Math.min(Math.max(take * 4, take + 80), total);
}

function dedupeGalleryItems(items: PromptGallery[]) {
  const seen = new Set<string>();
  const deduped: PromptGallery[] = [];

  for (const item of items) {
    const keys = [dedupeKey(item.coverUrl), dedupeKey(item.title), promptSignature(item.prompt)];
    if (keys.some((key) => key && seen.has(key))) continue;
    keys.forEach((key) => {
      if (key) seen.add(key);
    });
    deduped.push(item);
  }

  return deduped;
}

function dedupeKey(value: string | null | undefined) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/\?.*$/, "")
    .replace(/[_\-\s]+/g, "")
    .trim();
}

function promptSignature(prompt: string | null | undefined) {
  if (!prompt) return "";
  return dedupeKey(prompt).slice(0, 180);
}
