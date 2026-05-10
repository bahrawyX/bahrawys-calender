import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "./AppShell";

export const metadata: Metadata = {
  title: "Lumina Calendar — Standalone",
  description:
    "A standalone, dependency-free extraction of the Lumina calendar feature. Tailwind, framer-motion, drag-drop, recurrence, all the same as the live app.",
  applicationName: "Lumina Calendar",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F6F2" },
    { media: "(prefers-color-scheme: dark)", color: "#131316" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body className="bg-warm-50 dark:bg-neutral-dark text-gray-800 dark:text-gray-100">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
