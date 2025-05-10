"use client";
import type React from "react";

import { Poppins } from "next/font/google";
import Navigation from "@/components/mental health/Navigation";
import { ScrollToTop } from "@/components/ScrollToTop";
import PageTransition from "@/components/PageTransition";
import { MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export default function ClientRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${poppins.variable}`}>
      <body className="flex flex-col min-h-screen gradient-bg">
        <MotionConfig reducedMotion="user">
          <ScrollToTop />
          <main className="flex-grow container mx-auto px-4 py-8">
            <PageTransition>{children}</PageTransition>
          </main>
          <Navigation />
          <Toaster />
        </MotionConfig>
      </body>
    </html>
  );
}
