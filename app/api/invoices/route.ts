import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { customerEmail: session.email },
    orderBy: [{ txnDate: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ invoices });
}
