import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CarbonWise — Track & Reduce Your Carbon Footprint",
  description:
    "CarbonWise helps you track daily carbon emissions from transport, food, energy and shopping. Get personalized AI insights and reduce your environmental impact.",
  keywords:
    "carbon footprint, CO2 tracker, climate change, sustainability, green living, emissions calculator",
  openGraph: {
    title: "CarbonWise — Carbon Footprint Tracker",
    description:
      "Track, understand, and reduce your carbon footprint with personalized AI guidance.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="theme-color" content="#0a0f1a" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <AppProvider>
          <Navbar />
          <main>{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
