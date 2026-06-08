import type { NextConfig } from "next";
import { resolveBackendOrigin } from "./src/lib/backend-origin";

/** BE 서버 주소 (FE 4002와 별도). Swagger와 동일하게 BE `PORT`(기본 4003) */
const apiProxyTarget = resolveBackendOrigin();

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
