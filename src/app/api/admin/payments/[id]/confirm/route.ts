import { PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { addMonthlyCredits } from "@/lib/credits";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await context.params;
  const payment = await prisma.payment.findUnique({ where: { id } });

  if (!payment) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  if (payment.status === PaymentStatus.PAID) {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  await prisma.payment.update({
    where: { id },
    data: {
      status: PaymentStatus.PAID,
      paidAt: new Date(),
      providerTradeNo: `manual-${Date.now()}`
    }
  });
  await addMonthlyCredits(payment.userId, payment.id);

  return NextResponse.json({ ok: true });
}
