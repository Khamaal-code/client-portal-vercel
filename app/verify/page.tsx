type VerifyPageProps = {
  searchParams?: { email?: string; error?: string };
};

export default function VerifyPage({ searchParams }: VerifyPageProps) {
  const email = searchParams?.email ?? "";
  const error = searchParams?.error;

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-8 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm text-[var(--text-muted)]">Invoice Portal</p>
          <h1 className="text-3xl">Verify your email</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Enter the 6-digit code sent to {email || "your inbox"}.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4" action="/api/auth/verify-otp" method="post">
          <input type="hidden" name="email" value={email} />
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="code">
              Verification code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              required
              className="w-full rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm tracking-[0.3em] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Verify email
          </button>
        </form>

        <p className="mt-6 text-sm text-[var(--text-muted)]">
          Need a new code? Contact support to resend.
        </p>
      </div>
    </main>
  );
}
