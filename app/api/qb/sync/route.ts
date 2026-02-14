import { NextResponse } from "next/server";
import { syncInvoices } from "@/lib/quickbooks";

function isAuthorized(request: Request) {
  const secret = process.env.QB_SYNC_SECRET;
  if (!secret) {
    return true;
  }

  const header = request.headers.get("x-sync-secret");
  if (header === secret) {
    return true;
  }

  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  return querySecret === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncInvoices();
  return NextResponse.json(result);
}
