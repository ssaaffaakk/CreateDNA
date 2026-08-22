import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The app renders only client-generated object/data URLs, never next/image.
  // Disabling the optimizer removes the /_next/image endpoint and keeps the
  // vulnerable-but-unused sharp code path out of the runtime entirely.
  images: { unoptimized: true },
};

export default nextConfig;
