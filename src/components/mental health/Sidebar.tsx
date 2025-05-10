"use client"

import Link from "next/link"
import { motion } from "framer-motion"

export const Logo = () => {
  return (
    <Link href="/" className="flex items-center space-x-2 text-lg font-semibold text-primary">
      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">CB</div>
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-medium whitespace-nowrap">
        CBT Wellness
      </motion.span>
    </Link>
  )
}
