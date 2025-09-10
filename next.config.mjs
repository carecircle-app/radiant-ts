/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  async rewrites() {
    // Try common env names; use the first one thats valid
    const origin =
      process.env.API_ORIGIN ||
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_ORIGIN ||
      process.env.NEXT_PUBLIC_API_BASE ||
      "";

    if (!/^https?:\/\//i.test(origin)) {
      console.warn("[next.config] No API origin set; skipping /_api proxy.");
      return [];
    }
    const base = origin.replace(/\/+$/, "");
    return [
      { source: "/_api/:path*", destination: `${base}/:path*` }
    ];
  },
};

export default nextConfig;
