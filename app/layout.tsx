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
  metadataBase: new URL("https://festival360.vercel.app"),
  title: {
    default: "Festival Hub — Platforma digitală pentru festivaluri",
    template: "%s · Festival Hub",
  },
  description:
    "Festival Hub este platforma multi-tenant care transformă festivalurile, târgurile și evenimentele culturale într-o experiență digitală completă.",
  openGraph: {
    type: "website",
    locale: "ro_RO",
    siteName: "Festival Hub",
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
