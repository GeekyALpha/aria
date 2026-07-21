# Aria

**The autonomous AI clerk that reads overdue invoices, negotiates with debtors, and collects payment on Pinch — so a human never has to chase an unpaid invoice again.**

Aria runs the full accounts-receivable loop autonomously: it sees overdue invoices, decides the optimal recovery action per debtor, drafts and negotiates the message, then collects via a Pinch **Pay-in-3** instalment plan and reconciles the moment payment lands.

> **Live demo:** https://aria-eight-plum.vercel.app &nbsp;·&nbsp; **Repo:** https://github.com/GeekyALpha/aria

---

## How it works

1. **Sees** an overdue invoice.
2. **Decides** the best action per debtor — tone, channel, and terms — using OpenAI **structured outputs** (rule-guarded, with a deterministic fallback).
3. **Negotiates** in a chat inbox: when a debtor says they can't pay in full, Aria counters with terms.
4. **Collects** through Pinch — a reusable percentage **Plan**, a **Subscription** with the invoice total, and a live **Payment Link** for instalment 1.
5. **Reconciles** the instant a signed Pinch **webhook** confirms payment — the invoice flips to Paid and the metrics tick up.

Everything runs end-to-end on real Pinch sandbox rails (real Plans, Subscriptions, Payment Links, webhooks, and money movement).

### Pinch primitives used

| Area | Pinch capability |
|---|---|
| Auth | OAuth2 client-credentials, cached bearer token |
| Debtor | `Payer` + bank `Source` |
| Pay-in-3 | percentage `Plan` (`requiresTotalAmount`) + `Subscription` with invoice total |
| Live collect | `Payment Link` → realtime card payment |
| Reconcile | signed `webhook` (HMAC `pinch-signature`, skew-checked) → invoice marked Paid |
| Audit | `Transfers` / events |

## Tech stack

**Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Framer Motion
**Agent:** OpenAI gpt-4o · structured outputs · Zod-guarded action schema
**Payments:** Pinch (typed REST client + HMAC webhook verification)
**Data:** Supabase Postgres (3 tables, RLS-enabled, `security_invoker` metrics view)
**Deploy:** Vercel

## Architecture

```
app/
  page.tsx                 Dashboard — hero counter, metrics, work queue
  invoices/[id]/page.tsx   Invoice detail — 3D flip card, live reasoning, debtor inbox, Pay-in-3
  pay/[linkId]/page.tsx    Customer-facing payment page (realtime)
  api/
    ingest · seed · reply · invoices · invoices/[id]
    agent/decide           OpenAI structured output → zod-guarded action (+ fallback)
    agent/execute          Payer → Plan → Subscription → Payment Link
    webhooks/pinch         verify pinch-signature → reconcile
lib/
  db.ts · types.ts · status.ts · reconcile.ts
  pinch/   types · auth (token cache) · client · webhook (HMAC)
  agent/   schemas (zod) · prompt · openai (structured output)
components/  shell · dashboard · invoice · pay · motion
supabase/migrations/  0001_init.sql · 0002_security.sql
```

## Getting started

### Prerequisites
- Node.js 20.9+ · npm
- A Pinch sandbox account (Application ID + Secret Key), an OpenAI API key, and a Supabase project.

### Setup
```bash
npm install
cp .env.example .env.local   # then fill in the values below
```

### Environment (`.env.local`)
| Variable | Purpose |
|---|---|
| `PINCH_API_BASE` | `https://api.getpinch.com.au/test/` (sandbox) |
| `PINCH_CLIENT_ID` / `PINCH_SECRET_KEY` | Pinch Application ID + Secret (OAuth) |
| `PINCH_WEBHOOK_SECRET` | `whsec_…` from your registered webhook endpoint |
| `PINCH_PLAN_ID` | Optional — reused Pay-in-3 plan id (auto-created if blank) |
| `OPENAI_API_KEY` | gpt-4o |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase project URL + service-role key |

### Database
Run the SQL in [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) then [`0002_security.sql`](./supabase/migrations/0002_security.sql) against your Supabase project (SQL editor or `supabase db push`). This creates the `invoices`, `conversations`, and `actions` tables plus the `dashboard_metrics` view, and enables RLS.

### Run
```bash
npm run dev
```
Seed demo debtors (one-time):
```bash
curl -X POST http://localhost:3000/api/seed
```
Open http://localhost:3000 → pick an invoice → **Run Aria** → reply in the inbox → **Set up Pay-in-3** → **Collect instalment 1** → pay with test card `4242 4242 4242 4242`.

### Deploy
The app deploys to Vercel as a standard Next.js project. Add the same environment variables to the project, set the framework to **Next.js**, and register your webhook URL (`https://<your-domain>/api/webhooks/pinch`) in the Pinch dashboard.

## Scope notes

Per the build brief, the following are intentionally mocked / roadmap (not part of this demo): real Xero/MYOB OAuth ingest, real email/SMS/WhatsApp delivery, and multi-tenant auth. The typed adapters are designed so each is an afternoon against the existing interfaces.
