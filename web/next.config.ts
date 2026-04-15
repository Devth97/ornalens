import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@ffmpeg-installer/ffmpeg',
    'fluent-ffmpeg',
    '@remotion/bundler',
    '@remotion/renderer',
    'remotion',
    'google-auth-library',
  ],
};

export default nextConfig;
