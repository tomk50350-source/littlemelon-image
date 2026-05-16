import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.env.ADMIN_EMAIL || "admin@littlemelon.local";
const password = process.env.ADMIN_PASSWORD || "LittleMelon@2026";
const name = process.env.ADMIN_NAME || "LittleMelon 超级管理员";

try {
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date()
    },
    create: {
      email,
      name,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date()
    }
  });

  console.log(`Super admin ready: ${email}`);
  console.log(`Initial password: ${password}`);
} finally {
  await prisma.$disconnect();
}
