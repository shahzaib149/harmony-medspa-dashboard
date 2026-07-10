export const NURTURE_STEPS = [
  "Day 1 SMS",
  "Day 3 Email",
  "Day 5 SMS",
  "Day 8 Email",
  "Day 12 SMS",
] as const;

export type NurtureStep = (typeof NURTURE_STEPS)[number];
export type NurtureStatus = "Active" | "Stopped" | "Completed";

export interface NurtureEnrollment {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  leadStatus: string;
  leadTreatmentInterest: string;
  leadSource: string;
  leadReplied: boolean;
  status: NurtureStatus;
  currentStep: string;
  nextSendAt: string | null;
  lastSentAt: string | null;
  stopReason: string | null;
  enrolledAt: string;
  bookedAt: string | null;
}

export interface NurtureMessage {
  id: string;
  channel: "SMS" | "Email";
  sequenceStep: string;
  messageBody: string;
  sentAt: string;
  deliveryStatus: string;
}

export interface NurtureStats {
  active: number;
  completed: number;
  stopped: number;
  conversionRate: number;
  avgDaysToBook: number | null;
}

export interface NurtureFunnelStep {
  step: string;
  entered: number;
  booked: number;
  stopped: number;
  stillActive: number;
}
