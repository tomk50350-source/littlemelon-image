import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const prompts = [
  {
    title: "电商白底主图",
    category: "电商产品图",
    tags: "白底,主图,高转化",
    sizeLabel: "2K",
    coverUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop",
    prompt:
      "为这款产品生成干净高级的电商白底主图，产品居中，边缘清晰，真实材质，高级摄影棚布光，保留产品原有颜色和结构。"
  },
  {
    title: "生活方式场景图",
    category: "电商产品图",
    tags: "场景,生活方式,广告",
    sizeLabel: "2K",
    coverUrl: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=1200&auto=format&fit=crop",
    prompt:
      "把产品放入现代居家生活场景中，阳光自然，画面真实，有轻微景深，适合电商详情页首屏展示。"
  },
  {
    title: "局部瑕疵修复",
    category: "AI 修图",
    tags: "修复,去瑕疵,真实",
    sizeLabel: "1K",
    coverUrl: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1200&auto=format&fit=crop",
    prompt:
      "修复图片中的局部瑕疵和杂乱元素，保持主体不变，纹理自然，光影一致，不产生明显 AI 痕迹。"
  },
  {
    title: "换背景保留主体",
    category: "AI 修图",
    tags: "换背景,主体保留,商业",
    sizeLabel: "2K",
    coverUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    prompt:
      "保留主体完全一致，将背景替换为高级商业摄影棚背景，柔和阴影，真实反射，适合广告投放。"
  },
  {
    title: "新品促销海报",
    category: "创意灵感",
    tags: "海报,促销,中文排版",
    sizeLabel: "4K",
    coverUrl: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=1200&auto=format&fit=crop",
    prompt:
      "生成一张中文新品促销海报，主体醒目，留出清晰标题区，红色价格标签，现代商业设计，适合社交媒体发布。"
  },
  {
    title: "写实产品特写",
    category: "创意灵感",
    tags: "写实,摄影,特写",
    sizeLabel: "2K",
    coverUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop",
    prompt:
      "超写实产品摄影特写，微距镜头，细节锐利，材质高级，背景干净，商业广告级布光。"
  }
];

async function main() {
  await prisma.plan.upsert({
    where: { id: "monthly-99" },
    update: {},
    create: {
      id: "monthly-99",
      name: "LittleMelon Pro 月卡",
      priceCents: 990,
      credits: 100,
      periodDays: 30
    }
  });

  for (const prompt of prompts) {
    await prisma.promptGallery.upsert({
      where: { id: prompt.title },
      update: prompt,
      create: { id: prompt.title, model: "GPT-Image-2", featured: true, ...prompt }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
