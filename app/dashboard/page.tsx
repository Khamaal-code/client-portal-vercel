import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value: unknown) {
  if (value === null || value === undefined) return "-";
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numberValue);
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.userId || !session.email) {
    redirect("/login");
  }

  const invoices = await prisma.invoice.findMany({
    where: { customerEmail: session.email },
    orderBy: [{ txnDate: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] px-8 py-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-[var(--text-muted)]">Invoice Portal</p>
            <h1 className="text-3xl">Your invoices</h1>
            <p className="text-sm text-[var(--text-muted)]">Signed status reflects paid invoices.</p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-[var(--text-muted)]">
            <span>{session.email}</span>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)]"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-6 shadow-sm">
          {invoices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-subtle)] px-6 py-12 text-center text-sm text-[var(--text-muted)]">
              No invoices found for this email yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--border-subtle)] text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  <tr>
                    <th className="py-3 pr-4">Invoice</th>
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Due</th>
                    <th className="py-3 pr-4">Total</th>
                    <th className="py-3 pr-4">Balance</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3">Signed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="text-sm">
                      <td className="py-4 pr-4 font-semibold">
                        {invoice.docNumber ?? invoice.qbInvoiceId}
                      </td>
                      <td className="py-4 pr-4">{formatDate(invoice.txnDate)}</td>
                      <td className="py-4 pr-4">{formatDate(invoice.dueDate)}</td>
                      <td className="py-4 pr-4">{formatCurrency(invoice.total)}</td>
                      <td className="py-4 pr-4">{formatCurrency(invoice.balance)}</td>
                      <td className="py-4 pr-4">{invoice.status ?? "-"}</td>
                      <td className="py-4">
                        <input
                          type="checkbox"
                          checked={invoice.paid}
                          readOnly
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
