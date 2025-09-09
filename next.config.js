/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // App Router i18n is handled by middleware.ts + app/[locale]/*
  // Do NOT put `i18n` here.
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [],
  },
}

module.exports = nextConfig
