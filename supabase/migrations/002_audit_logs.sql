create extension if not exists pgcrypto;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_name text,
  actor_email_masked text,
  actor_role text check (actor_role is null or actor_role in ('admin', 'editor', 'viewer')),
  action text not null check (action ~ '^[a-z][a-z0-9_]*$'),
  category text not null check (category in ('authentication','users','leads','campaigns','communications','clinic_metrics','settings','google_ads','exports','integrations','system')),
  resource_type text,
  resource_id text,
  resource_label text,
  summary text not null,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb,
  result text not null default 'success' check (result in ('success','failed')),
  request_id text,
  source text,
  user_agent text,
  ip_hash text
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_user_id, created_at desc);
create index if not exists audit_logs_category_idx on public.audit_logs (category, created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action, created_at desc);
create index if not exists audit_logs_result_idx on public.audit_logs (result, created_at desc);
create index if not exists audit_logs_resource_idx on public.audit_logs (resource_type, resource_id);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_select_admin_only" on public.audit_logs;
create policy "audit_logs_select_admin_only"
on public.audit_logs for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_active = true
      and profiles.role = 'admin'
  )
);

-- No insert, update, or delete policies are intentional. The trusted service-role
-- server client appends events and bypasses RLS; dashboard clients are read-only.
revoke insert, update, delete on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;
