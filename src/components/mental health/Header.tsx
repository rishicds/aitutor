"use client"

import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()

  const isHomePage = pathname === "/"

  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return null
      case "/mood-tracker":
        return "Mood Tracker"
      case "/journal":
        return "Guided Journal"
      case "/thought-diary":
        return "Thought Diary"
      case "/techniques":
        return "CBT Techniques"
      case "/cbt-assistant":
        return "CBT Assistant"
      case "/community":
        return "Community"
      case "/ai-chat":
        return "AI Chat Support"
      default:
        return null
    }
  }

  const pageTitle = getPageTitle()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {!isHomePage && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo.png-Yn98mnj8U3zitky6gMZdph1Zqa4Kne.png"
                alt="Brain Boost Logo"
                width={120}
                height={50}
                className="h-10 w-auto"
              />
            </Link>
          </div>
        </div>

        {pageTitle && (
          <motion.h1
            className="text-lg font-semibold absolute left-1/2 transform -translate-x-1/2 hidden sm:block"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, duration: 0.2 }}
          >
            {pageTitle}
          </motion.h1>
        )}
      </div>
    </header>
  )
}
