import { prisma } from "@/lib/db";

const QB_BASE_URL = "https://quickbooks.api.intuit.com/v3/company";
const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

type QuickBooksInvoice = {
  Id: string;
  DocNumber?: string;
  TxnDate?: string;
  DueDate?: string;
  TotalAmt?: number;
  Balance?: number;
  BillEmail?: { Address?: string };
  EmailStatus?: string;
};


function getClientCredentials() {
  const clientId = process.env.QB_CLIENT_ID;
  const clientSecret = process.env.QB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("QuickBooks client credentials are not set");
  }
  return { clientId, clientSecret };
}

async function getStoredToken() {
  const token = await prisma.quickBooksToken.findFirst();
  if (!token) {
    throw new Error("QuickBooks token not found. Seed QuickBooksToken first.");
  }
  return token;
}

async function refreshTokenIfNeeded() {
  const token = await getStoredToken();
  const isExpired = token.expiresAt.getTime() <= Date.now() + 60 * 1000;
  if (!isExpired) {
    return token;
  }

  const { clientId, clientSecret } = getClientCredentials();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QuickBooks token refresh failed: ${errorText}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  return prisma.quickBooksToken.update({
    where: { id: token.id },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
    },
  });
}

export async function fetchQuickBooksInvoices(): Promise<QuickBooksInvoice[]> {
  const token = await refreshTokenIfNeeded();
  const realmId = token.realmId;

  const query = "select Id, DocNumber, TxnDate, DueDate, TotalAmt, Balance, BillEmail, EmailStatus from Invoice";
  const url = `${QB_BASE_URL}/${realmId}/query?query=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QuickBooks invoice fetch failed: ${errorText}`);
  }

  const data = (await response.json()) as {
    QueryResponse?: { Invoice?: QuickBooksInvoice[] };
  };

  return data.QueryResponse?.Invoice ?? [];
}

export async function syncInvoices() {
  const invoices = await fetchQuickBooksInvoices();
  let upserted = 0;

  for (const invoice of invoices) {
    const paid = typeof invoice.Balance === "number" ? invoice.Balance === 0 : false;
    const customerEmail = invoice.BillEmail?.Address
      ? invoice.BillEmail.Address.trim().toLowerCase()
      : null;

    await prisma.invoice.upsert({
      where: { qbInvoiceId: invoice.Id },
      update: {
        docNumber: invoice.DocNumber ?? null,
        customerEmail,
        total: invoice.TotalAmt ?? null,
        balance: invoice.Balance ?? null,
        txnDate: invoice.TxnDate ? new Date(invoice.TxnDate) : null,
        dueDate: invoice.DueDate ? new Date(invoice.DueDate) : null,
        status: invoice.EmailStatus ?? null,
        paid,
      },
      create: {
        qbInvoiceId: invoice.Id,
        docNumber: invoice.DocNumber ?? null,
        customerEmail,
        total: invoice.TotalAmt ?? null,
        balance: invoice.Balance ?? null,
        txnDate: invoice.TxnDate ? new Date(invoice.TxnDate) : null,
        dueDate: invoice.DueDate ? new Date(invoice.DueDate) : null,
        status: invoice.EmailStatus ?? null,
        paid,
      },
    });
    upserted += 1;
  }

  return { count: upserted };
}
