import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Sinapsa",
    short_name: "Sinapsa",
    description: "Um espaço para conversar sobre o seu dia a dia, no seu ritmo.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#141312",
    theme_color: "#141312",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/sinapsa-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/sinapsa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/sinapsa-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/sinapsa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
