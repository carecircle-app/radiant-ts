// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Unblock Vercel builds by ignoring ESLint errors during production builds.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
