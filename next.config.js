/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // disable ESLint during production builds
    dirs: []                  // lint zero folders during build (extra safety)
  },
};

module.exports = nextConfig;