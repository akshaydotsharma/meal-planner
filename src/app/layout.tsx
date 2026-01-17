import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meal Recco",
  description: "Your personal AI-powered meal planning assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        {/* Background pattern */}
        <div className="food-pattern" aria-hidden="true" />

        <div className="relative z-10">
          <Navbar />
          <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
