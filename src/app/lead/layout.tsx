import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Free Consultation | Harmony MedSpa",
  description:
    "Schedule your free MedSpa consultation at Harmony — personalized wellness, injectables, and skin treatments in Sarasota, FL.",
};

export default function LeadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
