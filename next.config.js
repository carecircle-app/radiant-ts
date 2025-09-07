/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // official: skip ESLint during production builds
    dirs: []                  // extra safety: lint zero folders during build
  },
};

module.exports = nextConfig;