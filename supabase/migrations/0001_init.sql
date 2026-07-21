-- Aria — initial schema (3 tables) · idea.md §7
-- Provisioned via Supabase MCP. Safe to re-run (IF NOT EXISTS).

create extension if not exists "pgcrypto";

do $$ begin
  create type invoice_status as enum ('overdue','negotiating','in_plan','paid','disputed','uncollectable');
exception when duplicate_object then null; end $$;

create table if not exists public.invoices (
  id               uuid primary key default gen_random_uuid(),
  debtor_name      text not null,
  debtor_email     text not null,
  amount_cents     integer not null check (amount_cents > 0),
  currency         text not null default 'AUD',
  due_date         date not null,
  status           invoice_status not null default 'overdue',
  xero_ref         text,
  -- Pinch / Pay-in-3 links
  payer_id         text,
  plan_id          text,
  subscription_id  text,
  payment_link_id  text,
  pinch_payment_id text,
  -- agent + demo metadata
  debtor_history   jsonb not null default '{}'::jsonb,
  recovered_cents  integer not null default 0,
  hours_saved      numeric not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices(id) on delete cascade,
  role        text not null check (role in ('agent','debtor','system')),
  channel     text not null default 'email',
  content     text not null,
  reasoning   text,
  created_at  timestamptz not null default now()
);

create table if not exists public.actions (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid not null references public.invoices(id) on delete cascade,
  type            text not null,
  payload         jsonb not null default '{}'::jsonb,
  plan_id         text,
  payment_link_id text,
  status          text not null default 'executed',
  created_at      timestamptz not null default now()
);

create index if not exists invoices_status_idx   on public.invoices (status);
create index if not exists invoices_created_idx   on public.invoices (created_at desc);
create index if not exists conversations_inv_idx on public.conversations (invoice_id, created_at);
create index if not exists actions_inv_idx        on public.actions (invoice_id, created_at);

create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists invoices_touch on public.invoices;
create trigger invoices_touch before update on public.invoices
  for each row execute function public.touch_updated_at();

-- Roll-up view for the dashboard hero/metrics
create or replace view public.dashboard_metrics as
select
  count(*)::int                                                   as total_invoices,
  count(*) filter (where status = 'overdue')::int                 as overdue_count,
  count(*) filter (where status = 'paid')::int                    as paid_count,
  coalesce(sum(amount_cents) filter (where status in ('overdue','negotiating','in_plan')),0)::bigint as outstanding_cents,
  coalesce(sum(recovered_cents),0)::bigint                        as recovered_cents,
  coalesce(sum(hours_saved),0)::numeric                           as hours_saved
from public.invoices;

-- NOTE: RLS is intentionally disabled for this single-merchant demo (service-role key).
