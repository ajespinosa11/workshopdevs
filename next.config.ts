import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.202.245',
    '192.168.207.245',
    '192.168.*',
    '10.*',
    '172.*',
  ],
};

export default nextConfig;
