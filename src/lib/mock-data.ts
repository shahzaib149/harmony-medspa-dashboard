import type {
  Lead,
  GoogleAdsSnapshot,
  DormantPatient,
  NurtureEnrollment,
  RebookingReminder,
  Referral,
  AIInsight,
} from "./types";

export const mockLeads: Lead[] = [
  { id: "1", name: "Sarah Mitchell", email: "sarah@email.com", phone: "555-0101", source: "google_ads", treatment_interest: "Botox", status: "new", speed_to_lead_seconds: 45, created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), last_touch_at: null, booked_at: null, notes: null },
  { id: "2", name: "Jennifer Torres", email: "jennifer@email.com", phone: "555-0102", source: "website_form", treatment_interest: "HydraFacial", status: "contacted", speed_to_lead_seconds: 38, created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), last_touch_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(), booked_at: null, notes: null },
  { id: "3", name: "Amanda Chen", email: "amanda@email.com", phone: "555-0103", source: "referral", treatment_interest: "Filler", status: "nurture", speed_to_lead_seconds: 55, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), last_touch_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), booked_at: null, notes: "Interested in lip filler" },
  { id: "4", name: "Rachel Kim", email: "rachel@email.com", phone: "555-0104", source: "google_ads", treatment_interest: "Botox", status: "booked", speed_to_lead_seconds: 29, created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), last_touch_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), booked_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), notes: null },
  { id: "5", name: "Michelle Park", email: "michelle@email.com", phone: "555-0105", source: "website_form", treatment_interest: "Laser Hair Removal", status: "lost", speed_to_lead_seconds: 420, created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), last_touch_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), booked_at: null, notes: "Price objection" },
  { id: "6", name: "Lisa Wang", email: "lisa@email.com", phone: "555-0106", source: "google_ads", treatment_interest: "Microneedling", status: "new", speed_to_lead_seconds: 185, created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(), last_touch_at: null, booked_at: null, notes: null },
  { id: "7", name: "Diana Patel", email: "diana@email.com", phone: "555-0107", source: "referral", treatment_interest: "HydraFacial", status: "contacted", speed_to_lead_seconds: 52, created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), last_touch_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), booked_at: null, notes: null },
  { id: "8", name: "Olivia Brooks", email: "olivia@email.com", phone: "555-0108", source: "website_form", treatment_interest: "Botox", status: "nurture", speed_to_lead_seconds: 67, created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), last_touch_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), booked_at: null, notes: null },
];

export const mockGoogleAdsSnapshots: GoogleAdsSnapshot[] = [
  { id: "1", date: "2026-06-21", campaign_id: "c1", campaign_name: "Botox — Local Search", spend: 285, impressions: 4200, clicks: 142, ctr: 3.38, conversions: 8, cpl: 35.63, synced_at: new Date().toISOString() },
  { id: "2", date: "2026-06-21", campaign_id: "c2", campaign_name: "HydraFacial — Brand Awareness", spend: 148, impressions: 11500, clicks: 89, ctr: 0.77, conversions: 1, cpl: 148.00, synced_at: new Date().toISOString() },
  { id: "3", date: "2026-06-21", campaign_id: "c3", campaign_name: "Filler — High Intent", spend: 195, impressions: 2800, clicks: 73, ctr: 2.61, conversions: 5, cpl: 39.00, synced_at: new Date().toISOString() },
  { id: "4", date: "2026-06-21", campaign_id: "c4", campaign_name: "Laser Hair — Promo", spend: 112, impressions: 6300, clicks: 44, ctr: 0.70, conversions: 0, cpl: 0, synced_at: new Date().toISOString() },
  { id: "5", date: "2026-06-21", campaign_id: "c5", campaign_name: "Microneedling — Retargeting", spend: 78, impressions: 3100, clicks: 61, ctr: 1.97, conversions: 4, cpl: 19.50, synced_at: new Date().toISOString() },
];

export const mockDormantPatients: DormantPatient[] = [
  { id: "1", name: "Carol Johnson", phone: "555-0201", email: "carol@email.com", last_visit_date: "2025-10-15", last_treatment: "Botox", days_inactive: 250, reactivation_status: "not_contacted", last_message_at: null, booked_at: null },
  { id: "2", name: "Brenda Smith", phone: "555-0202", email: "brenda@email.com", last_visit_date: "2025-11-02", last_treatment: "HydraFacial", days_inactive: 232, reactivation_status: "sms_sent", last_message_at: "2026-06-15T10:00:00Z", booked_at: null },
  { id: "3", name: "Patricia Davis", phone: "555-0203", email: "patricia@email.com", last_visit_date: "2025-09-20", last_treatment: "Filler", days_inactive: 275, reactivation_status: "replied", last_message_at: "2026-06-18T14:30:00Z", booked_at: null },
  { id: "4", name: "Mary Wilson", phone: "555-0204", email: "mary@email.com", last_visit_date: "2025-12-01", last_treatment: "Laser Hair Removal", days_inactive: 203, reactivation_status: "not_contacted", last_message_at: null, booked_at: null },
  { id: "5", name: "Sandra Martinez", phone: "555-0205", email: "sandra@email.com", last_visit_date: "2025-10-08", last_treatment: "Microneedling", days_inactive: 257, reactivation_status: "booked", last_message_at: "2026-06-10T09:00:00Z", booked_at: "2026-06-20T00:00:00Z" },
  { id: "6", name: "Betty Anderson", phone: "555-0206", email: "betty@email.com", last_visit_date: "2025-11-28", last_treatment: "Botox", days_inactive: 206, reactivation_status: "email_sent", last_message_at: "2026-06-19T11:00:00Z", booked_at: null },
  { id: "7", name: "Dorothy Taylor", phone: "555-0207", email: "dorothy@email.com", last_visit_date: "2025-09-05", last_treatment: "HydraFacial", days_inactive: 290, reactivation_status: "not_contacted", last_message_at: null, booked_at: null },
];

export const mockNurtureEnrollments: (NurtureEnrollment & { lead: Lead })[] = [
  { id: "n1", lead_id: "3", enrolled_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), current_step: 2, status: "active", exited_at: null, lead: mockLeads[2] },
  { id: "n2", lead_id: "8", enrolled_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), current_step: 1, status: "active", exited_at: null, lead: mockLeads[7] },
  { id: "n3", lead_id: "5", enrolled_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(), current_step: 4, status: "active", exited_at: null, lead: mockLeads[4] },
];

export const mockRebookingReminders: RebookingReminder[] = [
  { id: "r1", patient_name: "Emma Sullivan", phone: "555-0301", treatment: "Botox", last_visit_date: "2026-03-22", reminder_date: "2026-06-22", channel: "sms", status: "scheduled", booked_at: null },
  { id: "r2", patient_name: "Grace Thompson", phone: "555-0302", treatment: "HydraFacial", last_visit_date: "2026-05-10", reminder_date: "2026-06-24", channel: "email", status: "scheduled", booked_at: null },
  { id: "r3", patient_name: "Chloe Nguyen", phone: "555-0303", treatment: "Filler", last_visit_date: "2025-12-15", reminder_date: "2026-06-15", channel: "both", status: "sent", booked_at: null },
  { id: "r4", patient_name: "Nora Williams", phone: "555-0304", treatment: "Microneedling", last_visit_date: "2026-04-30", reminder_date: "2026-06-30", channel: "sms", status: "scheduled", booked_at: null },
];

export const mockReferrals: Referral[] = [
  { id: "ref1", referring_patient: "Rachel Kim", referred_name: "Kate Johnson", referred_phone: "555-0401", referred_email: "kate@email.com", date: "2026-06-10", status: "converted", reward_issued: true, converted_at: "2026-06-18T00:00:00Z" },
  { id: "ref2", referring_patient: "Emma Sullivan", referred_name: "Nina Patel", referred_phone: "555-0402", referred_email: "nina@email.com", date: "2026-06-15", status: "pending", reward_issued: false, converted_at: null },
  { id: "ref3", referring_patient: "Rachel Kim", referred_name: "Tara Brown", referred_phone: "555-0403", referred_email: "tara@email.com", date: "2026-06-20", status: "pending", reward_issued: false, converted_at: null },
];

export const mockAIInsights: AIInsight[] = [
  {
    id: "i1",
    generated_at: new Date().toISOString(),
    priority: "URGENT",
    category: "Google Ads",
    title: "Pause 'Laser Hair — Promo' — zero conversions in 7 days at $112 spend",
    body: "The Laser Hair Removal promo campaign has generated 44 clicks but zero bookings over the last 7 days, burning $112 with no return. Your CPL is effectively infinite. Pause immediately and reallocate budget to Botox Local Search which is delivering leads at $35.63 CPL.",
    cta_label: "View Campaign",
    cta_route: "/google-ads",
    dismissed: false,
  },
  {
    id: "i2",
    generated_at: new Date().toISOString(),
    priority: "HIGH",
    category: "Lead Pipeline",
    title: "3 leads have been waiting >5 minutes without contact — call them now",
    body: "Lisa Wang (Microneedling, 20 min ago) and 2 others were submitted via Google Ads but haven't been contacted. Speed-to-lead beyond 5 minutes drops booking probability by 80%. Assign front desk to call within the next 10 minutes.",
    cta_label: "View Leads",
    cta_route: "/leads",
    dismissed: false,
  },
  {
    id: "i3",
    generated_at: new Date().toISOString(),
    priority: "HIGH",
    category: "Reactivation",
    title: "7 dormant patients identified — launch reactivation before end of week",
    body: "You have 7 patients who haven't visited in 6+ months. Based on their last treatments (Botox, HydraFacial, Filler), 3–4 should be due for a follow-up. A reactivation campaign targeting these patients has historically returned 28% to booked status.",
    cta_label: "Launch Reactivation",
    cta_route: "/reactivation",
    dismissed: false,
  },
  {
    id: "i4",
    generated_at: new Date().toISOString(),
    priority: "MEDIUM",
    category: "Google Ads",
    title: "HydraFacial campaign CTR is 0.77% — rewrite the ad copy to lift clicks",
    body: "Your HydraFacial Brand Awareness campaign has 11,500 impressions but only 0.77% CTR versus your 2.5% target. The headline likely isn't speaking to pain points. Use the AI Ad Draft tool to generate 3 new headline variants with urgency triggers.",
    cta_label: "Draft New Ad",
    cta_route: "/google-ads",
    dismissed: false,
  },
  {
    id: "i5",
    generated_at: new Date().toISOString(),
    priority: "MEDIUM",
    category: "Nurture",
    title: "Olivia Brooks is on Day 1 of nurture — verify SMS was delivered",
    body: "Olivia Brooks enrolled in the nurture sequence 36 hours ago and is due for Day 3 outreach tomorrow. Confirm the Day 1 SMS was sent and opened to avoid a gap in the sequence that could lose this lead.",
    cta_label: "View Nurture",
    cta_route: "/nurture",
    dismissed: false,
  },
  {
    id: "i6",
    generated_at: new Date().toISOString(),
    priority: "LOW",
    category: "Rebooking",
    title: "Emma Sullivan is due for a Botox rebooking reminder today",
    body: "Emma Sullivan's last Botox appointment was March 22 — 3 months ago. She's in your rebooking window. Send her a personalised reminder with your current promo to capture the rebook before she books with a competitor.",
    cta_label: "Send Reminder",
    cta_route: "/rebooking",
    dismissed: false,
  },
];

export const mockVisitsData = Array.from({ length: 90 }, (_, i) => {
  const date = new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000);
  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    visits: Math.floor(Math.random() * 8 + 10) + (i > 60 ? Math.floor(i / 10) : 0),
    newPatients: Math.floor(Math.random() * 2 + 1),
  };
});

export const mockLeadSourceData = [
  { name: "Google Ads", value: 42, color: "#1A6B6B" },
  { name: "Website Form", value: 28, color: "#0D2B45" },
  { name: "Referral", value: 18, color: "#10B981" },
  { name: "Returning Patient", value: 12, color: "#F59E0B" },
];
