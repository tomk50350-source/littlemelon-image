import { PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { addPaidCredits } from "@/lib/credits";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payment = await prisma.payment.findUnique({ where: { id } });

  if (!payment) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  if (payment.status !== PaymentStatus.PAID) {
    await prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        providerTradeNo: `mock-${Date.now()}`
      }
    });
    await addPaidCredits(payment.userId, payment.id, payment.planId);
  }

  return NextResponse.redirect(new URL("/pricing?paid=1", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}
