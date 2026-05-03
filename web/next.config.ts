import type { NextConfig } from "next";

const NATIVE_PACKAGES = [
  'ffmpeg-static',
  '@ffmpeg-installer/ffmpeg',
  'fluent-ffmpeg',
  '@remotion/bundler',
  '@remotion/renderer',
  'remotion',
  'google-auth-library',
  'sharp',
];

const nextConfig: NextConfig = {
  serverExternalPackages: NATIVE_PACKAGES,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const existing = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [...existing, ...NATIVE_PACKAGES];
    }
    return config;
  },
};

export default nextConfig;
