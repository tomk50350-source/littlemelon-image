import { getServerSession } from "next-auth";
import { UserRole } from "@prisma/client";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true }
  });

  return user?.role === UserRole.SUPER_ADMIN ? user : null;
}
