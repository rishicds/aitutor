"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useSidebar } from "./SidebarContext"
import { Button } from "@/components/ui/button"
import type { LinkProps } from "next/link"

type Links = {
  href: string
  label: string
  icon: React.ReactNode
}

export const DesktopSidebar = ({ className, children, ...props }: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar()
  return (
    <motion.div
      className={cn(
        "h-screen px-4 py-6 hidden md:flex md:flex-col bg-card text-card-foreground w-[300px] flex-shrink-0 border-r",
        className,
      )}
      animate={{
        width: animate ? (open ? "300px" : "80px") : "300px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const MobileSidebar = ({ className, children, ...props }: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar()
  return (
    <>
      <div
        className={cn(
          "h-14 px-4 flex md:hidden items-center justify-between bg-card text-card-foreground w-full border-b",
        )}
        {...props}
      >
        <Logo />
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={cn("fixed inset-0 z-50 bg-background p-6 flex flex-col", className)}
          >
            <div className="flex justify-between items-center mb-6">
              <Logo />
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links
  className?: string
  props?: LinkProps
}) => {
  const { open, animate } = useSidebar()
  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-4 py-2 px-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
        className,
      )}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          width: animate ? (open ? "auto" : 0) : "auto",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm whitespace-nowrap overflow-hidden"
      >
        {link.label}
      </motion.span>
    </Link>
  )
}

export const Logo = () => {
  return (
    <Link href="/" className="flex items-center space-x-2 text-lg font-semibold text-primary">
      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">CF</div>
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-medium whitespace-nowrap">
        Cogniflorence
      </motion.span>
    </Link>
  )
}
