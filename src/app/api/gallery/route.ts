import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || searchParams.get("category") || "全部";
  const tag = searchParams.get("tag");
  const skip = Number(searchParams.get("skip") || 0);
  const take = Math.min(Number(searchParams.get("take") || 60), 120);
  const categoryFilters = ["电商产品图", "AI 修图", "专利制图标准", "创意灵感"];

  const items = await prisma.promptGallery.findMany({
    where: {
      id: { startsWith: "github-" },
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
      ...(tag ? { tags: { contains: tag } } : {}),
      NOT: [
        { prompt: { contains: "围绕这个画面方向" } },
        { title: { contains: "Claude Code" } },
        { title: { contains: "插件" } }
      ]
    },
    orderBy: [{ updatedAt: "desc" }],
    skip,
    take: take + 1
  });

  return NextResponse.json({ items: items.slice(0, take), hasMore: items.length > take });
}
