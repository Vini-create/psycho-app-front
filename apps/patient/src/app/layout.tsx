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
