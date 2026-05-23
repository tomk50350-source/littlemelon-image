import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { MEMBER_FAVORITE_LIMIT } from "@/lib/constants";
import { getUserTier } from "@/lib/credits";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ favorites: [] });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    select: { promptGalleryId: true },
    orderBy: { createdAt: "desc" },
    take: MEMBER_FAVORITE_LIMIT
  });

  return NextResponse.json({ favorites: favorites.map((item) => item.promptGalleryId) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录后再收藏" }, { status: 401 });
  }

  const tier = await getUserTier(session.user.id);
  if (tier === "free") {
    return NextResponse.json({ error: "收藏功能面向会员用户开放" }, { status: 403 });
  }

  const body = await request.json();
  const promptGalleryId = String(body.promptGalleryId || "");
  if (!promptGalleryId) {
    return NextResponse.json({ error: "缺少作品 ID" }, { status: 400 });
  }

  const count = await prisma.favorite.count({ where: { userId: session.user.id } });
  const existing = await prisma.favorite.findUnique({
    where: { userId_promptGalleryId: { userId: session.user.id, promptGalleryId } }
  });

  if (!existing && count >= MEMBER_FAVORITE_LIMIT) {
    return NextResponse.json({ error: `会员最多收藏 ${MEMBER_FAVORITE_LIMIT} 张图片` }, { status: 403 });
  }

  await prisma.favorite.upsert({
    where: { userId_promptGalleryId: { userId: session.user.id, promptGalleryId } },
    update: {},
    create: { userId: session.user.id, promptGalleryId }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const promptGalleryId = searchParams.get("promptGalleryId") || "";
  if (!promptGalleryId) {
    return NextResponse.json({ error: "缺少作品 ID" }, { status: 400 });
  }

  await prisma.favorite.deleteMany({
    where: { userId: session.user.id, promptGalleryId }
  });

  return NextResponse.json({ ok: true });
}
