import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { getCreditBalance, getTierMaxQuantity, getTierReferenceLimit, getUserTier } from "@/lib/credits";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ user: null, balance: 0, history: [] });
  }

  const [balance, history, user] = await Promise.all([
    getCreditBalance(session.user.id),
    prisma.generation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
  ]);
  const tier = await getUserTier(session.user.id);
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  return NextResponse.json({
    user: session.user,
    balance,
    history,
    tier,
    maxReferenceImages: isSuperAdmin ? 3 : getTierReferenceLimit(tier),
    maxQuantity: isSuperAdmin ? 3 : getTierMaxQuantity(tier)
  });
}
