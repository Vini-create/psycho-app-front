import type { Metadata, Viewport } from "next";
import { Archivo_Narrow, STIX_Two_Text, Source_Code_Pro } from "next/font/google";
import { themeScript } from "@sinapsa/ui";
import { Providers } from "@/lib/providers";
import "./globals.css";

/* As três famílias de design.md §3.
   Archivo Narrow ocupa o lugar funcional da Nimbus Sans Narrow, que não
   existe no Google Fonts. next/font hospeda tudo no build — sem CDN. */
const stix = STIX_Two_Text({
  subsets: ["latin"],
  variable: "--font-stix",
  display: "swap",
});

const archivo = Archivo_Narrow({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-archivo",
  display: "swap",
});

const sourceCode = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-source-code",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sinapsa. — Profissional",
  description:
    "Contexto organizado sobre o que seus pacientes relataram entre as sessões.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4f1" },
    { media: "(prefers-color-scheme: dark)", color: "#242527" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${stix.variable} ${archivo.variable} ${sourceCode.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Aplica o tema salvo antes da primeira pintura. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-canvas text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
