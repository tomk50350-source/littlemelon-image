import { CreditSource, GenerationStatus, UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { CREDIT_COSTS, FREE_TRIAL_SIZE, IMAGE_SIZES } from "@/lib/constants";
import {
  debitCredits,
  getCreditBalance,
  getTierMaxQuantity,
  getTierReferenceLimit,
  getUserTier,
  refundCredits
} from "@/lib/credits";
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

  const { prompt, scenario, mode, sizeLabel, referenceImages, quantity } = parsed.data;
  const cost = CREDIT_COSTS[sizeLabel];
  const size = IMAGE_SIZES[sizeLabel];
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const tier = await getUserTier(user.id);
  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
  const maxReferenceImages = isSuperAdmin ? 3 : getTierReferenceLimit(tier);
  const maxQuantity = isSuperAdmin ? 3 : getTierMaxQuantity(tier);

  if (referenceImages.length > maxReferenceImages) {
    return NextResponse.json({ error: `当前套餐最多上传 ${maxReferenceImages} 张参考图` }, { status: 403 });
  }

  if (quantity > maxQuantity) {
    return NextResponse.json({ error: `当前套餐最多一次生成 ${maxQuantity} 张图片` }, { status: 403 });
  }

  let usingFreeTrial = false;
  if (!user.freeTrialUsed && tier === "free") {
    if (sizeLabel !== FREE_TRIAL_SIZE || referenceImages.length > 0 || quantity > 1) {
      return NextResponse.json({ error: "免费试用仅支持生成 1 张 1K 图片，不能上传参考图" }, { status: 403 });
    }
    usingFreeTrial = true;
  } else {
    const totalCost = cost * quantity;
    const balance = await getCreditBalance(user.id);
    if (balance < totalCost) {
      return NextResponse.json({ error: "积分不足，请先购买会员或随买随用积分" }, { status: 402 });
    }
  }

  const chargedCredits = usingFreeTrial ? 0 : cost * quantity;

  const generation = await prisma.generation.create({
    data: {
      userId: user.id,
      mode,
      prompt,
      scenario,
      sizeLabel,
      width: size.width,
      height: size.height,
      creditsCharged: chargedCredits,
      quantity,
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
    await debitCredits(user.id, generation.id, chargedCredits);
  }

  try {
    const settings = await getImageProviderSettings();
    const results = [];
    for (let index = 0; index < quantity; index += 1) {
      const result = await runWithGenerationLimit(settings.maxConcurrentGenerations, () =>
        generateImage({ prompt, scenario, mode, sizeLabel, referenceImages })
      );
      results.push(result);
    }
    const primary = results[0];
    const updated = await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: GenerationStatus.SUCCEEDED,
        imageUrl: primary.imageUrl,
        originalUrl: primary.originalUrl,
        referenceImages: referenceImages.length ? JSON.stringify(referenceImages) : null
      }
    });

    return NextResponse.json({ generation: updated, outputs: results });
  } catch (error) {
    if (!usingFreeTrial) {
      await refundCredits(user.id, generation.id, chargedCredits);
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
