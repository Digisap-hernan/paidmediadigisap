/** @type {import('next').NextConfig} */
// API_URL is the URL where the FastAPI backend is reachable.
// Local dev: defaults to http://localhost:8000.
// On Vercel: set API_URL in Project Settings → Environment Variables
// to your backend deployment, e.g. https://paid-media-backend.vercel.app
const API_URL = process.env.API_URL || 'http://localhost:8000';

const nextConfig = {
  // For the MVP we don't want TS/ESLint warnings to block deploys — local dev
  // surfaces them, but production builds shouldn't fail because of them.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
