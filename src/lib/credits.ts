import { Prisma, CreditSource } from "@prisma/client";
import { addDays, endOfMonth } from "./date";
import { MONTHLY_PLAN } from "./constants";
import { prisma } from "./prisma";

export async function getCreditBalance(userId: string) {
  const now = new Date();
  const rows = await prisma.creditLedger.findMany({
    where: {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
    },
    select: { amount: true }
  });

  return rows.reduce((total, row) => total + Number(row.amount), 0);
}

export async function addMonthlyCredits(userId: string, paymentId: string) {
  const expiresAt = endOfMonth(new Date());

  await prisma.$transaction([
    prisma.subscription.create({
      data: {
        userId,
        planId: MONTHLY_PLAN.id,
        startsAt: new Date(),
        endsAt: addDays(new Date(), MONTHLY_PLAN.periodDays),
        active: true
      }
    }),
    prisma.creditLedger.create({
      data: {
        userId,
        amount: MONTHLY_PLAN.credits,
        source: CreditSource.SUBSCRIPTION,
        expiresAt,
        paymentId,
        note: "9.9 元月卡积分，月底清零"
      }
    })
  ]);
}

export async function debitCredits(userId: string, generationId: string, amount: number) {
  await prisma.creditLedger.create({
    data: {
      userId,
      amount: new Prisma.Decimal(-amount),
      source: CreditSource.GENERATION_DEBIT,
      generationId,
      note: "生成图片预扣积分"
    }
  });
}

export async function refundCredits(userId: string, generationId: string, amount: number) {
  await prisma.creditLedger.create({
    data: {
      userId,
      amount,
      source: CreditSource.GENERATION_REFUND,
      generationId,
      note: "生成失败退回积分"
    }
  });
}
