import type { Metadata, Viewport } from "next";
import { Archivo, Newsreader, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

/* As quatro famílias do Brand Book V2 §05.
   Display grotesk / editorial serif / UI sans / metadata mono.
   next/font hospeda tudo no build — nenhuma requisição a CDN em runtime.
   Nunca as quatro na mesma viewport: no máximo três. */
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});


export const metadata: Metadata = {
  title: "Sinapsa.",
  description:
    "Um espaço para conversar sobre o seu dia a dia, no seu ritmo.",
  applicationName: "Sinapsa",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/sinapsa-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/sinapsa-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sinapsa",
  },
};

export const viewport: Viewport = {
  themeColor: "#141312",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      className={`${archivo.variable} ${newsreader.variable} ${instrument.variable} ${plexMono.variable}`}
    >
      <body className="min-h-dvh bg-page text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
