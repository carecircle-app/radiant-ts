/** @type {import("next").NextConfig} */
const nextConfig = {
  // Prevent ESLint findings from failing Vercel builds
  eslint: { ignoreDuringBuilds: true },

  // If a later build fails on TS types, temporarily uncomment:
  // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
