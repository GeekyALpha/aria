-- Aria security hardening — resolves the 4 Supabase Advisor warnings.
-- Safe to re-run. The app authenticates with the service_role key, which BYPASSES
-- RLS, so enabling RLS does not change app behaviour; anon/authenticated roles are
-- denied by default (no policies) — the correct posture for this single-tenant demo.

-- 1) Enable Row Level Security on all three tables.
alter table public.invoices      enable row level security;
alter table public.conversations enable row level security;
alter table public.actions       enable row level security;

-- No policies are defined: deny-by-default. Add per-role policies only when
-- introducing real client-side auth (see idea.md — out of scope for the demo).

-- 2) Recreate the metrics view as SECURITY INVOKER (was SECURITY DEFINER).
drop view if exists public.dashboard_metrics;

create view public.dashboard_metrics
with (security_invoker = true) as
select
  count(*)::int                                                   as total_invoices,
  count(*) filter (where status = 'overdue')::int                 as overdue_count,
  count(*) filter (where status = 'paid')::int                    as paid_count,
  coalesce(sum(amount_cents) filter (where status in ('overdue','negotiating','in_plan')),0)::bigint as outstanding_cents,
  coalesce(sum(recovered_cents),0)::bigint                        as recovered_cents,
  coalesce(sum(hours_saved),0)::numeric                           as hours_saved
from public.invoices;

comment on view public.dashboard_metrics is
  'Roll-up metrics for the dashboard. security_invoker=true; queried via service_role which bypasses RLS.';
