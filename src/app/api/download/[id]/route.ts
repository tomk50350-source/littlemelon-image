import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await context.params;
  const generation = await prisma.generation.findFirst({
    where: { id, userId: session.user.id }
  });

  if (!generation?.originalUrl) {
    return NextResponse.json({ error: "原图不存在" }, { status: 404 });
  }

  return NextResponse.redirect(generation.originalUrl);
}
