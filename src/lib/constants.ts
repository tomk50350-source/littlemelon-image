export const APP_NAME = "LittleMelon Image";
export const APP_CN_NAME = "小西瓜 AI 图片";

export const CREDIT_COSTS = {
  "1K": 0.6,
  "2K": 1,
  "4K": 2
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

export const MONTHLY_PLAN = {
  id: "monthly-99",
  name: "LittleMelon Pro 月卡",
  priceCents: 990,
  credits: 100,
  periodDays: 30
};
