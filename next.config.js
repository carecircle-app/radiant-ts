/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // official disable flag
    dirs: [],                 // lint zero dirs (belt & suspenders)
  },
};

module.exports = nextConfig;