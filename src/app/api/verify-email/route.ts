import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email")?.toLowerCase() || "";

  if (!token || !email) {
    return NextResponse.redirect(`${origin}/login?verified=invalid`);
  }

  const record = await prisma.verificationToken.findUnique({
    where: {
      token
    }
  });

  if (!record || record.identifier !== email || record.expires < new Date()) {
    return NextResponse.redirect(`${origin}/login?verified=expired`);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() }
    }),
    prisma.verificationToken.delete({
      where: { token }
    })
  ]);

  return NextResponse.redirect(`${origin}/login?verified=1`);
}
