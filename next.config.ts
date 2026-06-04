import type { NextConfig } from "next";

/** BE 서버 주소 (FE 4002와 별도). Swagger와 동일하게 BE `PORT`(기본 4003) */
const apiProxyTarget =
  process.env.API_PROXY_TARGET ?? "http://localhost:4003";

const nextConfig: NextConfig = {
  async rewrites() {
    const base = apiProxyTarget.replace(/\/$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${base}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
