export default {
  async rewrites() {
    return [{ source: "/_api/:path*", destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*` }];
  },
};
