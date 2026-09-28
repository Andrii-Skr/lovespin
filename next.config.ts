import type { NextConfig } from "next";

const configuredDevOrigins = process.env.DEV_ALLOWED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    const privatePages = ["/love/:slug", "/media/:slug", "/certificate/:slug"].map((source) => ({
      source,
      headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    }));
    return [
      ...privatePages,
      {
        source: "/demo",
        headers: [
          { key: "Content-Security-Policy", value: `frame-ancestors 'self' ${process.env.NODE_ENV === "production" ? "https://justours.love" : "http://127.0.0.1:3400"}` },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
  allowedDevOrigins:
    configuredDevOrigins && configuredDevOrigins.length > 0
      ? configuredDevOrigins
      : ["192.168.1.228"],
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
