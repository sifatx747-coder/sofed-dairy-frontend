/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL || 'http://localhost:5000';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // The browser only ever talks to the Next.js origin → httpOnly auth cookies
    // stay first-party in both dev and production. Set API_URL when deploying.
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
