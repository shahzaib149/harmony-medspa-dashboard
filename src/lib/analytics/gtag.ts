export function trackLeadConversion() {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (window as any).gtag !== "function") return;
  const sendTo = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_SEND_TO;
  if (!sendTo) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).gtag("event", "conversion", {
    send_to: sendTo,
    value: 100,
    currency: "USD",
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[gtag] Fired Google Ads lead conversion event:", sendTo);
  }
}
