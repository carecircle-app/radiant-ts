/** @type {import("next").NextConfig} */
const nextConfig = {
  // Dont fail Vercel builds on ESLint findings.
  eslint: { ignoreDuringBuilds: true },

  // If you later hit TypeScript-only build errors, temporarily add:
  // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
