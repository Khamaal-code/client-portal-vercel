import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

function redirectWithError(request: Request, message: string) {
  const url = new URL("/signup", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const emailRaw = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const email = emailRaw.trim().toLowerCase();

  if (!email || !password) {
    return redirectWithError(request, "Email and password are required.");
  }

  if (password.length < 8) {
    return redirectWithError(request, "Password must be at least 8 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing && existing.emailVerifiedAt) {
    return redirectWithError(request, "An account already exists. Please sign in.");
  }

  const { code, expiresAt } = generateOtp();

  if (!existing) {
    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return redirectWithError(request, "Unable to create account.");
  }

  await prisma.emailOtp.create({
    data: {
      userId: user.id,
      codeHash: hashOtp(code),
      expiresAt,
    },
  });

  await sendOtpEmail(email, code);

  const redirectUrl = new URL("/verify", request.url);
  redirectUrl.searchParams.set("email", email);
  return NextResponse.redirect(redirectUrl);
}
