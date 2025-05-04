"use client";

import { usePathname } from "next/navigation";
import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import "./globals.css";
import ResponsiveNavigation from "@/components/shared/Header";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Get the current route
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile for responsive layout adjustments
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkScreenSize();
    
    // Add event listener
    window.addEventListener("resize", checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Hide footer for all pages inside `/subject/*`
  const isSubjectPage = pathname.startsWith("/subject");

  return (
    <html lang="en">
      <body className={`${inter.className} flex`}>
        {/* Responsive Navigation */}
        <ResponsiveNavigation />

        {/* Content Area with responsive margin */}
        <div className={`flex-1 flex flex-col min-h-screen ${!isMobile ? 'ml-20' : 'ml-0'}`}>
          {/* Header (Top Navigation) */}
          <Header />

          {/* Main Content with responsive padding */}
          <main className={`flex-1 ${isMobile ? 'p-4 pb-24' : 'p-6'}`}>
            {children}
          </main>

          {/* Conditionally Show Footer */}
          {!isSubjectPage && <Footer />}
        </div>
      </body>
    </html>
  );
}