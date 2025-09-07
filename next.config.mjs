/** @type {import("next").NextConfig} */
const nextConfig = {
  // Don’t fail the production build because of ESLint findings
  eslint: { ignoreDuringBuilds: true },
  // (Optional) If CI ever hits TS errors you haven’t fixed yet, uncomment the next line:
  // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
