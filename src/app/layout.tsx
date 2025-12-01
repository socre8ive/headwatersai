import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HeadwatersAI - Watershed Intelligence Platform",
  description:
    "Explore watersheds, track water quality, monitor stream gauges, and understand what flows into your water source. Real-time data from USGS, EPA, and NOAA.",
  keywords: [
    "watershed",
    "water quality",
    "stream gauge",
    "USGS",
    "EPA",
    "hydrology",
    "water rights",
    "flood alerts",
  ],
  authors: [{ name: "HeadwatersAI" }],
  openGraph: {
    title: "HeadwatersAI - Watershed Intelligence Platform",
    description:
      "Explore watersheds, track water quality, and understand what flows into your water source.",
    url: "https://headwatersai.com",
    siteName: "HeadwatersAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HeadwatersAI - Watershed Intelligence Platform",
    description:
      "Explore watersheds, track water quality, and understand what flows into your water source.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
