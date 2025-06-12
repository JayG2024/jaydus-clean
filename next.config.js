/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com', 'oaidalleapiprodscus.blob.core.windows.net', 'img.clerk.com'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=self, geolocation=(), interest-cohort=()'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;