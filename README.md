# Aria

Autonomous AI accounts-receivable agent for the Pinch Payments "Pinch Me! I Want 50K" hackathon.

> **Build agent: read [`idea.md`](./idea.md) FIRST.** It contains the full spec — architecture, data model, "Pay-in-3" mechanics, weekend schedule, demo script, and the UI design system.

**Stack:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Framer Motion · **Agent:** OpenAI (structured outputs) · **DB:** Supabase Postgres (via Supabase MCP) · **Payments:** Pinch API (typed REST client).

**Start here:** scaffold the repo, provision Supabase (3 tables) via MCP, build the typed Pinch client, and implement one happy path end-to-end (paste invoice → agent decides → Pinch Plan + Subscription + Payment Link → webhook marks paid).
