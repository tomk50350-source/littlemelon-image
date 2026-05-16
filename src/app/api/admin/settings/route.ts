import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { getAdminSettings, saveAdminSettings } from "@/lib/settings";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const settings = await getAdminSettings();
  return NextResponse.json({
    baseUrl: settings.baseUrl || "",
    model: settings.model || "gpt-image-2",
    maxConcurrentGenerations: settings.maxConcurrentGenerations,
    hasApiKey: Boolean(settings.apiKey),
    emailProvider: settings.emailProvider,
    smtpHost: settings.smtpHost || "",
    smtpUser: settings.smtpUser || "",
    smtpFrom: settings.smtpFrom || "",
    hasSmtpPassword: settings.hasSmtpPassword,
    wechatQr: settings.wechatQr || "",
    alipayQr: settings.alipayQr || ""
  });
}

export async function POST(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  await saveAdminSettings({
    apiKey: body.apiKey,
    baseUrl: body.baseUrl,
    model: body.model,
    maxConcurrentGenerations: Number(body.maxConcurrentGenerations || 2),
    emailProvider: body.emailProvider,
    smtpHost: body.smtpHost,
    smtpUser: body.smtpUser,
    smtpPassword: body.smtpPassword,
    smtpFrom: body.smtpFrom,
    wechatQr: body.wechatQr,
    alipayQr: body.alipayQr
  });

  return NextResponse.json({ ok: true });
}
