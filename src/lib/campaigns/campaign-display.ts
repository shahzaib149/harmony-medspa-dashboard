import type { MessageLog } from "@/types/message-log";

export function displayedNextTouch(currentStep: string) {
  return currentStep || "Step unavailable";
}

export function sentStepsForLead(messages: MessageLog[], leadId: string) {
  return messages
    .filter(
      (message) =>
        message.recipientLeadId === leadId &&
        message.deliveryStatus === "Sent" &&
        Boolean(message.sequenceStep),
    )
    .map((message) => message.sequenceStep as string);
}

export function campaignDeliveryFor(messages: MessageLog[], leadId: string) {
  const logs = messages.filter((message) => message.recipientLeadId === leadId);
  const failed = logs.filter(
    (message) => message.deliveryStatus === "Failed",
  ).length;
  const sent = logs.filter(
    (message) => message.deliveryStatus === "Sent",
  ).length;
  const last = logs
    .slice()
    .sort(
      (a, b) =>
        Date.parse(b.sentAt ?? b.createdTime) -
        Date.parse(a.sentAt ?? a.createdTime),
    )[0];

  return {
    failed,
    sent,
    lastChannel: last?.channel,
    lastActivity: last?.sentAt ?? last?.createdTime ?? null,
    label: !logs.length
      ? "No messages yet"
      : failed === 0
        ? "Healthy"
        : failed < logs.length
          ? "Partial failure"
          : "Needs attention",
    color: !logs.length
      ? "#9292A0"
      : failed === 0
        ? "#4ECDC4"
        : failed < logs.length
          ? "#E6AD55"
          : "#F58A91",
  };
}
