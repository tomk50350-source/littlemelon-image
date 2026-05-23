import bcrypt from "bcryptjs";
import { CreditSource, Prisma, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const createUserSchema = z.object({
  email: z.string().email("请输入正确的邮箱").transform((value) => value.toLowerCase().trim()),
  name: z.string().trim().optional(),
  password: z.string().min(8, "密码至少 8 位"),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  emailVerified: z.boolean().default(true),
  initialCredits: z.coerce.number().min(0, "初始积分不能小于 0").max(100000, "初始积分过大").default(0)
});

export async function POST(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "参数错误" }, { status: 400 });
  }

  const { email, name, password, role, emailVerified, initialCredits } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "这个邮箱已经存在" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      passwordHash,
      role,
      emailVerified: emailVerified ? new Date() : null
    },
    select: { id: true, email: true, name: true, role: true, emailVerified: true, createdAt: true }
  });

  if (initialCredits > 0) {
    await prisma.creditLedger.create({
      data: {
        userId: user.id,
        amount: new Prisma.Decimal(initialCredits),
        source: CreditSource.ADMIN_ADJUSTMENT,
        note: `超级管理员 ${admin.email} 创建用户时发放积分`
      }
    });
  }

  return NextResponse.json({ user });
}
