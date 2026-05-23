import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { PLUS_PLAN } from "@/lib/constants";
import { ensureBillingPlans, getPlan } from "@/lib/credits";
import { createPayment } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  await ensureBillingPlans();
  const plan = getPlan(parsed.data.planId) ?? PLUS_PLAN;

  const payment = await prisma.payment.create({
    data: {
      userId: session.user.id,
      planId: plan.id,
      provider: parsed.data.provider,
      amountCents: plan.priceCents,
      credits: plan.credits
    }
  });

  const checkout = await createPayment(parsed.data.provider, payment.id, plan.id);

  return NextResponse.json({ payment, checkout });
}
