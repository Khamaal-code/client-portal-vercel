# client-portal

Customer invoice portal with email/password auth, email OTP verification, and QuickBooks invoice sync.

## Getting Started

1) Install dependencies

```bash
npm install
```

2) Configure environment variables

```bash
cp .env.example .env
```

3) Initialize database

```bash
npm run db:push
```

4) Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Required:
- `DATABASE_URL`
- `SESSION_PASSWORD`
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `QB_CLIENT_ID`
- `QB_CLIENT_SECRET`
- `QB_REALM_ID` (set automatically if you use `/api/qb/connect`)
- `QB_REDIRECT_URI` (optional; defaults to `/api/qb/callback`)

Optional:
- `QB_SCOPES` (defaults to `com.intuit.quickbooks.accounting`)
- `QB_SYNC_SECRET` (protects `/api/qb/sync`)

## QuickBooks Token Setup

This app expects a single QuickBooks company connection. Use `/api/qb/connect` to authorize QuickBooks and store tokens, then call `/api/qb/sync` to pull invoices.
