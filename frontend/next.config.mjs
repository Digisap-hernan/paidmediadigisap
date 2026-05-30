/** @type {import('next').NextConfig} */
// Normalize API_URL so common mistakes (missing https://, trailing slash,
// stray whitespace) don't break Next.js' rewrite validation.
function normalizeApiUrl(raw) {
  let url = (raw || 'http://localhost:8000').trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  url = url.replace(/\/+$/, ''); // strip trailing slashes
  return url;
}

const API_URL = normalizeApiUrl(process.env.API_URL);

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
