"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

interface PageTransitionProps {
  children: ReactNode
}

const variants = {
  hidden: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="hidden"
        animate="enter"
        exit="exit"
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.2,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
