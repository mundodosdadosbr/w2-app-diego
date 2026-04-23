import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // Nota: `experimental.typedRoutes` foi removido porque Turbopack (next dev --turbo)
  // ainda não suporta. Reintroduzir quando Turbopack der suporte, ou rodar
  // `next dev` sem Turbo se precisar de typed routes agora.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ucbbhymgflujbtcopaeb.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default config;
