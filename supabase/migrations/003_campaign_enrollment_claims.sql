create table if not exists public.campaign_enrollment_claims (
  idempotency_key text primary key,
  campaign_slug text not null,
  identity_hash text not null,
  scheduled_at timestamptz not null,
  request_id uuid not null,
  status text not null default 'processing' check (status in ('processing', 'completed')),
  lead_id text,
  enrollment_id text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaign_enrollment_claims_expires_idx
  on public.campaign_enrollment_claims (expires_at);

alter table public.campaign_enrollment_claims enable row level security;

-- Enrollment claims are server-only coordination records. The service-role
-- client owns every read and write and bypasses RLS.
revoke all on public.campaign_enrollment_claims from anon, authenticated;
