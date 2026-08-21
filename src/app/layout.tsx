import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import PageTransitionLoader from "@/components/PageTransitionLoader";
import KokonutLoader from "@/components/KokonutLoader";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Makerlab Workshop",
  description: "Subscription and Booking System for Makerlab Workshops",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <Suspense fallback={<KokonutLoader title="Loading..." subtitle="Please wait while we prepare everything for you" />}>
          <PageTransitionLoader>
            {children}
          </PageTransitionLoader>
        </Suspense>
      </body>
    </html>
  );
}

