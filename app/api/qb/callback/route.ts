import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

function getRedirectUri(request: Request) {
  const envRedirect = process.env.QB_REDIRECT_URI;
  if (envRedirect) {
    return envRedirect;
  }

  const url = new URL(request.url);
  return `${url.origin}/api/qb/callback`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const realmId = url.searchParams.get("realmId");
  const state = url.searchParams.get("state");

  if (!code || !realmId || !state) {
    return NextResponse.json({ error: "Missing OAuth parameters" }, { status: 400 });
  }

  const session = await getSession();
  if (!session.qbState || session.qbState !== state) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const clientId = process.env.QB_CLIENT_ID;
  const clientSecret = process.env.QB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "QuickBooks client credentials missing" }, { status: 500 });
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(request),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json({ error: errorText }, { status: 400 });
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  const existing = await prisma.quickBooksToken.findFirst();

  if (existing) {
    await prisma.quickBooksToken.update({
      where: { id: existing.id },
      data: {
        realmId,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      },
    });
  } else {
    await prisma.quickBooksToken.create({
      data: {
        realmId,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      },
    });
  }

  session.qbState = undefined;
  await session.save();

  const redirectUrl = new URL("/dashboard", request.url);
  redirectUrl.searchParams.set("qb", "connected");
  return NextResponse.redirect(redirectUrl);
}
