import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // CSV / Excel imports are posted through Server Actions; the 1MB default
      // rejects an ordinary spreadsheet of a few thousand rows.
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
