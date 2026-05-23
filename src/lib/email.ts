import { getAdminSettings } from "./settings";

export async function sendVerificationEmail({ email, verifyUrl }: { email: string; verifyUrl: string }) {
  const settings = await getAdminSettings();
  if (settings.emailProvider !== "smtp") {
    return { sent: false, verifyUrl };
  }

  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpFrom) {
    return { sent: false, verifyUrl };
  }

  // The production SMTP sender is intentionally kept behind dynamic import.
  // If nodemailer is not installed, registration still works with the local verify link.
  try {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort || 465,
      secure: settings.smtpSecure ?? true,
      auth: {
        user: settings.smtpUser,
        pass: await getSmtpPassword()
      }
    });

    await transport.sendMail({
      from: settings.smtpFrom,
      to: email,
      subject: "验证你的 LittleMelon Image 邮箱",
      text: `点击链接完成邮箱验证：${verifyUrl}`,
      html: `<p>点击下面链接完成邮箱验证：</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
    });

    return { sent: true };
  } catch {
    return { sent: false, verifyUrl };
  }
}

async function getSmtpPassword() {
  const { prisma } = await import("./prisma");
  const row = await prisma.appSetting.findUnique({ where: { key: "smtpPassword" } });
  return row?.value || "";
}
