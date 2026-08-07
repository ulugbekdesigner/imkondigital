/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Production Docker image'ni yupqa qilish uchun — faqat kerakli fayllar .next/standalone'ga
  output: 'standalone',
  // Monorepo paketlarini kompilyatsiya qilish
  transpilePackages: ['@imkon/ui'],
  // Sekin internet birinchi (CONTRIBUTING.md 10-qoida)
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
