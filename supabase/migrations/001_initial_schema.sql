-- ─────────────────────────────────────────────────────────────────────────────
-- Harmony Growth Command Center — Initial Schema
-- Run this in your Supabase SQL editor or via the CLI
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Leads ───────────────────────────────────────────────────────────────────

create table if not exists leads (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  email                 text not null,
  phone                 text not null,
  source                text not null check (source in ('google_ads', 'website_form', 'referral', 'returning')),
  treatment_interest    text not null default 'General Inquiry',
  status                text not null default 'new' check (status in ('new', 'contacted', 'nurture', 'booked', 'lost')),
  speed_to_lead_seconds integer,
  created_at            timestamptz not null default now(),
  last_touch_at         timestamptz,
  booked_at             timestamptz,
  notes                 text
);

create index if not exists leads_status_idx on leads (status);
create index if not exists leads_created_at_idx on leads (created_at desc);
create index if not exists leads_source_idx on leads (source);

-- ─── Lead Touches ─────────────────────────────────────────────────────────────

create table if not exists lead_touches (
  id              uuid primary key default uuid_generate_v4(),
  lead_id         uuid not null references leads (id) on delete cascade,
  touch_type      text not null check (touch_type in ('sms', 'email', 'call', 'staff_alert')),
  content_preview text,
  sent_at         timestamptz not null default now(),
  opened_at       timestamptz,
  replied_at      timestamptz
);

create index if not exists lead_touches_lead_id_idx on lead_touches (lead_id);

-- ─── Google Ads Snapshots ────────────────────────────────────────────────────

create table if not exists google_ads_snapshots (
  id              uuid primary key default uuid_generate_v4(),
  date            date not null,
  campaign_id     text not null,
  campaign_name   text not null,
  spend           numeric(10, 2) not null default 0,
  impressions     integer not null default 0,
  clicks          integer not null default 0,
  ctr             numeric(6, 4) not null default 0,
  conversions     integer not null default 0,
  cpl             numeric(10, 2) not null default 0,
  synced_at       timestamptz not null default now(),
  unique (campaign_id, date)
);

create index if not exists google_ads_date_idx on google_ads_snapshots (date desc);

-- ─── Dormant Patients ────────────────────────────────────────────────────────

create table if not exists dormant_patients (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  phone                 text not null,
  email                 text not null,
  last_visit_date       date not null,
  last_treatment        text not null,
  days_inactive         integer not null default 0,
  reactivation_status   text not null default 'not_contacted' check (
    reactivation_status in ('not_contacted', 'sms_sent', 'email_sent', 'replied', 'booked')
  ),
  last_message_at       timestamptz,
  booked_at             timestamptz
);

create index if not exists dormant_patients_status_idx on dormant_patients (reactivation_status);

-- ─── Nurture Enrollments ─────────────────────────────────────────────────────

create table if not exists nurture_enrollments (
  id            uuid primary key default uuid_generate_v4(),
  lead_id       uuid not null references leads (id) on delete cascade,
  enrolled_at   timestamptz not null default now(),
  current_step  integer not null default 1 check (current_step between 1 and 6),
  status        text not null default 'active' check (status in ('active', 'booked', 'lost', 'paused')),
  exited_at     timestamptz
);

create index if not exists nurture_enrollments_status_idx on nurture_enrollments (status);
create index if not exists nurture_enrollments_lead_id_idx on nurture_enrollments (lead_id);

-- ─── Rebooking Reminders ─────────────────────────────────────────────────────

create table if not exists rebooking_reminders (
  id                uuid primary key default uuid_generate_v4(),
  patient_name      text not null,
  phone             text not null,
  treatment         text not null,
  last_visit_date   date not null,
  reminder_date     date not null,
  channel           text not null default 'sms' check (channel in ('sms', 'email', 'both')),
  status            text not null default 'scheduled' check (status in ('scheduled', 'sent', 'opened', 'booked')),
  booked_at         timestamptz
);

create index if not exists rebooking_reminders_date_idx on rebooking_reminders (reminder_date);
create index if not exists rebooking_reminders_status_idx on rebooking_reminders (status);

-- ─── Referrals ───────────────────────────────────────────────────────────────

create table if not exists referrals (
  id                  uuid primary key default uuid_generate_v4(),
  referring_patient   text not null,
  referred_name       text not null,
  referred_phone      text not null,
  referred_email      text not null,
  date                date not null default current_date,
  status              text not null default 'pending' check (status in ('pending', 'converted', 'expired')),
  reward_issued       boolean not null default false,
  converted_at        timestamptz
);

-- ─── AI Insights ─────────────────────────────────────────────────────────────

create table if not exists ai_insights (
  id              uuid primary key default uuid_generate_v4(),
  generated_at    timestamptz not null default now(),
  priority        text not null check (priority in ('URGENT', 'HIGH', 'MEDIUM', 'LOW')),
  category        text not null check (category in ('Google Ads', 'Lead Pipeline', 'Nurture', 'Reactivation', 'Rebooking')),
  title           text not null,
  body            text not null,
  cta_label       text not null,
  cta_route       text not null,
  dismissed       boolean not null default false
);

create index if not exists ai_insights_generated_at_idx on ai_insights (generated_at desc);

-- ─── Settings ────────────────────────────────────────────────────────────────

create table if not exists settings (
  key     text primary key,
  value   jsonb not null default '{}'
);

-- Seed default settings
insert into settings (key, value) values
  ('clinic_info', '{"name":"Harmony MedSpa","timezone":"America/New_York","front_desk_email":"frontdesk@harmonymedspa.com"}'),
  ('sms_config', '{"sender_name":"Harmony MedSpa","staff_alert_method":"both"}'),
  ('referral_config', '{"referring_reward":"$25 credit","new_patient_offer":"15% off first treatment"}')
on conflict (key) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all tables
alter table leads enable row level security;
alter table lead_touches enable row level security;
alter table google_ads_snapshots enable row level security;
alter table dormant_patients enable row level security;
alter table nurture_enrollments enable row level security;
alter table rebooking_reminders enable row level security;
alter table referrals enable row level security;
alter table ai_insights enable row level security;
alter table settings enable row level security;

-- Service role has full access (used by API routes with SUPABASE_SERVICE_ROLE_KEY)
-- Authenticated users (staff) get read/write access

create policy "Service role full access" on leads
  for all using (true);

create policy "Service role full access" on lead_touches
  for all using (true);

create policy "Service role full access" on google_ads_snapshots
  for all using (true);

create policy "Service role full access" on dormant_patients
  for all using (true);

create policy "Service role full access" on nurture_enrollments
  for all using (true);

create policy "Service role full access" on rebooking_reminders
  for all using (true);

create policy "Service role full access" on referrals
  for all using (true);

create policy "Service role full access" on ai_insights
  for all using (true);

create policy "Service role full access" on settings
  for all using (true);
