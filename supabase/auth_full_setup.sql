-- Harmony MedSpa Dashboard auth database setup
-- Paste this into the Supabase SQL editor and run it once.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'harmony_user_role') then
    create type public.harmony_user_role as enum ('admin', 'editor', 'viewer');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  is_active boolean not null default true,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists audit_log_actor_idx on public.audit_log (actor_id);
create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'viewer'),
    true
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, email, full_name, role, is_active)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data->>'full_name', ''),
  coalesce(nullif(users.raw_user_meta_data->>'role', ''), 'viewer'),
  true
from auth.users
left join public.profiles on public.profiles.id = users.id
where public.profiles.id is null;

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_my_role() = 'admin';
$$;

alter table public.profiles enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_admin_only" on public.profiles;
create policy "profiles_update_admin_only"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "profiles_insert_admin_only" on public.profiles;
create policy "profiles_insert_admin_only"
on public.profiles
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "audit_log_select_admin_only" on public.audit_log;
create policy "audit_log_select_admin_only"
on public.audit_log
for select
to authenticated
using (public.is_admin());

drop policy if exists "audit_log_insert_admin_only" on public.audit_log;
create policy "audit_log_insert_admin_only"
on public.audit_log
for insert
to authenticated
with check (public.is_admin());

-- Make the requested initial users admins after creating them in Supabase Auth.
update public.profiles
set role = 'admin',
    is_active = true,
    updated_at = now()
where email in (
  'haydenalamo@harmonymedspafl.com',
  'abdulqayyum3116@gmail.com',
  'shahzaib@codesquad.ai'
);
