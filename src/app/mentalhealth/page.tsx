"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { BarChart, BookOpen, Brain, Lightbulb, ArrowRight, MessageSquare } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

const features = [
  {
    href: "/mentalhealth/mood-tracker",
    icon: BarChart,
    label: "Track Your Mood",
    description: "Monitor your emotional states over time",
  },
  {
    href: "/mentalhealth/journal",
    icon: BookOpen,
    label: "Guided Journaling",
    description: "Reflect on your thoughts and experiences",
  },
  {
    href: "/mentalhealth/thought-diary",
    icon: Brain,
    label: "Thought Diary",
    description: "Identify and challenge negative thinking patterns",
  },
  {
    href: "/mentalhealth/techniques",
    icon: Lightbulb,
    label: "CBT Techniques",
    description: "Learn and practice evidence-based strategies",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
}

export default function Home() {
  return (
    <ScrollArea className="h-full">
      <div className="min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 gradient-bg">
        <main className="flex-grow flex items-center justify-center">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.h1 className="h1 text-primary mb-4 sm:mb-6" variants={itemVariants}>
              Your Path to Mental Wellness
            </motion.h1>
            <motion.p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-12" variants={itemVariants}>
              Empower yourself with Cognitive Behavioral Therapy techniques, right at your fingertips.
            </motion.p>
            <motion.div variants={itemVariants}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="rounded-full hover-lift">
                  <Link href="/mentalhealth/community">
                    Join Our Community
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full hover-lift">
                  <Link href="/mentalhealth/ai-chat">
                    AI Chat Support
                    <MessageSquare className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div className="mt-12 sm:mt-16 grid gap-6 sm:gap-8 sm:grid-cols-2" variants={containerVariants}>
              {features.map((feature, index) => (
                <motion.div key={feature.href} className="relative group" variants={itemVariants}>
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                  <Link
                    href={feature.href}
                    className="relative flex items-center space-x-4 p-4 sm:p-6 bg-card rounded-lg transition duration-300 hover:shadow-lg glass-effect hover-lift"
                  >
                    <feature.icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary flex-shrink-0" />
                    <div className="text-left">
                      <h3 className="h4 mb-1">{feature.label}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                    <Progress value={index * 20} className="w-16 h-2" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </main>
      </div>
    </ScrollArea>
  )
}
