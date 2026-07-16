// Shared campaign + enrollment types used across the campaigns feature.
// Kept framework-agnostic so both API routes (server) and clients can import them.

export type CampaignSlug =
  | "speed-to-lead"
  | "14-day-nurture"
  | "dormant-patient-reactivation"
  | "rebooking-reminders"
  | "referral-campaign";

export type CampaignChannel = "Email" | "SMS";
export type CampaignType = "Automatic" | "Manual Enrollment";
export type CampaignStatus = "Active" | "Paused" | "Coming Soon";

export interface CampaignCapabilities {
  /** Manual enrollment ("+ Add Leads") is supported. */
  addLeads: boolean;
  /** Pause / status controls are actually wired up. */
  pauseControl: boolean;
  /** Detail page shows a step funnel. */
  stepFunnel: boolean;
  /** Detail page shows a leads tab. */
  leadsTab: boolean;
  /** Detail page shows a message history tab. */
  messageHistory: boolean;
}

export interface CampaignDefinition {
  slug: CampaignSlug;
  name: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  channels: CampaignChannel[];
  /** Key into the client-side icon map (keeps lucide out of server bundles). */
  icon: string;
  /** Accent hex color for cards / badges. */
  accent: string;
  dataSources: string[];
  /** Value stored in Message Log "Sequence" that identifies this campaign's messages. */
  sequence?: string;
  capabilities: CampaignCapabilities;
}

/** Aggregated, data-derived stats for one campaign. */
export interface CampaignSummary {
  slug: CampaignSlug;
  name: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  channels: CampaignChannel[];
  accent: string;
  icon: string;
  capabilities: CampaignCapabilities;
  totalLeads: number;
  activeLeads: number;
  completedLeads: number;
  messagesSent: number;
  lastActivity: string | null;
  /** Campaign-specific extra metrics (already computed server-side). */
  metrics: Record<string, number | string | null>;
}

// ── Nurture enrollments ────────────────────────────────────────────────

export type EnrollmentStatus = "Active" | "Paused" | "Stopped" | "Completed";

export interface EnrollmentLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  replied: boolean;
  source: string;
  createdAt: string;
}

export interface NurtureEnrollment {
  airtableRecordId: string;
  linkedLeadId: string;
  lead: EnrollmentLead | null;
  status: EnrollmentStatus;
  currentStep: string;
  nextSendAt: string | null;
  lastSentAt: string | null;
  stopReason: string | null;
  stoppedAtStep: string | null;
  createdAt: string;
  notes: string | null;
}

// ── Per-lead campaign membership (for the Leads page) ──────────────────

export type LeadCampaignStatus =
  | "Active"
  | "Paused"
  | "Stopped"
  | "Completed"
  | "Coming Soon";

export interface LeadCampaignSummary {
  campaign: string;
  slug: CampaignSlug;
  status: LeadCampaignStatus;
  currentStep?: string | null;
  enrolledAt?: string | null;
  nextSendAt?: string | null;
  lastSentAt?: string | null;
  stopReason?: string | null;
  enrollmentId?: string | null;
}

// ── Bulk enrollment ────────────────────────────────────────────────────

export interface BulkEnrollNewLead {
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  source?: string;
  notes?: string;
}

export interface BulkEnrollmentRequest {
  leadIds: string[];
  newLeads: BulkEnrollNewLead[];
  /** Canonical UTC instant stored in Airtable. */
  scheduledAtUtc: string;
  /** IANA timezone used to interpret the selected wall-clock values. */
  scheduledTimezone: string;
  scheduledLocalDate: string;
  scheduledLocalTime: string;
}

export interface BulkEnrollmentResultItem {
  leadId?: string;
  rowId?: string;
  name?: string;
  enrollmentId?: string;
  reason?: string;
  retryable?: boolean;
}

export interface BulkEnrollmentSummary {
  selected: number;
  existingLeads: number;
  newLeadsCreated: number;
  enrollmentsCreated: number;
  duplicatesSkipped: number;
  alreadyEnrolled: number;
  invalid: number;
  failed: number;
}

export interface BulkEnrollmentResult {
  success: boolean;
  partial: boolean;
  requestId: string;
  summary: BulkEnrollmentSummary;
  enrolled: BulkEnrollmentResultItem[];
  skipped: BulkEnrollmentResultItem[];
  failed: BulkEnrollmentResultItem[];
  code?: string;
  message?: string;
  retryable?: boolean;
}

export const NURTURE_STEPS = [
  "Day 1 SMS",
  "Day 3 Email",
  "Day 5 SMS",
  "Day 8 Email",
  "Day 12 SMS",
] as const;

export const NURTURE_FUNNEL_STEPS = [...NURTURE_STEPS, "Completed"] as const;
