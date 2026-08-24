import type { NextConfig } from "next";

/**
 * MODO DE DESENHO — temporário.
 *
 * Fora dele, `@sinapsa/mocks` resolve para um stub vazio, então o pacote de
 * fixtures nunca entra no bundle. Não dependemos de tree-shaking para isso:
 * um chunk de produção com dados falsos de paciente é um risco real, não uma
 * questão de tamanho.
 */
const designMock = process.env.NEXT_PUBLIC_DESIGN_MOCK === "true";

if (process.env.NODE_ENV === "production" && designMock) {
  throw new Error("NEXT_PUBLIC_DESIGN_MOCK cannot be enabled in production");
}

const mocksAlias: Record<string, string> = designMock
  ? {}
  : { "@sinapsa/mocks": "./src/lib/mocks-stub.ts" };

const nextConfig: NextConfig = {
  // Os packages do monorepo são publicados como TS cru.
  transpilePackages: ["@sinapsa/ui", "@sinapsa/api-client", "@sinapsa/mocks"],
  reactStrictMode: true,
  reactCompiler: true,
  turbopack: {
    resolveAlias: mocksAlias,
  },
  webpack: (config) => {
    if (!designMock) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@sinapsa/mocks": new URL("./src/lib/mocks-stub.ts", import.meta.url)
          .pathname,
      };
    }
    return config;
  },
};

export default nextConfig;
