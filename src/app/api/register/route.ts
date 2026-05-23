import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (existing) {
    return NextResponse.json({ error: "这个邮箱已经注册过了" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash
    }
  });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: email.toLowerCase(),
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24)
    }
  });

  const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
  const verifyUrl = `${baseUrl}/api/verify-email?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`;
  const mail = await sendVerificationEmail({ email: email.toLowerCase(), verifyUrl });

  return NextResponse.json({
    ok: true,
    message: mail.sent ? "验证邮件已发送，请先验证邮箱后再登录。" : "验证链接已生成，请先验证邮箱后再登录。",
    verifyUrl: !mail.sent ? verifyUrl : undefined
  });
}
