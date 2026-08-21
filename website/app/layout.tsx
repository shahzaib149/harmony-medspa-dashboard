import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harmony Med Spa | Sarasota, FL",
  description: "Medical spa and wellness center in Sarasota, Florida."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const conversionId = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID?.trim();
  const ga4MeasurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim();
  const validConversionId = conversionId?.match(/^AW-\d+$/) ? conversionId : null;
  const validGa4MeasurementId = ga4MeasurementId?.match(/^G-[A-Z0-9]+$/)
    ? ga4MeasurementId
    : null;
  const googleTagId = validGa4MeasurementId ?? validConversionId;
  const configCommands = [validConversionId, validGa4MeasurementId]
    .filter((id): id is string => Boolean(id))
    .map((id) => `gtag('config', '${id}');`)
    .join("\n                ");

  return (
    <html lang="en">
      <body>
        {googleTagId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
              strategy="afterInteractive"
            />
            <Script id="google-gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                ${configCommands}
              `}
            </Script>
          </>
        ) : null}
        {children}
      </body>
    </html>
  );
}
