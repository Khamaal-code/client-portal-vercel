import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { getSession } from "@/lib/session";

function redirectWithError(request: Request, message: string) {
  const url = new URL("/login", request.url);
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

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return redirectWithError(request, "Invalid credentials.");
  }

  if (!user.emailVerifiedAt) {
    return redirectWithError(request, "Please verify your email before signing in.");
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return redirectWithError(request, "Invalid credentials.");
  }

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  await session.save();

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
