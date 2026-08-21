import { CONTACT_WEBHOOK_URL } from "@/lib/constants";

export type LeadFields = {
  name: string;
  email: string;
  phone: string;
  message?: string;
  source: string;
  treatmentInterest?: string;
};

export function formatUsPhoneE164(value: string) {
  const digits = value.replace(/\D/g, "");
  const nationalNumber = digits.startsWith("1") && digits.length >= 11 ? digits.slice(1) : digits;

  if (!nationalNumber) {
    return "";
  }

  return `+1${nationalNumber.slice(-10)}`;
}

export async function submitLead(fields: LeadFields) {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source") ?? "";
  const utmCampaign = params.get("utm_campaign") ?? "";
  const utmMedium = params.get("utm_medium") ?? "";
  const utmAdGroup =
    params.get("utm_ad_group") ??
    params.get("utm_adgroup") ??
    params.get("utm_content") ??
    "";

  const response = await fetch(CONTACT_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Name: fields.name.trim(),
      Email: fields.email.trim(),
      Phone: formatUsPhoneE164(fields.phone),
      Message: fields.message?.trim() ?? "",
      Source: fields.source,
      Status: "New",
      "Treatment Interest": fields.treatmentInterest ?? "",
      "UTM Source": utmSource,
      "UTM Campaign": utmCampaign,
      "UTM Medium": utmMedium,
      "UTM Ad Group": utmAdGroup,
      utm_source: utmSource,
      utm_campaign: utmCampaign,
      utm_medium: utmMedium,
      utm_ad_group: utmAdGroup,
      "Page URL": window.location.href,
      "Lead Created At": new Date().toISOString(),
      "Email Sent Status": "Pending",
      "SMS Sent Status": "Pending"
    })
  });

  if (!response.ok) {
    throw new Error("Webhook request failed");
  }
}
