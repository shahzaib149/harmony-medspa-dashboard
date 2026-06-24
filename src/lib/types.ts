// ─── Lead Pipeline ───────────────────────────────────────────────────────────

export type LeadStatus = "new" | "contacted" | "nurture" | "booked" | "lost";
export type LeadSource = "google_ads" | "website_form" | "referral" | "returning";
export type TouchType = "sms" | "email" | "call" | "staff_alert";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  treatment_interest: string;
  status: LeadStatus;
  speed_to_lead_seconds: number | null;
  created_at: string;
  last_touch_at: string | null;
  booked_at: string | null;
  notes: string | null;
}

export interface LeadTouch {
  id: string;
  lead_id: string;
  touch_type: TouchType;
  content_preview: string | null;
  sent_at: string;
  opened_at: string | null;
  replied_at: string | null;
}

// ─── Google Ads ───────────────────────────────────────────────────────────────

export interface GoogleAdsSnapshot {
  id: string;
  date: string;
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpl: number;
  synced_at: string;
}

// ─── Dormant Patients ────────────────────────────────────────────────────────

export type ReactivationStatus =
  | "not_contacted"
  | "sms_sent"
  | "email_sent"
  | "replied"
  | "booked";

export interface DormantPatient {
  id: string;
  name: string;
  phone: string;
  email: string;
  last_visit_date: string;
  last_treatment: string;
  days_inactive: number;
  reactivation_status: ReactivationStatus;
  last_message_at: string | null;
  booked_at: string | null;
}

// ─── Nurture ─────────────────────────────────────────────────────────────────

export type NurtureStatus = "active" | "booked" | "lost" | "paused";

export interface NurtureEnrollment {
  id: string;
  lead_id: string;
  enrolled_at: string;
  current_step: 1 | 2 | 3 | 4 | 5 | 6;
  status: NurtureStatus;
  exited_at: string | null;
  lead?: Lead;
}

// ─── Rebooking ───────────────────────────────────────────────────────────────

export type ReminderChannel = "sms" | "email" | "both";
export type ReminderStatus = "scheduled" | "sent" | "opened" | "booked";

export interface RebookingReminder {
  id: string;
  patient_name: string;
  phone: string;
  treatment: string;
  last_visit_date: string;
  reminder_date: string;
  channel: ReminderChannel;
  status: ReminderStatus;
  booked_at: string | null;
}

// ─── Referrals ───────────────────────────────────────────────────────────────

export type ReferralStatus = "pending" | "converted" | "expired";

export interface Referral {
  id: string;
  referring_patient: string;
  referred_name: string;
  referred_phone: string;
  referred_email: string;
  date: string;
  status: ReferralStatus;
  reward_issued: boolean;
  converted_at: string | null;
}

// ─── AI Insights ─────────────────────────────────────────────────────────────

export type InsightPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";
export type InsightCategory =
  | "Google Ads"
  | "Lead Pipeline"
  | "Nurture"
  | "Reactivation"
  | "Rebooking";

export interface AIInsight {
  id: string;
  generated_at: string;
  priority: InsightPriority;
  category: InsightCategory;
  title: string;
  body: string;
  cta_label: string;
  cta_route: string;
  dismissed: boolean;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface SettingRow {
  key: string;
  value: Record<string, unknown>;
}

// ─── Ad Draft ────────────────────────────────────────────────────────────────

export interface AdDraft {
  headlines: string[];
  descriptions: string[];
  cta: string;
}

// ─── Date Range ──────────────────────────────────────────────────────────────

export type DateRangeOption = "7" | "14" | "30" | "90" | "custom";

export interface DateRange {
  from: string;
  to: string;
}
