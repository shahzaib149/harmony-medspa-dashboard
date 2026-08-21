export function trackLeadConversion() {
  if (typeof window === "undefined") return;
  const gtag = (window as any).gtag;
  if (typeof gtag !== "function") return;
  const sendTo = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_SEND_TO;
  const ga4MeasurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

  if (sendTo) {
    gtag("event", "conversion", {
      send_to: sendTo,
      value: 100,
      currency: "USD"
    });
  }

  if (ga4MeasurementId) {
    gtag("event", "generate_lead", {
      send_to: ga4MeasurementId,
      value: 100,
      currency: "USD"
    });
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[gtag] lead events fired", {
      googleAds: Boolean(sendTo),
      ga4: Boolean(ga4MeasurementId)
    });
  }
}
