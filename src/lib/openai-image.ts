import OpenAI from "openai";
import { IMAGE_SIZES, type ImageSizeLabel } from "./constants";
import { getImageProviderSettings } from "./settings";

type GenerateImageInput = {
  prompt: string;
  scenario: string;
  sizeLabel: ImageSizeLabel;
  mode: "text" | "reference" | "edit";
  referenceImages?: string[];
};

const sampleImages: Record<ImageSizeLabel, string> = {
  "1K": "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1024&auto=format&fit=crop",
  "2K": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1600&auto=format&fit=crop",
  "4K": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1800&auto=format&fit=crop"
};

export async function generateImage(input: GenerateImageInput) {
  const settings = await getImageProviderSettings();
  if (!settings.apiKey) {
    return {
      imageUrl: sampleImages[input.sizeLabel],
      originalUrl: sampleImages[input.sizeLabel],
      provider: "mock"
    };
  }

  const client = new OpenAI({
    apiKey: settings.apiKey,
    baseURL: settings.baseUrl || undefined
  });
  const size = IMAGE_SIZES[input.sizeLabel].apiSize;
  const model = settings.model || "gpt-image-2";
  const finalPrompt = buildPrompt(input);
  const referenceImages = input.referenceImages ?? [];

  const result = referenceImages.length > 0 && "edit" in client.images
    ? await client.images.edit({
        model,
        image: referenceImages.map((image) => dataUrlToFile(image)),
        prompt: finalPrompt,
        size: size as never
      } as never)
    : await client.images.generate({
        model,
        prompt: finalPrompt,
        size: size as never,
        quality: input.sizeLabel === "4K" ? "high" : "medium"
      });

  const first = result.data?.[0];
  const url = first?.url;
  const b64 = first?.b64_json;

  if (url) {
    return { imageUrl: url, originalUrl: url, provider: "openai" };
  }

  if (b64) {
    return {
      imageUrl: `data:image/png;base64,${b64}`,
      originalUrl: `data:image/png;base64,${b64}`,
      provider: "openai"
    };
  }

  throw new Error("OpenAI 没有返回图片结果");
}

function buildPrompt(input: GenerateImageInput) {
  const referenceGuide =
    input.referenceImages && input.referenceImages.length > 0
      ? `\n用户上传了 ${input.referenceImages.length} 张参考图。请综合参考图的主体、风格、材质、构图或需要修改的区域，生成新的图片；不要逐字复刻水印、无关文字或低质量缺陷。`
      : "";
  const scenarioGuide =
    input.scenario === "ecommerce"
      ? "这是电商产品图任务，优先保证主体真实、商品边缘清晰、适合淘宝/小红书/独立站展示。"
      : input.scenario === "retouch"
        ? "这是 AI 修图任务，保持主体身份、结构、材质和光影一致，不要产生明显 AI 痕迹。"
        : input.scenario === "patent"
          ? "这是专利制图标准线条图任务，输出黑白线稿，白色背景，清晰连续线条，无阴影、无材质渲染、无艺术风格。优先表现结构关系，可使用编号标注、剖视、爆炸分解或流程框图风格，整体应接近专利附图。"
          : "这是创意图片任务，画面要有完整构图、商业质感和清晰视觉中心。";

  return `${scenarioGuide}${referenceGuide}\n尺寸档位：${input.sizeLabel}。\n用户需求：${input.prompt}`;
}

function dataUrlToFile(dataUrl: string) {
  const [meta, content] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);base64/)?.[1] || "image/png";
  const extension = mime.split("/")[1] || "png";
  const buffer = Buffer.from(content || "", "base64");
  return new File([buffer], `reference.${extension}`, { type: mime });
}
