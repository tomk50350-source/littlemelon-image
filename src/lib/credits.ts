import { Prisma, CreditSource } from "@prisma/client";
import { addDays, endOfMonth } from "./date";
import { BILLING_PLANS, PAYG_PLANS, PLUS_PLAN, PRO_PLAN, type BillingPlanId } from "./constants";
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

export type UserTier = "free" | "plus" | "pro" | "payg";

export function getPlan(planId: string) {
  return BILLING_PLANS.find((plan) => plan.id === planId);
}

export async function ensureBillingPlans() {
  for (const plan of BILLING_PLANS) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: {
        name: plan.name,
        priceCents: plan.priceCents,
        credits: plan.credits,
        periodDays: plan.periodDays,
        active: true
      },
      create: {
        id: plan.id,
        name: plan.name,
        priceCents: plan.priceCents,
        credits: plan.credits,
        periodDays: plan.periodDays,
        active: true
      }
    });
  }
}

export async function getUserTier(userId: string): Promise<UserTier> {
  const now = new Date();
  const [subscription, paygBalance] = await Promise.all([
    prisma.subscription.findFirst({
      where: {
        userId,
        active: true,
        endsAt: { gt: now }
      },
      orderBy: { startsAt: "desc" }
    }),
    getCreditBalance(userId)
  ]);

  if (subscription?.planId === PRO_PLAN.id) return "pro";
  if (subscription?.planId === PLUS_PLAN.id) return "plus";
  return paygBalance > 0 ? "payg" : "free";
}

export function getTierReferenceLimit(tier: UserTier) {
  if (tier === "free") return 0;
  if (tier === "plus") return 2;
  return 3;
}

export function getTierMaxQuantity(tier: UserTier) {
  return tier === "plus" || tier === "pro" ? 2 : 1;
}

export async function addPaidCredits(userId: string, paymentId: string, planId: BillingPlanId | string) {
  const plan = getPlan(planId);
  if (!plan) throw new Error("未知套餐");

  const isPayg = PAYG_PLANS.some((item) => item.id === plan.id);
  const expiresAt = isPayg ? null : endOfMonth(new Date());
  const tx = [];

  if (!isPayg) {
    tx.push(
      prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          startsAt: new Date(),
          endsAt: addDays(new Date(), plan.periodDays),
          active: true
        }
      })
    );
  }

  tx.push(
    prisma.creditLedger.create({
      data: {
        userId,
        amount: plan.credits,
        source: isPayg ? CreditSource.PAY_AS_YOU_GO : CreditSource.SUBSCRIPTION,
        expiresAt,
        paymentId,
        note: isPayg ? `${plan.name} 积分，随买随用` : `${plan.name} 积分，月底清零`
      }
    })
  );

  await prisma.$transaction(tx);
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
