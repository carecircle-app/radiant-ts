/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // official way to skip ESLint on next build
    dirs: [],                 // extra safety: lint zero folders during build
  },
};

module.exports = nextConfig;
