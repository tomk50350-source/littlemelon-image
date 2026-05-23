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
      take
    });
    return { items, total };
  }

  if (order === "popular") {
    const items = await prisma.promptGallery.findMany({
      where,
      orderBy: [{ popularity: "desc" }, { repoStars: "desc" }, { updatedAt: "desc" }],
      take
    });
    return { items, total };
  }

  const offset = Math.abs(Math.floor(seed)) % total;
  const firstTake = Math.min(take, total - offset);
  const [firstBatch, secondBatch] = await Promise.all([
    prisma.promptGallery.findMany({
      where,
      orderBy: [{ id: "asc" }],
      skip: offset,
      take: firstTake
    }),
    firstTake < take
      ? prisma.promptGallery.findMany({
          where,
          orderBy: [{ id: "asc" }],
          skip: 0,
          take: Math.min(take - firstTake, offset)
        })
      : Promise.resolve([])
  ]);

  return { items: [...firstBatch, ...secondBatch], total };
}

export function gallerySeedFromRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSeed = searchParams.get("seed");
  if (rawSeed) return Number(rawSeed);
  return Date.now();
}
