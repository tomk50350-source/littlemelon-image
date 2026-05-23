import bcrypt from "bcryptjs";
import { CreditSource, Prisma, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const updateUserSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  emailVerified: z.boolean().optional(),
  password: z.string().min(8, "新密码至少 8 位").optional().or(z.literal("")),
  creditDelta: z.coerce.number().min(-100000, "扣减积分过大").max(100000, "发放积分过大").default(0),
  creditNote: z.string().trim().max(120, "备注最多 120 字").optional()
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "参数错误" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true }
  });

  if (!target) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  if (target.id === admin.id && parsed.data.role && parsed.data.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "不能降低当前超级管理员自己的权限" }, { status: 400 });
  }

  const tx: Prisma.PrismaPromise<unknown>[] = [];
  const updateData: Prisma.UserUpdateInput = {};

  if (parsed.data.role) updateData.role = parsed.data.role;
  if (typeof parsed.data.emailVerified === "boolean") {
    updateData.emailVerified = parsed.data.emailVerified ? new Date() : null;
  }
  if (parsed.data.password) {
    updateData.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  }

  if (Object.keys(updateData).length > 0) {
    tx.push(prisma.user.update({ where: { id }, data: updateData }));
  }

  if (parsed.data.creditDelta !== 0) {
    tx.push(
      prisma.creditLedger.create({
        data: {
          userId: id,
          amount: new Prisma.Decimal(parsed.data.creditDelta),
          source: CreditSource.ADMIN_ADJUSTMENT,
          note: parsed.data.creditNote || `超级管理员 ${admin.email} 手动调整积分`
        }
      })
    );
  }

  if (tx.length) await prisma.$transaction(tx);

  return NextResponse.json({ ok: true });
}
