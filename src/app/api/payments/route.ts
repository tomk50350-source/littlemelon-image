import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { MONTHLY_PLAN } from "@/lib/constants";
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

  await prisma.plan.upsert({
    where: { id: MONTHLY_PLAN.id },
    update: {},
    create: MONTHLY_PLAN
  });

  const payment = await prisma.payment.create({
    data: {
      userId: session.user.id,
      planId: MONTHLY_PLAN.id,
      provider: parsed.data.provider,
      amountCents: MONTHLY_PLAN.priceCents,
      credits: MONTHLY_PLAN.credits
    }
  });

  const checkout = await createPayment(parsed.data.provider, payment.id);

  return NextResponse.json({ payment, checkout });
}
