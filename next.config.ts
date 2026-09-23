import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    const rawApi = (process.env.NEXT_PUBLIC_API_URL || '').trim();
    const backendUrl = rawApi
      ? rawApi.replace(/\/api\/?$/, '')
      : (process.env.NODE_ENV === 'production' ? 'https://hrms-backend.blueboxx.in' : 'http://127.0.0.1:8000');

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
