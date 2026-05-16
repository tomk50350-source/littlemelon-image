import { prisma } from "./prisma";

export type ImageProviderSettings = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  maxConcurrentGenerations: number;
};

export type AdminSettings = ImageProviderSettings & {
  emailProvider: string;
  smtpHost?: string;
  smtpUser?: string;
  smtpFrom?: string;
  hasSmtpPassword: boolean;
  wechatQr?: string;
  alipayQr?: string;
};

const defaults: ImageProviderSettings = {
  apiKey: process.env.OPENAI_API_KEY,
  baseUrl: process.env.OPENAI_BASE_URL,
  model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
  maxConcurrentGenerations: Number(process.env.MAX_CONCURRENT_GENERATIONS || 2)
};

export async function getImageProviderSettings(): Promise<ImageProviderSettings> {
  const rows = await prisma.appSetting.findMany({
    where: {
      key: {
        in: ["openaiApiKey", "openaiBaseUrl", "openaiImageModel", "maxConcurrentGenerations"]
      }
    }
  });
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  return {
    apiKey: values.openaiApiKey || defaults.apiKey,
    baseUrl: values.openaiBaseUrl || defaults.baseUrl,
    model: values.openaiImageModel || defaults.model,
    maxConcurrentGenerations: Math.max(1, Number(values.maxConcurrentGenerations || defaults.maxConcurrentGenerations || 2))
  };
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const rows = await prisma.appSetting.findMany();
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const image = await getImageProviderSettings();
  return {
    ...image,
    emailProvider: values.emailProvider || "dev-link",
    smtpHost: values.smtpHost || "",
    smtpUser: values.smtpUser || "",
    smtpFrom: values.smtpFrom || "",
    hasSmtpPassword: Boolean(values.smtpPassword),
    wechatQr: values.wechatQr || "",
    alipayQr: values.alipayQr || ""
  };
}

export async function saveImageProviderSettings(input: {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  maxConcurrentGenerations?: number;
}) {
  const entries = [
    ["openaiBaseUrl", input.baseUrl?.trim()],
    ["openaiImageModel", input.model?.trim()],
    ["maxConcurrentGenerations", String(input.maxConcurrentGenerations || 2)]
  ] as const;

  if (input.apiKey?.trim()) {
    await upsertSetting("openaiApiKey", input.apiKey.trim());
  }

  for (const [key, value] of entries) {
    if (value) await upsertSetting(key, value);
  }
}

export async function saveAdminSettings(input: {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  maxConcurrentGenerations?: number;
  emailProvider?: string;
  smtpHost?: string;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFrom?: string;
  wechatQr?: string;
  alipayQr?: string;
}) {
  await saveImageProviderSettings(input);
  const entries = [
    ["emailProvider", input.emailProvider],
    ["smtpHost", input.smtpHost],
    ["smtpUser", input.smtpUser],
    ["smtpFrom", input.smtpFrom],
    ["wechatQr", input.wechatQr],
    ["alipayQr", input.alipayQr]
  ] as const;

  if (input.smtpPassword?.trim()) await upsertSetting("smtpPassword", input.smtpPassword.trim());
  for (const [key, value] of entries) {
    if (typeof value === "string") await upsertSetting(key, value.trim());
  }
}

async function upsertSetting(key: string, value: string) {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
}
