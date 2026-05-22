import { NextResponse } from "next/server";
import { galleryBaseWhere, gallerySeedFromRequest, getRotatingGalleryItems } from "@/lib/gallery";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || searchParams.get("category") || "全部";
  const tag = searchParams.get("tag");
  const skip = Number(searchParams.get("skip") || 0);
  const take = Math.min(Number(searchParams.get("take") || 60), 120);
  const seed = gallerySeedFromRequest(request);
  const categoryFilters = ["电商产品图", "AI 修图", "专利制图标准", "创意灵感"];

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

  const { items, total } = await getRotatingGalleryItems({ where, take: take + 1 + skip, seed });
  const page = items.slice(skip, skip + take + 1);

  return NextResponse.json({ items: page.slice(0, take), hasMore: skip + take < total, seed });
}
