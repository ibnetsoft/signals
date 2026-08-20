create extension if not exists pgcrypto with schema extensions;

create type public.signal_action as enum ('buy', 'sell', 'hold', 'close');
create type public.signal_status as enum ('active', 'closed', 'cancelled');

create table public.signals (
  id uuid primary key default extensions.gen_random_uuid(),
  source text not null default 'metatrader',
  symbol text not null check (symbol ~ '^[A-Z0-9._-]{2,20}$'),
  market text not null default 'forex' check (market in ('forex', 'crypto', 'index', 'commodity')),
  timeframe text not null,
  action public.signal_action not null,
  entry_price numeric(20, 8) not null check (entry_price > 0),
  stop_loss numeric(20, 8),
  take_profit numeric(20, 8),
  confidence smallint check (confidence between 0 and 100),
  strategy text not null,
  status public.signal_status not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source, symbol, strategy, occurred_at)
);

create index signals_latest_idx on public.signals (occurred_at desc);
create index signals_active_idx on public.signals (status, occurred_at desc);

create table public.agent_status (
  agent_id text primary key,
  source text not null default 'metatrader',
  version text,
  terminal_account text,
  last_seen_at timestamptz not null default now(),
  last_signal_at timestamptz,
  details jsonb not null default '{}'::jsonb
);

alter table public.signals enable row level security;
alter table public.agent_status enable row level security;

revoke all on public.signals from anon, authenticated;
revoke all on public.agent_status from anon, authenticated;
grant select on public.signals to anon, authenticated;
grant all on public.signals to service_role;
grant all on public.agent_status to service_role;

create policy "published signals are publicly readable"
on public.signals for select
to anon, authenticated
using (status in ('active', 'closed'));

alter publication supabase_realtime add table public.signals;
