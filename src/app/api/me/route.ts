import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getCreditBalance } from "@/lib/credits";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ user: null, balance: 0, history: [] });
  }

  const [balance, history] = await Promise.all([
    getCreditBalance(session.user.id),
    prisma.generation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  return NextResponse.json({
    user: session.user,
    balance,
    history
  });
}
