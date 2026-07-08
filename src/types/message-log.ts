export type MessageChannel = "Email" | "SMS" | "Unknown";
export type DeliveryStatus = "Pending" | "Sent" | "Failed" | "Unknown";

export interface MessageLog {
  id: string;
  recipientLeadId: string | null;
  recipientLeadName: string | null;
  recipientLeadEmail: string | null;
  recipientLeadPhone: string | null;
  recipientLeadStatus: string | null;
  channel: MessageChannel;
  messageBody: string;
  deliveryStatus: DeliveryStatus;
  sentAt: string | null;
  mandrillMessageId: string | null;
  errorReason: string | null;
  createdTime: string;
}
