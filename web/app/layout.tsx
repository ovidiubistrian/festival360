import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://siteora.ro"),
  title: {
    default:
      "Siteora — Construiește digital orice destinație, eveniment sau instituție",
    template: "%s · Siteora",
  },
  description:
    "Un singur loc pentru site, conținut, program, parteneri, produse, bilete și promovare — pentru evenimente, destinații turistice, muzee, instituții și atracții.",
  openGraph: {
    type: "website",
    locale: "ro_RO",
    siteName: "Siteora",
    // Lățimea/înălțimea contează: fără ele Facebook nu redă poza la prima
    // accesare a linkului. Imaginea e generată de `app/og.png`.
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Siteora",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
