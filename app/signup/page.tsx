type SignupPageProps = {
  searchParams?: { error?: string };
};

export default function SignupPage({ searchParams }: SignupPageProps) {
  const error = searchParams?.error;

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-8 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm text-[var(--text-muted)]">Invoice Portal</p>
          <h1 className="text-3xl">Create your account</h1>
          <p className="text-sm text-[var(--text-muted)]">
            We will verify your email before you can access invoices.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4" action="/api/auth/signup" method="post">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Send verification code
          </button>
        </form>

        <p className="mt-6 text-sm text-[var(--text-muted)]">
          Already verified?{" "}
          <a className="font-semibold text-[var(--accent)]" href="/login">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
