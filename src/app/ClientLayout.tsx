"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { Inter } from "next/font/google"
import { useState, useEffect } from "react"
import "./globals.css"
import 'katex/dist/katex.min.css'; // Import KaTeX CSS
import ResponsiveNavigation from "@/components/shared/Header"
import Header from "@/components/shared/Header"
import Footer from "@/components/shared/Footer"
import { Toaster } from "sonner"

// Import the wallet button component
const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname() // Get the current route
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile for responsive layout adjustments
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkScreenSize()

    // Add event listener
    window.addEventListener("resize", checkScreenSize)

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  // Hide footer for all pages inside `/subject/*` or `/voice-tutor`
  const hideFooter = pathname.startsWith("/subject") || pathname === "/voice-tutor"

  return (
    <html lang="en">
      <body className={`${inter.className} flex`}>
        {/* Responsive Navigation */}
   
        <ResponsiveNavigation />

        {/* Toast notifications */}
        <Toaster richColors position="top-center" />

        {/* Content Area with responsive margin */}
        <div className={`flex-1 flex flex-col min-h-screen ${!isMobile ? "ml-20" : "ml-0"}`}>
          {/* Header with Wallet Button */}
          <div className="flex justify-between items-center">
            <Header />
            
          </div>

          {/* Main Content with responsive padding */}
          <main className={`flex-1 ${isMobile ? "p-4 pb-24" : "p-6"}`}>{children}</main>

          
          
        </div>
     
      </body>
    </html>
  )
}
