import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@heritage-dx/types",
    "@heritage-dx/utils",
    "@heritage-dx/api-client",
    "@heritage-dx/auth",
    "@heritage-dx/ui",
    "@heritage-dx/api",
    "@heritage-dx/store",
  ],
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: "https://api.heritage-dx.com/:path*",
      },
    ];
  },
};

export default nextConfig;
