import type { NextConfig } from "next";
import path from "path";
import dns from "node:dns";

// Cloudflare IPv6 도달 불가 환경에서 Node undici가 IPv6를 우선 시도하다
// ETIMEDOUT 나는 문제 방지 — next dev rewrites 프록시 안정화.
dns.setDefaultResultOrder("ipv4first");

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
