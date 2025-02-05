import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/shared/Header"
import type React from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Tutor",
  description: "AI-driven educational platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-b from-gray-900 to-gray-600 text-white min-h-screen`}>
        <Header />
        <main className="container mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}

