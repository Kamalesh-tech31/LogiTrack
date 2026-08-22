import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "react-hot-toast";

import { ThemeProvider } from "@/components/theme-provider";
import { ChunkErrorRecovery } from "@/components/common/ChunkErrorRecovery";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "LogiTrack - Smart Logistics Platform",

  description:
    "Track orders, manage deliveries, and monitor logistics with AI-powered insights",

  generator: "v0.app",

  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],

    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "#161616",
                color: "#FFFFFF",
                border: "1px solid #27272A",
                borderRadius: "16px",
                padding: "12px 18px",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
              },
              success: {
                iconTheme: {
                  primary: "#22C55E",
                  secondary: "#FFFFFF",
                },
              },
              error: {
                iconTheme: {
                  primary: "#EF4444",
                  secondary: "#FFFFFF",
                },
              },
            }}
          />

          <ChunkErrorRecovery />
          {children}

          {process.env.NODE_ENV === "production" && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  );
}
