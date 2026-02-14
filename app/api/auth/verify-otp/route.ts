import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashOtp } from "@/lib/otp";

function redirectWithError(request: Request, email: string, message: string) {
  const url = new URL("/verify", request.url);
  if (email) {
    url.searchParams.set("email", email);
  }
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const emailRaw = String(formData.get("email") || "");
  const codeRaw = String(formData.get("code") || "");
  const email = emailRaw.trim().toLowerCase();
  const code = codeRaw.trim();

  if (!email || !code) {
    return redirectWithError(request, email, "Email and code are required.");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return redirectWithError(request, email, "Invalid verification code.");
  }

  const otp = await prisma.emailOtp.findFirst({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.codeHash !== hashOtp(code)) {
    return redirectWithError(request, email, "Invalid verification code.");
  }

  await prisma.$transaction([
    prisma.emailOtp.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set("verified", "1");
  return NextResponse.redirect(redirectUrl);
}
