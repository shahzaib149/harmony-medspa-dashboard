import type { NextConfig } from "next";

const dashboardOrigin = (
  process.env.DASHBOARD_ORIGIN ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "")
).replace(/\/$/, "");

const dashboardPages = [
  "ai-insights", "audit-log", "blogs", "campaigns", "dashboard",
  "google-ads", "google-ads-analytics", "google-business", "lead", "leads",
  "login", "message-log", "message-logs", "nurture", "settings",
  "website-analytics",
];

const dashboardApis = [
  "admin", "ai-quick-ads", "ai-suggestions", "airtable", "audit-actions",
  "audit-logs", "auth", "draft-ad", "google-ads", "google-analytics",
  "google-business", "overview", "settings",
];

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fcpqllxxplkmrbxayeuo.supabase.co",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/specials",
        destination: "https://mailchi.mp/harmonymedspafl/monthly-specials",
        permanent: false,
      },
      {
        source: "/learn-more",
        destination: "https://mailchi.mp/harmonymedspafl/newsletter-opt-in",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    if (!dashboardOrigin) return [];

    const zone = (prefix: string, destinationPrefix = prefix) => [
      { source: `/${prefix}`, destination: `${dashboardOrigin}/${destinationPrefix}` },
      { source: `/${prefix}/:path+`, destination: `${dashboardOrigin}/${destinationPrefix}/:path+` },
    ];

    return [
      ...dashboardPages.flatMap((path) => zone(path)),
      ...dashboardApis.flatMap((path) => zone(`api/${path}`)),
      ...zone("dashboard-static"),
    ];
  },
};

export default nextConfig;
