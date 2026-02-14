import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";

function getRedirectUri(request: Request) {
  const envRedirect = process.env.QB_REDIRECT_URI;
  if (envRedirect) {
    return envRedirect;
  }

  const url = new URL(request.url);
  return `${url.origin}/api/qb/callback`;
}

function getScopes() {
  return process.env.QB_SCOPES || "com.intuit.quickbooks.accounting";
}

export async function GET(request: Request) {
  const clientId = process.env.QB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "QB_CLIENT_ID is not set" }, { status: 500 });
  }

  const session = await getSession();
  const state = crypto.randomUUID();
  session.qbState = state;
  await session.save();

  const redirectUri = getRedirectUri(request);
  const scopes = getScopes();

  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return NextResponse.redirect(url);
}
