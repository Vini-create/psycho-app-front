import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Siouve",
    short_name: "Siouve",
    description: "Um espaço para conversar sobre o seu dia a dia, no seu ritmo.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#141312",
    theme_color: "#141312",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/siouve-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/siouve-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/siouve-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/siouve-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
