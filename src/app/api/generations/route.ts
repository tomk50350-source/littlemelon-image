import { CreditSource, GenerationStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { CREDIT_COSTS, IMAGE_SIZES } from "@/lib/constants";
import { debitCredits, getCreditBalance, refundCredits } from "@/lib/credits";
import { runWithGenerationLimit } from "@/lib/generation-queue";
import { generateImage } from "@/lib/openai-image";
import { prisma } from "@/lib/prisma";
import { getImageProviderSettings } from "@/lib/settings";
import { generationSchema } from "@/lib/validators";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const generations = await prisma.generation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return NextResponse.json({ generations });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录后再生成图片" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = generationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { prompt, scenario, mode, sizeLabel, referenceImages } = parsed.data;
  const cost = CREDIT_COSTS[sizeLabel];
  const size = IMAGE_SIZES[sizeLabel];
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  let usingFreeTrial = false;
  if (!user.freeTrialUsed) {
    usingFreeTrial = true;
  } else {
    const balance = await getCreditBalance(user.id);
    if (balance < cost) {
      return NextResponse.json({ error: "积分不足，请先购买 9.9 元月卡" }, { status: 402 });
    }
  }

  const generation = await prisma.generation.create({
    data: {
      userId: user.id,
      mode,
      prompt,
      scenario,
      sizeLabel,
      width: size.width,
      height: size.height,
      creditsCharged: usingFreeTrial ? 0 : cost,
      status: GenerationStatus.PENDING
    }
  });

  if (usingFreeTrial) {
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { freeTrialUsed: true } }),
      prisma.creditLedger.create({
        data: {
          userId: user.id,
          amount: 0,
          source: CreditSource.FREE_TRIAL,
          generationId: generation.id,
          note: "注册用户 1 次免费试用"
        }
      })
    ]);
  } else {
    await debitCredits(user.id, generation.id, cost);
  }

  try {
    const settings = await getImageProviderSettings();
    const result = await runWithGenerationLimit(settings.maxConcurrentGenerations, () =>
      generateImage({ prompt, scenario, mode, sizeLabel, referenceImages })
    );
    const updated = await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: GenerationStatus.SUCCEEDED,
      imageUrl: result.imageUrl,
      originalUrl: result.originalUrl,
      referenceImages: referenceImages.length ? JSON.stringify(referenceImages) : null
      }
    });

    return NextResponse.json({ generation: updated });
  } catch (error) {
    if (!usingFreeTrial) {
      await refundCredits(user.id, generation.id, cost);
    }

    const message = normalizeGenerationError(error);
    const failed = await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: GenerationStatus.FAILED,
        errorMessage: message
      }
    });

    return NextResponse.json({ error: message, generation: failed }, { status: 500 });
  }
}

function normalizeGenerationError(error: unknown) {
  const raw = error instanceof Error ? error.message : "生成失败，请稍后再试";
  if (/403|blocked|request was blocked/i.test(raw)) {
    return "生成请求被上游接口拦截了。请换一个更安全/更具体的提示词，或稍后重试；本次失败不会扣积分。";
  }
  if (/timeout|ETIMEDOUT|ECONNRESET/i.test(raw)) {
    return "生成接口暂时超时了，请稍后重试；本次失败不会扣积分。";
  }
  return raw;
}
