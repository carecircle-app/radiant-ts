/** Minimal Next config to let "/" render the landing without interference. */
const nextConfig = {
  redirects: async () => [],
  rewrites:  async () => [],
};
export default nextConfig;