import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "image" TEXT,
    "freeTrialUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId")`,
  `CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expires" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token")`,
  `CREATE TABLE IF NOT EXISTS "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "credits" DECIMAL NOT NULL,
    "periodDays" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" DATETIME NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "CreditLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "source" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "generationId" TEXT,
    "paymentId" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Generation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "sizeLabel" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "creditsCharged" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "imageUrl" TEXT,
    "originalUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Generation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "PromptGallery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "coverUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "sizeLabel" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sourceUrl" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerTradeNo" TEXT,
    "amountCents" INTEGER NOT NULL,
    "credits" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`
];

const prompts = [
  {
    id: "ecommerce-white-main",
    title: "电商白底主图",
    category: "电商产品图",
    tags: "白底,主图,高转化",
    sizeLabel: "2K",
    coverUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop",
    prompt: "为这款产品生成干净高级的电商白底主图，产品居中，边缘清晰，真实材质，高级摄影棚布光，保留产品原有颜色和结构。"
  },
  {
    id: "ecommerce-lifestyle",
    title: "生活方式场景图",
    category: "电商产品图",
    tags: "场景,生活方式,广告",
    sizeLabel: "2K",
    coverUrl: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=1200&auto=format&fit=crop",
    prompt: "把产品放入现代居家生活场景中，阳光自然，画面真实，有轻微景深，适合电商详情页首屏展示。"
  },
  {
    id: "ecommerce-detail-banner",
    title: "电商详情页横幅",
    category: "电商产品图",
    tags: "详情页,横幅,卖点",
    sizeLabel: "4K",
    coverUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop",
    prompt: "为产品生成电商详情页横幅，左侧展示产品，右侧留出卖点文案区域，背景干净高级，适合移动端详情页首屏。"
  },
  {
    id: "ecommerce-social-ad",
    title: "小红书投放图",
    category: "电商产品图",
    tags: "小红书,广告,种草",
    sizeLabel: "2K",
    coverUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop",
    prompt: "生成一张适合小红书投放的产品种草图，真实生活方式场景，画面干净明亮，主体突出，留出标题空间。"
  },
  {
    id: "ecommerce-premium-packshot",
    title: "高级包装摄影",
    category: "电商产品图",
    tags: "包装,摄影,高级",
    sizeLabel: "2K",
    coverUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200&auto=format&fit=crop",
    prompt: "生成高级包装产品摄影，微反射台面，柔和轮廓光，产品正面清晰，适合品牌官网和电商主图。"
  },
  {
    id: "retouch-clean",
    title: "局部瑕疵修复",
    category: "AI 修图",
    tags: "修复,去瑕疵,真实",
    sizeLabel: "1K",
    coverUrl: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1200&auto=format&fit=crop",
    prompt: "修复图片中的局部瑕疵和杂乱元素，保持主体不变，纹理自然，光影一致，不产生明显 AI 痕迹。"
  },
  {
    id: "retouch-expand-scene",
    title: "商品扩图补背景",
    category: "AI 修图",
    tags: "扩图,补背景,电商",
    sizeLabel: "2K",
    coverUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    prompt: "在不改变商品主体的前提下扩展画面边缘，补全自然背景和阴影，让图片适合电商横版广告位。"
  },
  {
    id: "retouch-style-match",
    title: "店铺风格统一",
    category: "AI 修图",
    tags: "风格统一,店铺,批量",
    sizeLabel: "1K",
    coverUrl: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=1200&auto=format&fit=crop",
    prompt: "把图片调整为统一店铺视觉风格，浅色背景，统一色温和阴影，保持商品真实结构和颜色。"
  },
  {
    id: "retouch-remove-clutter",
    title: "杂物清理修图",
    category: "AI 修图",
    tags: "去杂物,清理,真实",
    sizeLabel: "1K",
    coverUrl: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1200&auto=format&fit=crop",
    prompt: "清理画面中的杂物、污点和干扰元素，保留主体和真实光影，背景自然补全。"
  },
  {
    id: "retouch-background",
    title: "换背景保留主体",
    category: "AI 修图",
    tags: "换背景,主体保留,商业",
    sizeLabel: "2K",
    coverUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    prompt: "保留主体完全一致，将背景替换为高级商业摄影棚背景，柔和阴影，真实反射，适合广告投放。"
  },
  {
    id: "patent-line-drawing",
    title: "专利标准线条图",
    category: "专利制图标准",
    tags: "专利,线条图,黑白,结构",
    sizeLabel: "2K",
    coverUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200&auto=format&fit=crop",
    prompt: "将该产品绘制为专利附图风格的黑白线条图，白色背景，线条清晰连续，无阴影、无颜色、无材质渲染，突出外形结构和关键部件。"
  },
  {
    id: "patent-exploded-view",
    title: "爆炸分解线稿",
    category: "专利制图标准",
    tags: "专利,爆炸图,编号标注,机械",
    sizeLabel: "4K",
    coverUrl: "https://images.unsplash.com/photo-1581093458791-9d15482442f6?q=80&w=1200&auto=format&fit=crop",
    prompt: "生成专利附图中的爆炸分解线稿，各零部件沿装配方向分离排列，使用细黑线和编号引线标注关键部件，白底，无阴影，无写实纹理。"
  },
  {
    id: "patent-flow-diagram",
    title: "专利流程框图",
    category: "专利制图标准",
    tags: "专利,流程图,框图,步骤",
    sizeLabel: "1K",
    coverUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
    prompt: "根据方案描述生成专利申请常用流程框图，使用黑白矩形框、箭头和步骤编号，布局清晰，适合说明方法流程。"
  },
  {
    id: "patent-section-view",
    title: "剖视结构线稿",
    category: "专利制图标准",
    tags: "专利,剖视图,结构",
    sizeLabel: "2K",
    coverUrl: "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?q=80&w=1200&auto=format&fit=crop",
    prompt: "生成专利附图剖视结构线稿，使用清晰黑色轮廓线和局部剖面线，展示内部结构关系，白底无阴影。"
  },
  {
    id: "patent-numbered-parts",
    title: "部件编号标注图",
    category: "专利制图标准",
    tags: "专利,编号,标注",
    sizeLabel: "2K",
    coverUrl: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?q=80&w=1200&auto=format&fit=crop",
    prompt: "生成带编号引线的专利部件标注图，主体居中，部件轮廓清楚，编号整齐排列，使用黑白线条和白色背景。"
  },
  {
    id: "creative-poster",
    title: "新品促销海报",
    category: "创意灵感",
    tags: "海报,促销,中文排版",
    sizeLabel: "4K",
    coverUrl: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=1200&auto=format&fit=crop",
    prompt: "生成一张中文新品促销海报，主体醒目，留出清晰标题区，红色价格标签，现代商业设计，适合社交媒体发布。"
  },
  {
    id: "creative-chinese-poster",
    title: "中文视觉海报",
    category: "创意灵感",
    tags: "中文,海报,排版",
    sizeLabel: "4K",
    coverUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop",
    prompt: "生成中文视觉海报，标题区域清晰，主体具有冲击力，排版现代，适合社交媒体和活动宣传。"
  },
  {
    id: "creative-portrait-style",
    title: "写真人像风格",
    category: "创意灵感",
    tags: "人像,写真,摄影",
    sizeLabel: "2K",
    coverUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1200&auto=format&fit=crop",
    prompt: "生成高级写真人像摄影，真实肤色，柔和自然光，干净背景，适合头像和个人品牌视觉。"
  },
  {
    id: "creative-product-closeup",
    title: "写实产品特写",
    category: "创意灵感",
    tags: "写实,摄影,特写",
    sizeLabel: "2K",
    coverUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop",
    prompt: "超写实产品摄影特写，微距镜头，细节锐利，材质高级，背景干净，商业广告级布光。"
  }
];

for (const statement of statements) {
  await prisma.$executeRawUnsafe(statement);
}

await prisma.plan.upsert({
  where: { id: "monthly-99" },
  update: {},
  create: {
    id: "monthly-99",
    name: "LittleMelon Pro 月卡",
    priceCents: 990,
    credits: 100,
    periodDays: 30,
    updatedAt: new Date()
  }
});

for (const item of prompts) {
  await prisma.promptGallery.upsert({
    where: { id: item.id },
    update: { ...item, model: "GPT-Image-2", featured: true, updatedAt: new Date() },
    create: { ...item, model: "GPT-Image-2", featured: true, updatedAt: new Date() }
  });
}

await prisma.$disconnect();
console.log("SQLite database initialized.");
