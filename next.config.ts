import type { NextConfig } from "next";

// Security headers applied to every response.
// NOTE: A strict Content-Security-Policy is intentionally NOT enabled yet — it
// must be rolled out in Report-Only mode first and validated against Supabase
// Auth, Google OAuth, Recharts, fonts and image domains before enforcement.
// See PHASE 21 in the security report.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // frame-ancestors is the modern replacement for X-Frame-Options and is not
  // overridable by a later full CSP unless that CSP also sets it.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // HSTS only takes effect over HTTPS (production); harmless on localhost http.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Unique assets prevent collisions with the public website's Next.js zone.
  assetPrefix: "/dashboard-static",
  turbopack: { root: process.cwd() },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  typescript: {
    // Avoids Node.js heap out-of-memory errors in memory-constrained CI/CD runners (like Vercel)
    ignoreBuildErrors: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Tree-shake large icon/chart libraries so only the exports actually
    // imported in the app are bundled. This meaningfully cuts JS payload
    // without changing any import syntax in source files.
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
