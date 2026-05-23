import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FREE_GALLERY_LIMIT, PUBLIC_GALLERY_LIMIT } from "@/lib/constants";
import { getUserTier } from "@/lib/credits";
import { galleryBaseWhere, gallerySeedFromRequest, getRotatingGalleryItems } from "@/lib/gallery";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || searchParams.get("category") || "全部";
  const tag = searchParams.get("tag");
  const skip = Number(searchParams.get("skip") || 0);
  const take = Math.min(Number(searchParams.get("take") || 60), 120);
  const seed = gallerySeedFromRequest(request);
  const sort = searchParams.get("sort") === "popular" ? "popular" : searchParams.get("sort") === "latest" ? "latest" : "rotating";
  const categoryFilters = ["电商产品图", "AI 修图", "专利制图标准", "创意灵感"];
  const tier = session?.user?.id ? await getUserTier(session.user.id) : "guest";
  const browsingLimit = !session?.user?.id ? PUBLIC_GALLERY_LIMIT : tier === "free" ? FREE_GALLERY_LIMIT : 100000;

  if (skip >= browsingLimit) {
    return NextResponse.json({
      items: [],
      hasMore: false,
      seed,
      requiresLogin: !session?.user?.id,
      limit: browsingLimit
    });
  }

  const where = {
    ...galleryBaseWhere,
    ...(filter && filter !== "全部"
      ? categoryFilters.includes(filter)
        ? { category: filter }
        : {
            OR: [
              { tags: { contains: filter } },
              { title: { contains: filter } },
              { prompt: { contains: filter } }
            ]
          }
      : {}),
    ...(tag ? { tags: { contains: tag } } : {})
  };

  const allowedTake = Math.min(take, browsingLimit - skip);
  const { items, total } = await getRotatingGalleryItems({ where, take: allowedTake + 1 + skip, seed, order: sort });
  const page = items.slice(skip, skip + allowedTake + 1);

  return NextResponse.json({
    items: page.slice(0, allowedTake),
    hasMore: skip + allowedTake < Math.min(total, browsingLimit),
    seed,
    requiresLogin: !session?.user?.id && skip + allowedTake >= PUBLIC_GALLERY_LIMIT,
    limit: browsingLimit
  });
}
