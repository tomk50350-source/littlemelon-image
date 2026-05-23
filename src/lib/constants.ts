export const APP_NAME = "LittleMelon Image";
export const APP_CN_NAME = "小西瓜 AI 图片";

export const CREDIT_COSTS = {
  "1K": 1,
  "2K": 2,
  "4K": 4
} as const;

export const IMAGE_SIZES = {
  "1K": { width: 1024, height: 1024, apiSize: "1024x1024" },
  "2K": { width: 2048, height: 2048, apiSize: "2048x2048" },
  "4K": { width: 3840, height: 2160, apiSize: "3840x2160" }
} as const;

export type ImageSizeLabel = keyof typeof IMAGE_SIZES;

export const SCENARIOS = [
  {
    id: "ecommerce",
    title: "电商产品图",
    description: "主图、详情图、背景替换、场景合成、促销海报",
    presets: ["白底主图", "生活方式场景", "详情页横图", "新品促销海报"]
  },
  {
    id: "retouch",
    title: "AI 修图",
    description: "局部修改、去瑕疵、换背景、扩图、风格统一",
    presets: ["去除瑕疵", "换背景", "局部重绘", "统一店铺风格"]
  },
  {
    id: "patent",
    title: "专利制图标准",
    description: "黑白线条图、结构示意、爆炸图、编号标注、流程框图",
    presets: ["专利线条图", "结构示意图", "爆炸分解图", "编号标注图"]
  },
  {
    id: "creative",
    title: "创意灵感",
    description: "海报、摄影、插画、社媒配图",
    presets: ["写实摄影", "中文海报", "插画概念", "社媒封面"]
  }
] as const;

export const PLUS_PLAN = {
  id: "plus-990",
  name: "Plus 月卡",
  priceCents: 990,
  credits: 100,
  periodDays: 30
};

export const PRO_PLAN = {
  id: "pro-9900",
  name: "Pro 月卡",
  priceCents: 9900,
  credits: 1500,
  periodDays: 30
};

export const PAYG_PLANS = [
  {
    id: "payg-1k-50",
    name: "随买随用 1K",
    priceCents: 50,
    credits: 1,
    periodDays: 0,
    sizeLabel: "1K"
  },
  {
    id: "payg-2k-100",
    name: "随买随用 2K",
    priceCents: 100,
    credits: 2,
    periodDays: 0,
    sizeLabel: "2K"
  },
  {
    id: "payg-4k-200",
    name: "随买随用 4K",
    priceCents: 200,
    credits: 4,
    periodDays: 0,
    sizeLabel: "4K"
  }
] as const;

export const BILLING_PLANS = [PLUS_PLAN, PRO_PLAN, ...PAYG_PLANS] as const;

export type BillingPlanId = (typeof BILLING_PLANS)[number]["id"];

export const FREE_TRIAL_SIZE: ImageSizeLabel = "1K";
export const FREE_GALLERY_LIMIT = 200;
export const PUBLIC_GALLERY_LIMIT = 60;
export const MEMBER_FAVORITE_LIMIT = 100;
