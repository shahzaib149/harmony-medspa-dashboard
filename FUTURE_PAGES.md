# Harmony Growth Command Center — Future Pages Restoration Guide

This file documents every page, API route, component, and Supabase table
that was removed from the initial deployment to keep the launch lean.
Paste any section below as a prompt to Claude Code to restore that feature.

---

## HOW TO USE THIS FILE

Open Claude Code in the project directory and paste the prompt under
each section exactly as written. Claude will rebuild the full page,
API routes, components, and database migrations from scratch.

---

## PAGE 1 — LEAD PIPELINE (/leads)

### Prompt to restore:
```
Build the Lead Pipeline page at /leads for the Harmony Growth Command Center.

DESIGN: Use the existing color palette (#0D2B45 navy, #1A6B6B teal, #F5F7FA bg,
#FFFFFF cards, Inter font, rounded-2xl cards, shadow-sm).

PAGE LAYOUT:
Top stats row (4 cards):
  - Total Leads | Booked Rate | Avg Speed-to-Lead | Leads in Nurture

Filter bar: by source / date range / status / treatment

Kanban board with 5 columns:
  [New Lead] → [Contacted (<60s)] → [Nurture Active] → [Booked] → [Lost]

Each lead card shows:
  - Name | Source (Google Ad / Form / Referral) | Treatment interest
  - Time since lead created | Last touch timestamp
  - Speed-to-lead badge: Green if <60s, Red if >5min

Lead detail drawer (slide-in from right on card click):
  Full timeline of all touchpoints:
    - Lead created (source, timestamp)
    - SMS #1 sent (timestamp, content preview)
    - Staff alert sent
    - Email touches (nurture sequence steps)
    - Status changes
    - Notes field (manual entry by staff)
  Buttons: "Mark as Booked" / "Mark as Lost" / "Restart Nurture"

SUPABASE TABLES REQUIRED:
leads:
  id, name, email, phone, source, treatment_interest,
  status (new/contacted/nurture/booked/lost),
  speed_to_lead_seconds, created_at, last_touch_at, booked_at, notes

lead_touches:
  id, lead_id, touch_type (sms/email/call/staff_alert),
  content_preview, sent_at, opened_at, replied_at

API ROUTES:
- GET /api/leads — fetch all leads with filters
- PATCH /api/leads/[id] — update lead status/notes
- POST /api/leads/ingest — webhook for new leads from website forms,
  creates lead row, triggers Speed-to-Lead SMS, sends staff alert,
  logs in lead_touches

COMPONENTS NEEDED:
- LeadCard (kanban card): name, source badge, treatment, time elapsed,
  speed-to-lead badge (green <60s, red >5min)
- DrawerPanel (slide-in from right): full touch timeline, action buttons
- StatusBadge: New / Contacted / Nurture / Booked / Lost

Add /leads to the sidebar nav with Users icon from lucide-react.
Use mock data when Supabase tables are empty.
```

---

## PAGE 2 — DORMANT PATIENT REACTIVATION (/reactivation)

### Prompt to restore:
```
Build the Dormant Patient Reactivation page at /reactivation for the
Harmony Growth Command Center.

DESIGN: Use the existing color palette (#0D2B45 navy, #1A6B6B teal,
#F5F7FA bg, #FFFFFF cards, Inter font, rounded-2xl cards, shadow-sm).

PAGE LAYOUT:
Header stat: "18 Dormant Patients Identified" (live count from DB)
Definition: patients with no visit in 6+ months

Patient list table:
  Columns: Name | Last Visit Date | Last Treatment | Days Inactive |
           Reactivation Status | Last Message Sent | Action
  Status badges: Not Contacted / SMS Sent / Email Sent / Replied / Booked

Campaign send panel (right sidebar):
  Message preview (personalised template):
    "Hi [Name], we noticed it's been a while since your [Last Treatment].
    We'd love to welcome you back — [Current Offer]. Reply to book or
    click here: [Link]"
  Send options: SMS only / Email only / SMS + Email
  "Launch Reactivation Campaign" button with confirm modal

Results strip (bottom):
  Sent / Opened / Replied / Booked / Revenue Recovered
  Horizontal funnel bar chart using recharts

SUPABASE TABLE REQUIRED:
dormant_patients:
  id, name, phone, email, last_visit_date, last_treatment,
  days_inactive, reactivation_status, last_message_at, booked_at

API ROUTES:
- GET /api/reactivation — fetch dormant patients list
- POST /api/reactivation/launch — takes list of patient IDs,
  sends personalised SMS/email via MailChimp,
  updates dormant_patients table

COMPONENTS NEEDED:
- StatusBadge for reactivation status
- FunnelBar: horizontal funnel chart (recharts BarChart horizontal)
- Confirm modal before launching campaign

Add /reactivation to the sidebar nav with RefreshCw icon from lucide-react.
Use mock data (18 mock patients) when Supabase is empty.
```

---

## PAGE 3 — NO-BOOK NURTURE SEQUENCE (/nurture)

### Prompt to restore:
```
Build the No-Book Nurture Sequence page at /nurture for the
Harmony Growth Command Center.

DESIGN: Use the existing color palette (#0D2B45 navy, #1A6B6B teal,
#F5F7FA bg, #FFFFFF cards, Inter font, rounded-2xl cards, shadow-sm).

PAGE LAYOUT:
Sequence timeline visual (top of page) — horizontal stepper:
  Day 1  — SMS reminder + booking link
  Day 3  — Treatment email: FAQ + results
  Day 5  — SMS promo: current offer
  Day 8  — Social proof email: reviews
  Day 12 — Urgency SMS: promo deadline
  Day 14 — Long-term nurture list
  Each step: icon + label + "X leads currently here" badge

Active leads table:
  Columns: Name | Lead Source | Treatment Interest | Sequence Day |
           Last Touch | Next Touch Scheduled | Status | Action
  Actions: "Pause" / "Escalate to Front Desk" / "Mark Booked"

Right panel — Sequence performance stats:
  Total in sequence | Exited (booked) | Exited (lost) | Still active
  Conversion rate per step — horizontal bar chart (recharts)
  "Best performing step" callout card

SUPABASE TABLE REQUIRED:
nurture_enrollments:
  id, lead_id, enrolled_at, current_step (1–6),
  status (active/booked/lost/paused), exited_at

API ROUTES:
- GET /api/nurture — fetch all active nurture enrollments
- POST /api/nurture/enroll — enroll a lead into nurture sequence
- PATCH /api/nurture/[id] — update enrollment status

COMPONENTS NEEDED:
- SequenceTimeline: horizontal stepper with step badges
- StatusBadge: Active / Paused / Booked / Lost

Add /nurture to the sidebar nav with Mail icon from lucide-react.
Use mock data when Supabase is empty.
```

---

## PAGE 4 — REBOOKING & REFERRAL ENGINE (/rebooking)

### Prompt to restore:
```
Build the Rebooking & Referral Engine page at /rebooking for the
Harmony Growth Command Center.

DESIGN: Use the existing color palette (#0D2B45 navy, #1A6B6B teal,
#F5F7FA bg, #FFFFFF cards, Inter font, rounded-2xl cards, shadow-sm).

PAGE LAYOUT — TWO TABS: [Rebooking Engine] | [Referral Engine]

TAB 1 — Rebooking Engine:
  Treatment interval config table:
    Columns: Treatment Name | Recommended Interval | Auto-Remind Toggle
    Default rows: Botox (3 months), Filler (6–12 months),
    HydraFacial (4–6 weeks), Chemical Peel (6 weeks), Microneedling (4 weeks)

  Upcoming reminders list:
    Columns: Patient Name | Treatment | Last Visit | Reminder Date |
             Channel (SMS/Email) | Status

  Stats row: Reminders Sent | Opened | Booked | Rebooking Rate %

TAB 2 — Referral Engine:
  Referral offer config:
    - Referring patient reward (default: $25 credit)
    - New patient offer (default: 15% off first treatment)
    - Referral message template preview + edit field

  Active referrals table:
    Columns: Referring Patient | Referred Person | Date | Status |
             Reward Issued

  Stats row: Total Referrals | Converted | Revenue from Referrals |
             Top Referring Patient

SUPABASE TABLES REQUIRED:
rebooking_reminders:
  id, patient_name, phone, treatment, last_visit_date,
  reminder_date, channel, status, booked_at

referrals:
  id, referring_patient, referred_name, referred_phone,
  referred_email, date, status, reward_issued, converted_at

API ROUTES:
- GET /api/rebooking/reminders — fetch upcoming reminders
- GET /api/referrals — fetch referral list
- POST /api/referrals — create new referral entry

COMPONENTS NEEDED:
- Tab switcher (Rebooking / Referral)
- Toggle switch for auto-remind per treatment
- StatusBadge for referral/reminder status

Add /rebooking to the sidebar nav with CalendarCheck icon from lucide-react.
Use mock data when Supabase is empty.
```

---

## PAGE 5 — AI INSIGHTS (/ai-insights)

### Prompt to restore:
```
Build the AI Insights page at /ai-insights for the Harmony Growth
Command Center. This page uses Claude claude-sonnet-4-6 to generate
actionable recommendations across all data sources.

DESIGN: Use the existing color palette (#0D2B45 navy, #1A6B6B teal,
#F5F7FA bg, #FFFFFF cards, Inter font, rounded-2xl cards, shadow-sm).

PAGE LAYOUT:
Top bar:
  "Generate Fresh Insights" button → shows spinner → new cards appear
  "Last generated: X minutes ago" timestamp

Insight cards — 3 per row:
  Each card:
    Priority badge: URGENT (red) / HIGH (orange) / MEDIUM (amber) / LOW (blue)
    Category tag: Google Ads / Lead Pipeline / Nurture / Reactivation / Rebooking
    Title (action-first): e.g. "Pause Botox campaign — CPL is 3× target"
    Body: 2–3 sentences with specific numbers from live data
    CTA button: context-aware "View Campaign" / "Launch Reactivation" / "Edit Sequence"

API ROUTE — POST /api/ai-insights:
  Receives: full dashboard data summary (Google Ads metrics, lead pipeline
  counts, nurture conversion rates, reactivation status, rebooking rates)

  System prompt instructs Claude to:
    - Read all data top-down through the funnel:
      traffic → lead → contact → booked → rebooked
    - Surface the highest-priority fix first
    - Be directive: "Do X" not "Consider X"
    - Reference specific numbers: "Your CPL is $148, target is $80"
    - Return JSON array:
      [{ priority, category, title, body, cta_label, cta_route }]

SUPABASE TABLE REQUIRED:
ai_insights:
  id, generated_at, priority, category, title, body,
  cta_label, cta_route, dismissed

COMPONENT NEEDED:
- InsightCard: priority badge + category tag + title + body + CTA button

Add /ai-insights to the sidebar nav with Sparkles icon from lucide-react.
Generate 6 mock insight cards on first load.
```

---

## PAGE 6 — SETTINGS (/settings)

### Prompt to restore:
```
Build the Settings & Integrations page at /settings for the Harmony
Growth Command Center.

DESIGN: Use the existing color palette (#0D2B45 navy, #1A6B6B teal,
#F5F7FA bg, #FFFFFF cards, Inter font, rounded-2xl cards, shadow-sm).

PAGE LAYOUT — FOUR SECTIONS:

1. Integration Status
   Cards for each platform:
     Google Ads | Google Business Profile | MailChimp | PatientNow | Website Lead Forms
   Each card: Connected / Disconnected badge + last sync timestamp
   Google Ads: shows Customer ID + "Reconnect" button → /api/auth/google
   Google Business: shows Location ID + "Reconnect" button

2. SMS & Messaging Config
   - SMS sender name/number selector
   - After-hours message template editor (textarea)
   - Weekend message template editor (textarea)
   - Staff alert method: SMS / Email / Both (radio group)

3. Treatment & Offer Config
   Table: Treatment name | Rebooking interval | Active promo | Promo expires
   "Add Treatment" button → inline row form
   "Save" saves to Supabase settings table

4. Clinic Info
   - Operating hours per day of week (open/close time per day)
   - Timezone selector
   - Front desk contact for alerts (name + phone + email)

SUPABASE TABLE REQUIRED:
settings:
  key (text, primary key), value (jsonb)
  Seeds: google_tokens, clinic_info, sms_config, treatments

API ROUTES:
- GET /api/settings — fetch all settings
- POST /api/settings — upsert a setting by key

Add /settings to the sidebar nav with Settings icon from lucide-react.
```

---

## MAKE.COM AUTOMATIONS TO REBUILD

When restoring pages 1–4, also set up these Make.com scenarios:

### Scenario 1 — Speed-to-Lead
```
Trigger: Webhook (new lead from website form)
→ HTTP POST to /api/leads/ingest
→ MailChimp: send personalised SMS within 60 seconds
→ MailChimp: send staff alert email/SMS
→ Supabase: log lead + touch
```

### Scenario 2 — No-Book Nurture Scheduler
```
Trigger: Supabase watch (lead status = contacted, no booking after 24h)
→ POST /api/nurture/enroll
→ Schedule Day 1 SMS immediately
→ Subsequent steps at Day 3, 5, 8, 12, 14
```

### Scenario 3 — Dormant Reactivation (Weekly)
```
Trigger: Scheduled (every Monday 9am)
→ Pull dormant_patients from Supabase (days_inactive > 180)
→ Loop: send personalised SMS + Email per patient via MailChimp
→ Update reactivation_status in Supabase
```

### Scenario 4 — Rebooking Reminder (Daily)
```
Trigger: Scheduled (daily 10am)
→ Check rebooking_reminders for today's date
→ For each: send SMS/Email via MailChimp
→ Update status in Supabase
```

---

## SUPABASE MIGRATIONS TO RUN

Run these SQL statements in Supabase SQL Editor when restoring pages:

```sql
-- Lead Pipeline (Page 1)
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  source text, -- google_ad / website_form / referral / returning
  treatment_interest text,
  status text default 'new', -- new/contacted/nurture/booked/lost
  speed_to_lead_seconds integer,
  created_at timestamptz default now(),
  last_touch_at timestamptz,
  booked_at timestamptz,
  notes text
);

create table if not exists lead_touches (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  touch_type text, -- sms/email/call/staff_alert
  content_preview text,
  sent_at timestamptz default now(),
  opened_at timestamptz,
  replied_at timestamptz
);

-- Reactivation (Page 2)
create table if not exists dormant_patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  last_visit_date date,
  last_treatment text,
  days_inactive integer,
  reactivation_status text default 'not_contacted',
  last_message_at timestamptz,
  booked_at timestamptz
);

-- Nurture (Page 3)
create table if not exists nurture_enrollments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  enrolled_at timestamptz default now(),
  current_step integer default 1,
  status text default 'active', -- active/booked/lost/paused
  exited_at timestamptz
);

-- Rebooking & Referral (Page 4)
create table if not exists rebooking_reminders (
  id uuid primary key default gen_random_uuid(),
  patient_name text,
  phone text,
  treatment text,
  last_visit_date date,
  reminder_date date,
  channel text, -- sms/email/both
  status text default 'pending',
  booked_at timestamptz
);

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referring_patient text,
  referred_name text,
  referred_phone text,
  referred_email text,
  date timestamptz default now(),
  status text default 'pending',
  reward_issued boolean default false,
  converted_at timestamptz
);

-- AI Insights (Page 5)
create table if not exists ai_insights (
  id uuid primary key default gen_random_uuid(),
  generated_at timestamptz default now(),
  priority text, -- URGENT/HIGH/MEDIUM/LOW
  category text, -- Google Ads/Lead Pipeline/Nurture/Reactivation/Rebooking
  title text,
  body text,
  cta_label text,
  cta_route text,
  dismissed boolean default false
);

-- Settings (Page 6)
create table if not exists settings (
  key text primary key,
  value jsonb
);
```

---

## ENV VARIABLES TO ADD WHEN RESTORING PAGES 1–4

```env
# MailChimp (for SMS + email automations)
MAILCHIMP_API_KEY=your_mailchimp_api_key
MAILCHIMP_SERVER_PREFIX=us1

# Make.com (for webhook verification)
MAKE_WEBHOOK_SECRET=your_make_webhook_secret
```
