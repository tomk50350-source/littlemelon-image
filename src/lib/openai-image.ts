import { IMAGE_SIZES, type ImageSizeLabel } from "./constants";
import { getImageProviderSettings } from "./settings";

type GenerateImageInput = {
  prompt: string;
  scenario: string;
  sizeLabel: ImageSizeLabel;
  mode: "text" | "reference" | "edit";
  referenceImages?: string[];
};

type ImageApiResponse = {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
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

  const baseUrl = normalizeOpenAIBaseUrl(settings.baseUrl);
  const model = settings.model || "gpt-image-2";
  const size = IMAGE_SIZES[input.sizeLabel].apiSize;
  const finalPrompt = buildPrompt(input);
  const referenceImages = input.referenceImages ?? [];

  const result =
    referenceImages.length > 0
      ? await requestImageEdits({
          apiKey: settings.apiKey,
          baseUrl,
          model,
          prompt: finalPrompt,
          size,
          quality: getOpenAIQuality(model, input.sizeLabel),
          referenceImages
        })
      : await requestImageGenerations({
          apiKey: settings.apiKey,
          baseUrl,
          body: {
            model,
            prompt: finalPrompt,
            size,
            quality: getOpenAIQuality(model, input.sizeLabel)
          }
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

function normalizeOpenAIBaseUrl(baseUrl?: string) {
  const clean = (baseUrl || "https://api.openai.com/v1").trim().replace(/\/+$/, "");
  if (/\/v\d+$/i.test(clean)) return clean;
  return `${clean}/v1`;
}

function getOpenAIQuality(model: string, sizeLabel: ImageSizeLabel) {
  if (model.includes("dall-e-3")) return sizeLabel === "1K" ? "standard" : "hd";
  if (/gpt-image/i.test(model)) return sizeLabel === "4K" ? "high" : "medium";
  return undefined;
}

async function requestImageGenerations({
  apiKey,
  baseUrl,
  body
}: {
  apiKey: string;
  baseUrl: string;
  body: Record<string, string | undefined>;
}) {
  const response = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(stripUndefined(body))
  });

  return parseImageResponse(response, "images/generations");
}

async function requestImageEdits({
  apiKey,
  baseUrl,
  model,
  prompt,
  size,
  quality,
  referenceImages
}: {
  apiKey: string;
  baseUrl: string;
  model: string;
  prompt: string;
  size: string;
  quality?: string;
  referenceImages: string[];
}) {
  const form = new FormData();
  form.append("model", model);
  form.append("prompt", prompt);
  form.append("size", size);
  if (quality && quality !== "standard" && quality !== "hd") form.append("quality", quality);

  referenceImages.forEach((image, index) => {
    const { blob, extension } = dataUrlToBlob(image);
    form.append("image[]", blob, `reference-${index + 1}.${extension}`);
  });

  const response = await fetch(`${baseUrl}/images/edits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: form
  });

  return parseImageResponse(response, "images/edits");
}

async function parseImageResponse(response: Response, endpoint: string): Promise<ImageApiResponse> {
  const text = await response.text();
  const data = parseJson(text);

  if (!response.ok) {
    const message = data?.error?.message || data?.error?.code || text || response.statusText;
    throw new Error(`OpenAI ${endpoint} API error (${response.status}): ${message}`);
  }

  if (!data) throw new Error(`OpenAI ${endpoint} 没有返回 JSON`);
  return data;
}

function parseJson(text: string): ImageApiResponse | null {
  try {
    return JSON.parse(text) as ImageApiResponse;
  } catch {
    return null;
  }
}

function stripUndefined(input: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
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

function dataUrlToBlob(dataUrl: string) {
  const [meta, content] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);base64/)?.[1] || "image/png";
  const extension = mime.split("/")[1] || "png";
  const buffer = Buffer.from(content || "", "base64");
  return {
    blob: new Blob([buffer], { type: mime }),
    extension
  };
}
