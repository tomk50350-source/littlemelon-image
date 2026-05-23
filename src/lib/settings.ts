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
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpFrom?: string;
  hasSmtpPassword: boolean;
  alipayQr?: string;
  alipayAppId?: string;
  alipayPublicKey?: string;
  hasAlipayPrivateKey: boolean;
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
    smtpPort: Number(values.smtpPort || 465),
    smtpSecure: values.smtpSecure !== "false",
    smtpUser: values.smtpUser || "",
    smtpFrom: values.smtpFrom || "",
    hasSmtpPassword: Boolean(values.smtpPassword),
    alipayQr: values.alipayQr || "",
    alipayAppId: values.alipayAppId || process.env.ALIPAY_APP_ID || "",
    alipayPublicKey: values.alipayPublicKey || "",
    hasAlipayPrivateKey: Boolean(values.alipayPrivateKey || process.env.ALIPAY_PRIVATE_KEY)
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
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFrom?: string;
  alipayQr?: string;
  alipayAppId?: string;
  alipayPrivateKey?: string;
  alipayPublicKey?: string;
}) {
  await saveImageProviderSettings(input);
  const entries = [
    ["emailProvider", input.emailProvider],
    ["smtpHost", input.smtpHost],
    ["smtpPort", typeof input.smtpPort === "number" ? String(input.smtpPort) : undefined],
    ["smtpSecure", typeof input.smtpSecure === "boolean" ? String(input.smtpSecure) : undefined],
    ["smtpUser", input.smtpUser],
    ["smtpFrom", input.smtpFrom],
    ["alipayQr", input.alipayQr],
    ["alipayAppId", input.alipayAppId],
    ["alipayPublicKey", input.alipayPublicKey]
  ] as const;

  if (input.smtpPassword?.trim()) await upsertSetting("smtpPassword", input.smtpPassword.trim());
  if (input.alipayPrivateKey?.trim()) await upsertSetting("alipayPrivateKey", input.alipayPrivateKey.trim());
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
