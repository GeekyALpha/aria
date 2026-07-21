# Aria — Autonomous Accounts-Receivable Agent
**Pinch Payments "Pinch Me! I Want 50K" Hackathon · Solo build · Next.js + TS + Vercel**

> Final decisions: agent brain = **OpenAI** (structured outputs); DB = **Supabase Postgres via Supabase MCP** (self-provisioned by the build agent).

---

## 1. One-liner
Every business has a person whose whole job is begging clients to pay. **Aria is the AI clerk that does it autonomously** — reads overdue invoices, negotiates, offers instalments, collects via Pinch, and reconciles. Collects ~40% faster and never takes it personally.

**Wedge:** accounts receivable. **Prize:** the autonomous finance department. Comparables: Billtrust (~$1.7B), Paystand, Tesorio + agent comps (Sierra, Decagon).

## 2. The problem (quantified)
- AU SMBs owed **tens of billions** in overdue receivables.
- Average invoice paid **45+ days late**; typical small business has **$50k+ stuck**.
- Late payment = **#1 cause of SMB cash-flow death**. Chasing invoices = most hated, lowest-leverage work — textbook "AI agent replaces a role."

## 3. The product (AR loop, automated)
1. **Sees** overdue invoices.
2. **Decides** action per debtor — tone/channel/timing/terms (OpenAI, rule-guarded).
3. **Acts:** sends email/SMS/WhatsApp; negotiates.
4. **Collects:** Pinch **Payment Link**, a **Plan** (instalments/"Pay-in-4" = embedded BNPL), or scheduled debit.
5. **Handles failure:** on `dishonoured` webhook, retries/escalates (Nonce prevents double-charge).
6. **Reconciles** via **Transfers/line items**.
7. **Reports:** cash recovered, DSO cut, hours saved.

## 4. Demo "realness backbone" (must work for real in sandbox)
- OpenAI agent → **guarded JSON decision**.
- **Pinch Plan** (percentage "Pay-in-3") → **Subscription** with invoice total.
- **Pinch Payment Link** for instalment 1 → test-card **realtime** payment (**Nonce**-protected).
- **Signed webhook** (`pinch-signature` + `whsec_...`) → marks paid → reconciled via **Transfers**.

## 5. Ruthless scope — DO NOT build
- ❌ Real Xero/MYOB OAuth (mock button).
- ❌ Real email/SMS (simulate in **Debtor Inbox**).
- ❌ Multi-tenant auth / KYC / full reconciliation engine (pre-create ONE Managed Merchant).

## 6. Architecture
```
Next.js (App Router) — one repo: UI + API routes
├─ /app                UI (Dashboard, Invoice detail, Debtor Inbox, Pay page)
├─ /api/agent/decide   OpenAI structured output → guarded JSON action
├─ /api/agent/execute  action → Pinch calls (deterministic)
├─ /api/webhooks/pinch verify signature → update status
└─ /lib/pinch          typed REST client (OAuth token cache)
State: Supabase Postgres (3 tables) via Supabase MCP · Agent: OpenAI JSON mode
```

## 7. Data model (3 tables)
- `invoices` — id, debtor_name, debtor_email, amount_cents, due_date, status, xero_ref?, pinch_payment_id?, created_at
- `conversations` — id, invoice_id, role(agent/debtor), channel, content, created_at
- `actions` — id, invoice_id, type, payload, plan_id?, payment_link_id?, created_at

## 8. "Pay-in-3" mechanics (elegant + premium)
ONE reusable **percentage Plan** (33/33/34% @ day 0/14/28) → `requiresTotalAmount=true`. Per offer: **create Subscription** with invoice total → 3 scheduled payments. **Instalment 1** = **Payment Link** paid live (realtime wow); 2–3 scheduled. **Surcharging** ON (pass fee to debtor). **Nonce** on realtime (safe double-tap).

## 9. Validate FIRST (Friday night)
Reference pages to check before locking design:
- `create-payment-link` · `realtime-payment` (test cards) · `create-or-update-webhook` + webhooks guide (signature, skew) · `save-plan` (percentage, TotalAmount, offsets) · `sdk` (official JS/Node SDK?).

## 10. Weekend schedule (solo, ~25h)
- **Fri (2–3h):** Pinch sandbox, keys, create 1 Managed Merchant, webhook secret; Next.js+Tailwind+shadcn+Framer init; Supabase via MCP (3 tables); OpenAI key. Prove 1 Pinch call + 1 OpenAI structured call.
- **Sat (10–12h):** AM ingest+parse+seed; PM `/agent/decide` + `/agent/execute` + Plan/Subscription + Payment Link + Pay page; Eve webhook + signature verify + first end-to-end happy path.
- **Sun (10h):** AM negotiation + dishonour/retry + reconciliation + metrics; PM polish, re-seed perfect data, rehearse demo 5×, build deck, record 90-sec screencast backup.

## 11. Demo script (90 seconds)
1. Open overdue invoice **$4,800, 14 days late**. Agent **reasoning card**: *"First-time debtor, good history → firm-but-friendly, offer terms."*
2. Agent drafts email. Type reply in Debtor Inbox: *"I can't pay it all this month."*
3. Agent counters: **Pay-in-3 plan** (live Plan + Subscription) → **Payment Link** for $1,600.
4. Open link → pay test card → ✅. **Webhook fires live** → invoice flips **Paid**, reconciled. Metrics tick: *+$4,800 · DSO −32 days · 4.5 hrs saved*.
5. Punchline: *"That was a person's worst job — done in 90 seconds, autonomously."*

## 12. Business model
SaaS **$49–199/mo** + **1–2% performance take-rate** on recovered overdue cash + **financing spread** on instalment plans.

## 13. Pitch — 10-slide spine
1 Title · 2 Problem · 3 Why now · 4 Demo · 5 How it works · 6 Wedge→Prize · 7 Market · 8 Business model · 9 Why Pinch · 10 Vision.

**3-sentence spine:** *Every business has a person whose whole job is begging clients to pay — it's the most hated job in small business and it's choking their cash. Aria is the AI clerk that does it autonomously, collects 40% faster, and never takes it personally — on Pinch's rails. The wedge is receivables; the prize is the autonomous finance department — a billion-dollar market nobody owns.*

## 14. Judging-criteria map
- **Problem/impact:** universal, quantified.
- **Deep Pinch use:** Managed Merchants + Plans(%+TotalAmount) + Subscriptions + Payment Links + Realtime + Surcharging + Nonce + Webhooks + Transfers.
- **Innovation:** first autonomous AI AR agent on AU rails + embedded micro-BNPL.
- **Execution:** live webhook, real sandbox payments.
- **Commercial:** recurring + take-rate, wedge→expansion.
- **Pitch/demo:** 90-sec "wow".

## 15. Solo risks + mitigations
1. OpenAI off-script → zod-guarded action schema + pre-seeded "safe" debtor + deterministic fallback.
2. Webhook late → poll `events`; pre-stage reconciled state.
3. Sandbox card fumble → test card in clipboard + **Nonce** + **screencast backup**.

---

## 16. UI / DESIGN SYSTEM — "mesmerizing" (judges see this first)
**Concept:** calm, confident **finance control room** — antithesis of chaotic spreadsheets. Dark, glassy, premium, alive with motion. The AI must *visibly think*.

**Palette**
- Background: charcoal/navy `#0B0F1A` → `#111827` gradient.
- Surfaces: glassmorphism — `rgba(255,255,255,0.04)` + 1px `rgba(255,255,255,0.08)` border + soft blur.
- Accent (money/confidence): emerald `#34D399`.
- Overdue/alert: coral `#FF5263`.
- Text: `#F8FAFC` / muted `#94A3B8`.

**Type:** Geist or Inter — large confident headlines, generous spacing, **tabular numerals** for money.

**Signature moments (the "wow")**
- **Live hero counter:** "Cash recovered today: $X" ticking up (count-up animation).
- **The agent "thinking":** a live reasoning stream — typewriter/particle effect showing the LLM thought process as it decides action + tone. *Judges must SEE intelligence happen.*
- **Invoice flips to Paid:** 3D card flip + emerald glow + micro-confetti + amount flies into the "recovered" total.
- **Debtor Inbox:** chat UI like iMessage/Slack — agent vs debtor bubbles, typing indicator while "negotiating".
- **Metrics dashboard:** animated count-ups + smooth chart draws (recovered $, DSO drop, hours saved).

**Tech:** Tailwind + **shadcn/ui** + **Framer Motion** + **Recharts** + canvas/**react-tsparticles** for the thinking effect + **Lottie** for success. Respect `prefers-reduced-motion`.

**Mood refs:** Linear · Stripe dashboard · Vercel marketing motion · Arc browser.

---

## 17. Repo structure (proposed)
```
aria/
├─ app/
│  ├─ page.tsx                 # Dashboard (hero counter, metrics, invoice list)
│  ├─ invoices/[id]/page.tsx   # Invoice detail + agent reasoning + Debtor Inbox
│  ├─ pay/[linkId]/page.tsx    # Customer-facing payment page (realtime)
│  └─ api/
│     ├─ agent/decide/route.ts   # OpenAI structured output → zod action
│     ├─ agent/execute/route.ts
│     └─ webhooks/pinch/route.ts
├─ lib/{pinch.ts, agent.ts, db.ts}
├─ components/                 # ui, motion, charts
├─ seed/                       # 3 compelling demo debtors
└─ idea.md
```
