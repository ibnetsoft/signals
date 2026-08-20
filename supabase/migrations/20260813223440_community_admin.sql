create type public.profile_status as enum ('pending', 'active', 'suspended', 'withdrawn');
create type public.community_role as enum ('new', 'member', 'trusted', 'moderator', 'admin', 'owner');
create type public.subscription_tier as enum ('free', 'basic', 'pro', 'vip');
create type public.board_type as enum ('general', 'notice', 'qna', 'forex', 'crypto', 'review', 'private');
create type public.board_status as enum ('active', 'inactive', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nickname text not null unique check (char_length(nickname) between 2 and 30),
  status public.profile_status not null default 'active',
  community_role public.community_role not null default 'new',
  subscription_tier public.subscription_tier not null default 'free',
  post_count integer not null default 0 check (post_count >= 0),
  comment_count integer not null default 0 check (comment_count >= 0),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.community_role not null check (role in ('moderator', 'admin', 'owner')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table public.boards (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 50),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  board_type public.board_type not null default 'general',
  status public.board_status not null default 'active',
  read_role public.community_role not null default 'new',
  write_role public.community_role not null default 'member',
  comment_role public.community_role not null default 'new',
  allow_comments boolean not null default true,
  allow_attachments boolean not null default false,
  require_approval boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.role_change_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  previous_role public.community_role not null,
  new_role public.community_role not null,
  reason text not null check (char_length(reason) between 2 and 500),
  changed_by uuid not null references auth.users(id),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.admin_audit_logs (
  id bigint generated always as identity primary key,
  admin_id uuid not null references auth.users(id),
  action text not null,
  target_type text not null,
  target_id text not null,
  before_data jsonb,
  after_data jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index profiles_role_status_idx on public.profiles (community_role, status);
create index profiles_joined_at_idx on public.profiles (joined_at desc);
create index boards_status_sort_idx on public.boards (status, sort_order, created_at);
create index role_change_logs_user_created_idx on public.role_change_logs (user_id, created_at desc);
create index admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.boards enable row level security;
alter table public.role_change_logs enable row level security;
alter table public.admin_audit_logs enable row level security;

revoke all on public.profiles, public.admin_users, public.boards, public.role_change_logs, public.admin_audit_logs from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (nickname, last_seen_at, updated_at) on public.profiles to authenticated;
grant select on public.boards to anon, authenticated;
grant all on public.profiles, public.admin_users, public.boards, public.role_change_logs, public.admin_audit_logs to service_role;

create policy "members can read their profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "members can update safe profile fields"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "active boards are public"
on public.boards for select to anon, authenticated
using (status = 'active');

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, nickname)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''), 'member-' || left(new.id::text, 8))
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure private.handle_new_user();
