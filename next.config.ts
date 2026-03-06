import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production', // 跳过 TS 类型错误
  },
};

export default nextConfig;
