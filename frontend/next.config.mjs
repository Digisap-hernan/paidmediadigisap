/** @type {import('next').NextConfig} */
// API_URL is the URL where the FastAPI backend is reachable.
// Local dev: defaults to http://localhost:8000.
// On Vercel: set API_URL in Project Settings → Environment Variables
// to your backend deployment, e.g. https://paid-media-backend.vercel.app
const API_URL = process.env.API_URL || 'http://localhost:8000';

const nextConfig = {
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
